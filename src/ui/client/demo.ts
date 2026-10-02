import type { ClientState, GameClient, SessionView } from '../../contracts/protocol.ts';
import fixtureData from '../../../fixtures/game-views.json' with { type: 'json' };
import { parseMockScenarios } from './mock-fixtures.ts';
import { createMockClient, getMockScenarioName, mockScenarioNames, selectMockScenario } from './mock.ts';

const fixtures = parseMockScenarios(fixtureData);
export const demoSceneLabels: Record<string, string> = {
  solo_initial: 'Solo · début', solo_apres_oui: 'Solo · réponse oui', duo_attente: 'Duo · tour adverse',
  solo_victoire: 'Solo · victoire', lobby: 'Duo · salon', lobby_ready: 'Duo · prêt',
  solo_non: 'Solo · réponse non', solo_defaite: 'Solo · défaite', erreur: 'Erreur reçue', fermeture: 'Connexion fermée',
};
export const demoSceneNames = [...mockScenarioNames, 'lobby', 'lobby_ready', 'solo_non', 'solo_defaite', 'erreur', 'fermeture'];
export interface DemoClient extends GameClient { showScene(name: string): void; getSceneName(): string }

/** Scènes statiques de présentation, sans moteur ni réseau. Une action n’invente jamais sa réponse. */
export function createDemoClient(): DemoClient {
  selectMockScenario('solo_initial');
  const base = createMockClient();
  let state = base.getState();
  let scene = getMockScenarioName();
  const listeners = new Set<(state: ClientState) => void>();
  const publish = (): void => { for (const listener of listeners) listener(structuredClone(state)); };
  const unsubscribe = base.subscribe(next => { state = next; scene = getMockScenarioName(); publish(); });
  const lobby = (ready: boolean): SessionView => ({ roomCode: 'SIMUL', playerId: 'p1', readyPlayers: ready ? ['p1'] : [], status: 'lobby', game: null });
  const showScene = (name: string): void => {
    if (!demoSceneNames.includes(name)) return;
    scene = name;
    if (name === 'lobby' || name === 'lobby_ready') state = { connection: 'connected', session: lobby(name === 'lobby_ready'), error: null };
    else if (name === 'erreur') state = { ...state, connection: 'connected', error: { code: 'INVALID_ACTION', message: 'Exemple d’erreur : cette action n’a pas été acceptée. Vous pouvez réessayer.' } };
    else if (name === 'fermeture') state = { connection: 'closed', session: null, error: null };
    else {
      const fixtureName = name === 'solo_non' ? 'solo_apres_oui' : name === 'solo_defaite' ? 'solo_victoire' : name;
      const source = fixtures.find(fixture => fixture.name === fixtureName);
      if (!source) return;
      const game = structuredClone(source.view);
      // Variantes explicitement écrites pour montrer les écrans ; aucun calcul de règle.
      if (name === 'solo_non') {
        game.selfPlayer.history = [{ type: 'question', attribute: 'glasses', value: true, answer: false }];
        game.selfPlayer.candidateIds = ['c01','c03','c05','c07','c09','c11','c13','c15','c17','c19','c21','c23'];
      }
      if (name === 'solo_defaite') {
        game.winnerId = null;
        game.players = [{ id: 'p1', status: 'lost' }];
        game.selfPlayer.history = [{ type: 'guess', characterId: 'c02', correct: false }];
      }
      state = { connection: 'connected', error: null, session: { roomCode: 'SIMUL', playerId: game.viewerId, readyPlayers: game.players.map(player => player.id), status: game.status, game } };
    }
    publish();
  };
  return {
    getState: () => structuredClone(state),
    getSceneName: () => scene,
    showScene,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    send(message) {
      if (state.connection !== 'connected') return;
      if (message.type === 'create-room') {
        if (message.mode === 'duo') showScene('lobby');
        else base.send(message);
      } else if (message.type === 'join-room') {
        if (message.roomCode === 'SIMUL') showScene('lobby');
        else { state = { ...state, error: { code: 'ROOM_NOT_FOUND', message: 'Dans la démonstration, utilisez le code SIMUL.' } }; publish(); }
      } else if (message.type === 'ready' && state.session?.status === 'lobby') showScene('lobby_ready');
      else if (message.type === 'leave') { state = { connection: 'connected', session: null, error: null }; publish(); }
      // type action : attendre la sélection manuelle d’un snapshot ou d’une erreur.
    },
    close() { unsubscribe(); base.close(); state = { connection: 'closed', session: null, error: null }; publish(); listeners.clear(); },
  };
}
