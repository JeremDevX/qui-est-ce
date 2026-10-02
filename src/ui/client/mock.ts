import type { GameView, Penalty } from '../../contracts/game.ts';
import type { ClientMessage, ClientState, GameClient, SessionView } from '../../contracts/protocol.ts';
import fixtureData from '../../../fixtures/game-views.json' with { type: 'json' };
import { parseMockScenarios } from './mock-fixtures.ts';

const scenarios = parseMockScenarios(fixtureData);
const firstScenario = scenarios[0];
if (!firstScenario) throw new Error('Les fixtures UI ne contiennent aucun scénario.');
let selectedScenario = firstScenario;
export const mockScenarioNames = scenarios.map(({ name }) => name);
const scenarioListeners = new Set<() => void>();

/** Sélectionne un snapshot d’exemple ; aucune règle du jeu n’est simulée. */
export function selectMockScenario(name: string): void {
  const scenario = scenarios.find((candidate) => candidate.name === name);
  if (!scenario) throw new Error(`Scénario UI inconnu : ${name}.`);
  selectedScenario = scenario;
  for (const notify of scenarioListeners) notify();
}

export function getMockScenarioName(): string { return selectedScenario.name; }

function makeSession(penalty: Penalty): SessionView {
  const game: GameView = { ...structuredClone(selectedScenario.view), penalty };
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
    for (const listener of listeners) listener(structuredClone(state));
  };
  const refreshScenario = (): void => {
    if (state.session) {
      state = { ...state, session: makeSession(state.session.game?.penalty ?? 'immediate_loss') };
      notify();
    }
  };
  scenarioListeners.add(refreshScenario);

  return {
    getState: () => structuredClone(state),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send(message: ClientMessage) {
      if (state.connection === 'closed' || message.type !== 'create-room') return;
      if (selectedScenario.view.mode !== message.mode) {
        const matching = scenarios.find(({ view }) => view.mode === message.mode);
        if (!matching) throw new Error(`Aucun scénario UI pour le mode ${message.mode}.`);
        selectedScenario = matching;
      }
      state = { ...state, error: null, session: makeSession(message.penalty) };
      notify();
    },
    close() {
      scenarioListeners.delete(refreshScenario);
      state = { connection: 'closed', session: null, error: null };
      notify();
    },
  };
}
