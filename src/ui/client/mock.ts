import type { GameView, Mode, Penalty } from '../../contracts/game.ts';
import type { ClientMessage, ClientState, GameClient, SessionView } from '../../contracts/protocol.ts';
import fixtureText from '../../../fixtures/game-views.json?raw';

type MockScenario = { name: string; view: GameView };
const scenarios = JSON.parse(fixtureText) as MockScenario[];
if (scenarios.length === 0) throw new Error('Les fixtures UI ne contiennent aucun scénario.');

let selectedScenario = scenarios[0]!;
export const mockScenarioNames = scenarios.map(({ name }) => name);
const scenarioListeners = new Set<() => void>();

/** Sélectionne un snapshot d’exemple ; aucune règle du jeu n’est simulée. */
export function selectMockScenario(name: string): void {
  const scenario = scenarios.find((candidate) => candidate.name === name);
  if (!scenario) return;
  selectedScenario = scenario;
  for (const notify of scenarioListeners) notify();
}

function makeSession(mode: Mode, penalty: Penalty): SessionView {
  const game: GameView = { ...selectedScenario.view, mode, penalty };
  return {
    roomCode: 'SIMUL',
    playerId: game.viewerId,
    readyPlayers: game.players.map(({ id }) => id),
    status: game.status,
    game,
  };
}

export function createMockClient(): GameClient {
  let state: ClientState = { connection: 'connected', session: null, error: null };
  const listeners = new Set<(next: ClientState) => void>();
  const notify = (): void => {
    for (const listener of listeners) listener(state);
  };
  const refreshScenario = (): void => {
    if (state.session) {
      state = { ...state, session: makeSession(state.session.game?.mode ?? 'solo', state.session.game?.penalty ?? 'immediate_loss') };
      notify();
    }
  };
  scenarioListeners.add(refreshScenario);

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send(message: ClientMessage) {
      if (message.type !== 'create-room') return;
      state = { ...state, error: null, session: makeSession(message.mode, message.penalty) };
      notify();
    },
    close() {
      scenarioListeners.delete(refreshScenario);
      state = { connection: 'closed', session: null, error: null };
      notify();
    },
  };
}
