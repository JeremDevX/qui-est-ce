import type { Command, GameView } from '../contracts/game.ts';
import type { ClientMessage, GameClient } from '../contracts/protocol.ts';
import { ActionController, actionReason, attributeOrder, findQuestion, questionChoices } from './actions.ts';
import { BoardUpdates } from './board-updates.ts';
import { renderGameDialog, type GameDialog } from './dialogs.ts';
import { initialSelection, normalizeSelection, renderScreen, screenAnnouncement } from './screens.ts';

/** Monte l’interface sur un GameClient injecté. Retourne le désabonnement. */
export function mountUi(
  root: HTMLElement, client: GameClient, simulation = false, reconnect = (): void => {}, inviteBase?: string,
): () => void {
  root.innerHTML = `<p class="sr-only" id="announcements" role="status" aria-live="polite" aria-atomic="true"></p>
    <p class="notice error" id="local-error" role="alert" hidden></p><div id="view"></div>
    <dialog class="game-dialog" aria-labelledby="dialog-title"></dialog>`;
  const view = root.querySelector<HTMLDivElement>('#view');
  const announcements = root.querySelector<HTMLParagraphElement>('#announcements');
  const localError = root.querySelector<HTMLParagraphElement>('#local-error');
  const modal = root.querySelector<HTMLDialogElement>('dialog');
  if (!view || !announcements || !localError || !modal) throw new Error('Structure de la vue introuvable.');
  const controller = new ActionController(client, simulation);
  const selection = initialSelection();
  const invitedRoom = new URLSearchParams(location.search).get('salon') ?? '';
  const initialRoom = /^[A-Z0-9]{6}$/i.test(invitedRoom) ? invitedRoom.toUpperCase() : '';
  let selectedSecret = '';
  let previousGame: GameView | null = null;
  let previousRoom: string | null = null;
  let previousScreen = '';
  let returnToQuestion = false;
  let guessing = false;
  let showResultWhenReady = false;
  let choice: GameDialog | null = null;
  let opener = '';
  let dialogMarkup = '';
  let disposed = false;

  const focus = (id: string): boolean => {
    const target = document.getElementById(id);
    if (!target || !root.contains(target) || target.matches(':disabled')) return false;
    target.focus({ preventScroll: true });
    return true;
  };

  const syncDialog = (): void => {
    const markup = choice ? renderGameDialog(controller.state, controller.pending, choice) : '';
    if (!markup) {
      if (modal.open) modal.close();
      return;
    }
    if (markup !== dialogMarkup || !modal.open) {
      const focused = modal.contains(document.activeElement) ? document.activeElement?.id : undefined;
      modal.innerHTML = dialogMarkup = markup;
      if (!modal.open) modal.showModal();
      if (!focused || !focus(focused)) focus('dialog-title');
    }
  };

  const openDialog = (next: GameDialog, from: string): void => {
    if (!modal.open) {
      opener = from;
      focus(from);
    }
    choice = next;
    syncDialog();
  };

  const revealResult = (): void => {
    if (!showResultWhenReady || board.animating || disposed) return;
    showResultWhenReady = false;
    openDialog({ kind: 'result' }, 'show-result');
  };
  const board = new BoardUpdates(view, revealResult);

  modal.addEventListener('cancel', () => { choice = null; });
  modal.addEventListener('close', () => {
    if (modal.open || disposed) return;
    choice = null;
    const active = document.activeElement;
    if (!active || active === document.body || modal.contains(active)) {
      if (!focus(opener)) focus('screen-title');
    }
  });

  const paint = (): void => {
    if (disposed) return;
    const active = document.activeElement;
    const activeId = active instanceof HTMLElement && view.contains(active) ? active.id : '';
    const state = controller.state;
    const room = state.session?.roomCode ?? null;
    const game = state.session?.game ?? null;
    const screen = game ? 'game' : room ? 'lobby' : 'home';
    const sameGame = room === previousRoom && game?.viewerId === previousGame?.viewerId && game?.mode === previousGame?.mode
      ? previousGame : null;
    const result = game?.status === 'finished' && sameGame?.status !== 'finished';
    const draft = view.querySelector<HTMLFormElement>('#setup');
    const setupValues = draft ? new FormData(draft) : null;
    const roomDraft = view.querySelector<HTMLInputElement>('#room-code')?.value;
    if (game) normalizeSelection(selection, game);
    if (room !== previousRoom) selectedSecret = '';
    if (!sameGame || actionReason(state, controller.pending)) guessing = false;
    if (!sameGame) choice = null;
    if (game?.status !== 'finished') showResultWhenReady = false;
    if (result) {
      choice = null;
      showResultWhenReady = true;
    }

    board.render(renderScreen(state, controller.pending, selection, guessing, selectedSecret, inviteBase), sameGame !== null);
    const newSetup = view.querySelector<HTMLFormElement>('#setup');
    for (const field of ['mode', 'penalty']) {
      const value = setupValues?.get(field);
      const control = newSetup?.elements.namedItem(field);
      if (typeof value === 'string' && (control instanceof RadioNodeList || control instanceof HTMLSelectElement)) control.value = value;
    }
    const theme = newSetup?.elements.namedItem('theme');
    if (theme instanceof HTMLInputElement && setupValues) theme.checked = setupValues.get('theme') === 'politics';
    const newCode = view.querySelector<HTMLInputElement>('#room-code');
    if (newCode) newCode.value = roomDraft ?? initialRoom;
    const announcement = state.error ? '' : guessing ? 'Choisissez un portrait, puis confirmez votre proposition.'
      : screenAnnouncement(state, controller.pending);
    if (announcements.textContent !== announcement) announcements.textContent = announcement;

    revealResult();
    syncDialog();
    const restoreQuestion = returnToQuestion && !controller.pending && activeId === 'screen-title';
    if (!controller.pending) returnToQuestion = false;
    if (!modal.open && !(restoreQuestion && focus('attribute'))
      && ((previousScreen && previousScreen !== screen) || (activeId && !focus(activeId)))) focus('screen-title');
    previousRoom = room;
    previousGame = game;
    previousScreen = screen;
  };

  const failure = (error: unknown): void => {
    localError.hidden = false;
    localError.textContent = error instanceof Error ? error.message : 'Impossible d’envoyer cette action.';
  };
  const sendRequest = (message: ClientMessage): void => {
    if (controller.pending || controller.state.connection !== 'connected') return;
    localError.hidden = true;
    try { controller.sendMessage(message); } catch (error) { failure(error); }
    paint();
  };
  const sendAction = (command: Command): void => {
    localError.hidden = true;
    returnToQuestion = command.type === 'question' && document.activeElement?.id === 'ask';
    try { controller.send(command); } catch (error) { failure(error); }
    paint();
  };

  view.addEventListener('submit', event => {
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (event.target.id === 'question-form') {
      const command = findQuestion(selection.attribute, selection.value);
      if (command) sendAction(command);
      return;
    }
    const data = new FormData(event.target);
    if (event.target.id === 'setup') {
      const mode = data.get('mode');
      const penalty = data.get('penalty');
      if ((mode === 'solo' || mode === 'duo') && (penalty === 'immediate_loss' || penalty === 'lose_turn')) {
        sendRequest({ protocolVersion: 2, type: 'create-room', mode, penalty,
          ...(data.get('theme') === 'politics' ? { theme: 'politics' as const } : {}) });
      }
    } else if (event.target.id === 'join') {
      const code = data.get('roomCode');
      if (typeof code === 'string' && code.trim()) sendRequest({ protocolVersion: 2, type: 'join-room', roomCode: code.trim().toUpperCase() });
    }
  });

  view.addEventListener('change', event => {
    const field = event.target;
    if (field instanceof HTMLInputElement && field.name === 'secret') {
      selectedSecret = field.value;
      paint();
      return;
    }
    if (!(field instanceof HTMLSelectElement)) return;
    if (field.id === 'attribute') {
      const key = attributeOrder.find(candidate => candidate === field.value);
      if (!key) return;
      selection.attribute = key;
      selection.value = String(questionChoices[key][0]?.value ?? '');
      paint();
    } else if (field.id === 'value') {
      selection.value = field.value;
    }
  });

  view.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !guessing) return;
    event.preventDefault();
    guessing = false;
    paint();
    focus('propose');
  });

  view.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('#skip-actions') : null;
    if (link) {
      event.preventDefault();
      focus(link.hash.slice(1));
      return;
    }
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button.dataset.character) {
      openDialog({ kind: guessing ? 'confirm' : 'portrait', characterId: button.dataset.character }, button.id);
    }
    if (button.id === 'show-history') openDialog({ kind: 'history' }, button.id);
    if (button.id === 'show-result') {
      showResultWhenReady = false;
      openDialog({ kind: 'result' }, button.id);
    }
    if (button.id === 'propose' && !actionReason(controller.state, controller.pending)) {
      guessing = !guessing;
      paint();
      if (guessing) {
        const candidate = view.querySelector<HTMLButtonElement>('.suspect-card[data-state="up"]:not([data-will-fold])')
          ?? view.querySelector<HTMLButtonElement>('.suspect-card');
        if (candidate) focus(candidate.id);
      }
    }
    if (button.id === 'ready') {
      const session = controller.state.session;
      if (session && !session.game) {
        if (session.mode === 'solo') sendRequest({ protocolVersion: 2, type: 'ready' });
        if (session.mode === 'duo' && selectedSecret) {
          sendRequest({ protocolVersion: 2, type: 'ready', characterId: selectedSecret });
        }
      }
    }
    if (button.id === 'leave') sendRequest({ protocolVersion: 2, type: 'leave' });
    if (button.id === 'reconnect') reconnect();
  });

  modal.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button.hasAttribute('data-close')) {
      choice = null;
      modal.close();
    }
    if (button.id === 'inspect-guess' && choice?.kind === 'portrait') {
      openDialog({ kind: 'confirm', characterId: choice.characterId }, opener);
    }
    if (button.id === 'confirm-guess' && choice?.kind === 'confirm' && !actionReason(controller.state, controller.pending)) {
      const characterId = choice.characterId;
      choice = null;
      guessing = false;
      modal.close();
      sendAction({ type: 'guess', characterId });
    }
    if (button.id === 'play-again') sendRequest({ protocolVersion: 2, type: 'leave' });
  });

  const unsubscribe = client.subscribe(state => {
    controller.receive(state);
    localError.hidden = true;
    paint();
  });
  paint();
  return () => { disposed = true; unsubscribe(); root.replaceChildren(); };
}
