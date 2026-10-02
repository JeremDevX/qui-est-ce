import type { AttributeId, Character, GameView } from '../contracts/game.ts';
import type { ClientState } from '../contracts/protocol.ts';
import { actionReason, attributeLabels, attributeOrder, attributeReason, displayValue, escapeHtml as h, historyLine, questionChoices } from './actions.ts';

export interface Selection { attribute: AttributeId; value: string; guessId: string; confirming: boolean }
export function initialSelection(): Selection { return { attribute: 'hairColor', value: 'noir', guessId: '', confirming: false }; }
export function normalizeSelection(selection: Selection, game: GameView): void {
  if (attributeReason(game, selection.attribute)) {
    const available = attributeOrder.find(key => !attributeReason(game, key));
    if (available) { selection.attribute = available; selection.value = String(questionChoices[available][0]?.value ?? ''); }
  }
  if (!questionChoices[selection.attribute].some(question => String(question.value) === selection.value)) selection.value = String(questionChoices[selection.attribute][0]?.value ?? '');
  if (!game.characters.some(person => person.id === selection.guessId)) selection.guessId = game.characters[0]?.id ?? '';
}
export function screenAnnouncement(state: ClientState, pending: boolean): string {
  if (state.error) return 'Erreur : ' + state.error.message;
  if (state.connection === 'closed') return 'Connexion fermée. La session est abandonnée.';
  if (pending) return 'Action envoyée. En attente de confirmation.';
  const session = state.session;
  if (!session) return 'Préparer ou rejoindre une partie.';
  if (!session.game) return 'Salon ' + session.roomCode + '. ' + (session.readyPlayers.includes(session.playerId) ? 'Vous êtes prêt. Attente de votre adversaire.' : 'Confirmez que vous êtes prêt.');
  const game = session.game;
  if (game.status === 'finished' && game.players.find(player => player.id === game.viewerId)?.status === 'lost') return 'Partie terminée : vous avez perdu.';
  if (game.status === 'finished') return game.winnerId === game.viewerId ? 'Partie terminée : vous avez gagné.' : game.winnerId ? 'Partie terminée : victoire de votre adversaire.' : 'Partie terminée : aucun gagnant.';
  const last = game.selfPlayer.history.at(-1);
  return (last ? historyLine(last, game) + '. ' : '') + (game.activePlayerId === game.viewerId ? 'À vous de jouer.' : 'Au tour de votre adversaire.') + ' ' + game.selfPlayer.remainingTurns + ' actions restantes.';
}
function home(state: ClientState, pending: boolean): string {
  const disabled = state.connection !== 'connected' || pending ? 'disabled' : '';
  return '<main class="welcome-layout"><section class="welcome-copy"><p class="eyebrow">Un jeu de déduction</p><h1>Qui est-ce&nbsp;?</h1><p class="lead">Choisissez une question ou proposez un personnage.</p></section><section class="setup-card"><form id="setup"><h2>Préparer une partie</h2><label for="mode">Mode de jeu</label><select id="mode" name="mode"><option value="solo">Solo</option><option value="duo">Duo</option></select><label for="penalty">Pénalité</label><select id="penalty" name="penalty"><option value="immediate_loss">Défaite immédiate</option><option value="lose_turn">Perdre un tour</option></select><button class="primary-button" '+disabled+'>Créer une partie</button></form><form id="join"><h2>Rejoindre un salon</h2><label for="room-code">Code du salon</label><input id="room-code" name="roomCode" required maxlength="12" autocomplete="off" placeholder="SIMUL" /><button '+disabled+'>Rejoindre</button></form></section></main>';
}
function card(person: Character, candidate: boolean): string {
  const description = attributeOrder.map(key => attributeLabels[key] + ' : ' + displayValue(person.attributes[key])).join('. ');
  const portrait = person.portrait ? '<img class="portrait-image" src="'+h(person.portrait)+'" alt="Portrait de '+h(person.name)+'" />' : '<div class="portrait-placeholder" role="img" aria-label="Portrait provisoire de '+h(person.name)+'"><span aria-hidden="true">☺</span></div>';
  return '<article class="character-card '+(candidate ? '' : 'is-muted')+'">'+portrait+'<div class="card-copy"><span class="character-id">'+h(person.id)+'</span><h3>'+h(person.name)+'</h3><p>'+ (candidate ? 'Candidat' : 'Écarté dans cette vue') +'</p><details><summary>Attributs de '+h(person.name)+'</summary><p>'+h(description)+'</p></details></div></article>';
}
function actionForms(state: ClientState, pending: boolean, selection: Selection, game: GameView): string {
  const reason = actionReason(state, pending);
  const unavailable = reason ? 'disabled' : '';
  const attributes = attributeOrder.map(key => {
    const why = attributeReason(game, key);
    return '<option value="'+key+'" '+(selection.attribute===key?'selected ':'')+(why?'disabled':'')+'>'+h(attributeLabels[key]+(why?' — '+why:''))+'</option>';
  }).join('');
  const values = questionChoices[selection.attribute].map(question => '<option value="'+h(String(question.value))+'" '+(String(question.value)===selection.value?'selected':'')+'>'+h(displayValue(question.value))+'</option>').join('');
  const characters = game.characters.map(person => '<option value="'+h(person.id)+'" '+(person.id===selection.guessId?'selected':'')+'>'+h(person.name)+(game.selfPlayer.candidateIds.includes(person.id)?'':' — écarté')+'</option>').join('');
  const selected = game.characters.find(person => person.id === selection.guessId);
  const confirm = selection.confirming && !reason ? '<section id="confirmation" class="notice" aria-labelledby="confirmation-title"><h3 id="confirmation-title" tabindex="-1">Confirmer la proposition</h3><p>Proposer '+h(selected?.name ?? '')+' ? '+(game.penalty==='immediate_loss'?'Une erreur entraîne la défaite.':'Une erreur consomme une action.')+'</p><button id="confirm-guess" class="primary-button">Confirmer</button><button id="cancel-guess" type="button">Annuler</button></section>' : '';
  return '<section class="action-panel" aria-labelledby="actions-title" aria-busy="'+pending+'"><h2 id="actions-title">Votre action</h2><p id="action-state">'+h(reason ?? 'Choisissez un attribut et une valeur, ou proposez un personnage.')+'</p><div class="action-columns"><form id="question-form"><fieldset '+unavailable+'><legend>Poser une question</legend><label for="attribute">Attribut</label><select id="attribute" aria-describedby="action-state">'+attributes+'</select><label for="value">Valeur</label><select id="value">'+values+'</select><button id="ask" class="primary-button" '+(attributeReason(game,selection.attribute)?'disabled':'')+'>Poser la question</button></fieldset></form><form id="guess-form"><fieldset '+unavailable+'><legend>Proposer un personnage</legend><label for="character">Personnage</label><select id="character">'+characters+'</select><button id="propose">Vérifier ma proposition</button></fieldset></form></div>'+confirm+'</section>';
}
export function renderScreen(state: ClientState, pending: boolean, selection: Selection): string {
  const error = state.error ? '<p class="notice error" role="alert">'+h(state.error.message)+' <small>('+h(state.error.code)+')</small></p>' : '';
  const connection = state.connection !== 'connected' ? '<p class="notice">'+h(state.connection==='closed'?'Connexion fermée : la session est abandonnée. Rechargez la page pour recommencer.':'Connexion en cours…')+'</p>' : '';
  const session = state.session;
  if (!session) return error+connection+home(state, pending);
  const leave = '<button id="leave" type="button">Quitter la session</button>';
  if (!session.game) {
    const ready = session.readyPlayers.includes(session.playerId);
    return error+connection+'<main class="game-layout"><h1 tabindex="-1" id="screen-title">Salon '+h(session.roomCode)+'</h1><p>Votre joueur : '+h(session.playerId)+'</p><ul><li>Vous : '+(ready?'prêt':'pas encore prêt')+'</li><li>Adversaire : '+(session.readyPlayers.some(id=>id!==session.playerId)?'prêt':'en attente')+'</li></ul><p>La partie commencera quand le client recevra la vue de jeu.</p><button id="ready" class="primary-button" '+(ready||pending||state.connection!=='connected'?'disabled':'')+'>Je suis prêt</button>'+leave+'</main>';
  }
  const game = session.game;
  const candidates = new Set(game.selfPlayer.candidateIds);
  const final = game.status==='finished' ? '<section class="notice" aria-labelledby="result-title"><h2 id="result-title">'+h(screenAnnouncement(state,false))+'</h2><ul>'+Object.entries(game.revealedTargets ?? {}).map(([player,id])=>'<li>Cible de '+h(player)+' : '+h(game.characters.find(person=>person.id===id)?.name ?? id ?? '')+'</li>').join('')+'</ul></section>' : '';
  const history = game.selfPlayer.history.length ? '<ol>'+game.selfPlayer.history.map(entry=>'<li>'+h(historyLine(entry,game))+'</li>').join('')+'</ol>' : '<p>Aucune action confirmée.</p>';
  return error+connection+'<main class="game-layout"><header class="game-heading"><div><p class="eyebrow">'+(game.mode==='solo'?'Solo':'Duo')+' · salon '+h(session.roomCode)+'</p><h1 id="screen-title" tabindex="-1">La galerie</h1></div>'+leave+'</header><p class="turn-pill">'+h(screenAnnouncement(state,pending))+'</p><section class="status-grid" aria-label="Résumé de la partie"><article class="status-card"><span>Actions restantes</span><strong>'+game.selfPlayer.remainingTurns+'<small> / 6</small></strong></article><article class="status-card"><span>Candidats</span><strong>'+candidates.size+'<small> / '+game.characters.length+'</small></strong></article><article class="status-card"><span>Attribut interdit</span><strong>'+h(attributeLabels[game.forbiddenAttribute])+'</strong></article></section>'+final+actionForms(state,pending,selection,game)+'<section class="history-panel" aria-labelledby="history-title"><h2 id="history-title">Votre historique</h2>'+history+'</section><h2>Les '+game.characters.length+' personnages</h2><section class="character-grid" aria-label="Personnages">'+game.characters.map(person=>card(person,candidates.has(person.id))).join('')+'</section></main>';
}
