import type { Command } from '../contracts/game.ts';
import type { ClientMessage, GameClient } from '../contracts/protocol.ts';
import { ActionController, actionReason, attributeOrder, findQuestion, questionChoices } from './actions.ts';
import { initialSelection, normalizeSelection, renderScreen, screenAnnouncement } from './screens.ts';

/** Monte l’interface sur un GameClient injecté. Retourne le désabonnement. */
export function mountUi(root: HTMLElement, client: GameClient): () => void {
  root.innerHTML = '<p id="announcements" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><p id="local-error" class="notice error" role="alert" hidden></p><div id="view"></div>';
  const viewElement = root.querySelector<HTMLDivElement>('#view');
  const announcementsElement = root.querySelector<HTMLParagraphElement>('#announcements');
  const localErrorElement = root.querySelector<HTMLParagraphElement>('#local-error');
  if (!viewElement || !announcementsElement || !localErrorElement) throw new Error('Structure de la vue introuvable.');
  const view: HTMLDivElement = viewElement;
  const announcements: HTMLParagraphElement = announcementsElement;
  const localError: HTMLParagraphElement = localErrorElement;
  const controller = new ActionController(client);
  const selection = initialSelection();
  let disposed = false;
  const focus = (id: string): void => { view.querySelector<HTMLElement>('#'+id)?.focus(); };
  const failure = (error: unknown): void => {
    localError.hidden = false;
    localError.textContent = error instanceof Error ? error.message : 'Impossible d’envoyer cette action.';
  };
  const paint = (): void => {
    if (disposed) return;
    const active = document.activeElement;
    const activeId = active instanceof HTMLElement && view.contains(active) ? active.id : '';
    const game = controller.state.session?.game;
    if (game) normalizeSelection(selection, game);
    view.innerHTML = renderScreen(controller.state, controller.pending, selection);
    announcements.textContent = screenAnnouncement(controller.state, controller.pending);
    bind();
    if (activeId) {
      const target = view.querySelector<HTMLElement>('#'+activeId);
      if (target && !target.matches(':disabled')) target.focus();
      else focus('screen-title');
    }
  };
  const sendRequest = (message: ClientMessage): void => {
    if (controller.pending || controller.state.connection !== 'connected') return;
    controller.pending = true;
    localError.hidden = true;
    try { client.send(message); } catch (error) { controller.pending = false; failure(error); }
    paint();
  };
  const sendAction = (command: Command): void => {
    localError.hidden = true;
    try { if (controller.send(command)) selection.confirming = false; }
    catch (error) { failure(error); }
    paint();
  };
  const form = (id: string, handler: (form: HTMLFormElement) => void): void => {
    const element = view.querySelector<HTMLFormElement>('#'+id);
    element?.addEventListener('submit', event => { event.preventDefault(); handler(element); });
  };
  function bind(): void {
    form('setup', element => {
      const data = new FormData(element);
      const mode = data.get('mode'); const penalty = data.get('penalty');
      if ((mode==='solo'||mode==='duo') && (penalty==='immediate_loss'||penalty==='lose_turn')) sendRequest({ protocolVersion: 2, type: 'create-room', mode, penalty });
    });
    form('join', element => {
      const code = new FormData(element).get('roomCode');
      if (typeof code === 'string' && code.trim()) sendRequest({ protocolVersion: 2, type: 'join-room', roomCode: code.trim().toUpperCase() });
    });
    view.querySelector('#ready')?.addEventListener('click', () => sendRequest({ protocolVersion: 2, type: 'ready' }));
    view.querySelector('#leave')?.addEventListener('click', () => {
      controller.pending = false;
      sendRequest({ protocolVersion: 2, type: 'leave' });
    });
    const attribute = view.querySelector<HTMLSelectElement>('#attribute');
    attribute?.addEventListener('change', () => {
      const key = attributeOrder.find(candidate => candidate === attribute.value);
      if (!key) return;
      selection.attribute = key; selection.value = String(questionChoices[key][0]?.value ?? '');
      selection.confirming = false; paint(); focus('attribute');
    });
    const value = view.querySelector<HTMLSelectElement>('#value');
    value?.addEventListener('change', () => { selection.value = value.value; });
    const character = view.querySelector<HTMLSelectElement>('#character');
    character?.addEventListener('change', () => { selection.guessId = character.value; selection.confirming = false; paint(); focus('character'); });
    form('question-form', () => {
      const command = findQuestion(selection.attribute, selection.value);
      if (command) sendAction(command);
    });
    form('guess-form', () => {
      if (actionReason(controller.state, controller.pending)) return;
      selection.confirming = true; paint(); focus('confirmation-title');
    });
    view.querySelector('#confirm-guess')?.addEventListener('click', () => sendAction({ type: 'guess', characterId: selection.guessId }));
    view.querySelector('#cancel-guess')?.addEventListener('click', () => { selection.confirming = false; paint(); focus('propose'); });
    view.querySelector('#confirmation')?.addEventListener('keydown', event => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') { selection.confirming = false; paint(); focus('propose'); }
    });
  }
  const unsubscribe = client.subscribe(state => {
    controller.receive(state); selection.confirming = false; localError.hidden = true; paint();
  });
  paint();
  return () => { disposed = true; unsubscribe(); root.replaceChildren(); };
}
