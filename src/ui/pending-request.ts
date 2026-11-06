import type { ClientMessage, ClientState } from '../contracts/protocol.ts';

/** Une seule demande locale à la fois, sans extension du contrat v2.
 * Les diffusions adverses restent visibles mais ne sont pas des acquittements.
 */
export class PendingRequest {
  private request: ClientMessage | null = null;
  private before: ClientState | null = null;
  get active(): boolean { return this.request !== null; }
  begin(request: ClientMessage, before: ClientState): void {
    if (this.active) throw new Error('Une demande attend déjà sa réponse.');
    const session = before.session;
    if (request.type === 'ready' && session?.readyPlayers.includes(session.playerId)) throw new Error('Vous êtes déjà prêt.');
    this.request = structuredClone(request);
    this.before = structuredClone(before);
  }
  clear(): void { this.request = null; this.before = null; }
  receive(next: ClientState): void {
    const request = this.request;
    if (!request) return;
    // Les erreurs sont adressées à leur auteur ; aucune autre demande locale n’est en vol.
    if (next.connection === 'closed' || next.error !== null) { this.clear(); return; }
    const session = next.session;
    const previous = this.before?.session;
    if (request.type === 'leave') { if (session === null) this.clear(); return; }
    if (!session) return;
    if (request.type === 'create-room') {
      if (!previous && session.playerId === 'p1') this.clear();
      return;
    }
    if (request.type === 'join-room') {
      if (!previous && session.roomCode.toUpperCase() === request.roomCode.toUpperCase()) this.clear();
      return;
    }
    if (!previous || session.roomCode !== previous.roomCode || session.playerId !== previous.playerId) return;
    if (request.type === 'ready') {
      if (session.readyPlayers.includes(session.playerId) || session.game !== null) this.clear();
      return;
    }
    const game = session.game;
    const oldGame = previous.game;
    if (!game || !oldGame || game.viewerId !== oldGame.viewerId) return;
    const history = game.selfPlayer.history;
    const entry = history[oldGame.selfPlayer.history.length];
    const command = request.command;
    if (entry?.type === 'guess' && command.type === 'guess' && entry.characterId === command.characterId) this.clear();
    if (entry?.type === 'question' && command.type === 'question' && entry.attribute === command.attribute && entry.value === command.value) this.clear();
  }
}
