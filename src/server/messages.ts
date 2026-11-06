import type { AttributeId, Command, Question } from '../contracts/game.ts';
import { PROTOCOL_VERSION, type ClientMessage } from '../contracts/protocol.ts';
import { ATTRIBUTE_IDS, parseAttributeValue } from '../engine/catalog.ts';

export type MessageParseResult =
  | { ok: true; message: ClientMessage }
  | { ok: false; code: 'INVALID_MESSAGE' | 'UNSUPPORTED_VERSION' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
}

function parseAttributeId(value: unknown): AttributeId | null {
  if (typeof value !== 'string') return null;
  return ATTRIBUTE_IDS.find((attribute) => attribute === value) ?? null;
}

function parseQuestion(attribute: AttributeId, value: unknown): Question | null {
  switch (attribute) {
    case 'ageGroup': {
      const parsed = parseAttributeValue('ageGroup', value);
      return parsed === null ? null : { type: 'question', attribute: 'ageGroup', value: parsed };
    }
    case 'clothing': {
      const parsed = parseAttributeValue('clothing', value);
      return parsed === null ? null : { type: 'question', attribute: 'clothing', value: parsed };
    }
    case 'earrings': {
      const parsed = parseAttributeValue('earrings', value);
      return parsed === null ? null : { type: 'question', attribute: 'earrings', value: parsed };
    }
    case 'eyeColor': {
      const parsed = parseAttributeValue('eyeColor', value);
      return parsed === null ? null : { type: 'question', attribute: 'eyeColor', value: parsed };
    }
    case 'facialHair': {
      const parsed = parseAttributeValue('facialHair', value);
      return parsed === null ? null : { type: 'question', attribute: 'facialHair', value: parsed };
    }
    case 'gender': {
      const parsed = parseAttributeValue('gender', value);
      return parsed === null ? null : { type: 'question', attribute: 'gender', value: parsed };
    }
    case 'glasses': {
      const parsed = parseAttributeValue('glasses', value);
      return parsed === null ? null : { type: 'question', attribute: 'glasses', value: parsed };
    }
    case 'hairColor': {
      const parsed = parseAttributeValue('hairColor', value);
      return parsed === null ? null : { type: 'question', attribute: 'hairColor', value: parsed };
    }
    case 'hairLength': {
      const parsed = parseAttributeValue('hairLength', value);
      return parsed === null ? null : { type: 'question', attribute: 'hairLength', value: parsed };
    }
    case 'piercing': {
      const parsed = parseAttributeValue('piercing', value);
      return parsed === null ? null : { type: 'question', attribute: 'piercing', value: parsed };
    }
    case 'skinTone': {
      const parsed = parseAttributeValue('skinTone', value);
      return parsed === null ? null : { type: 'question', attribute: 'skinTone', value: parsed };
    }
  }
}

function parseCommand(value: unknown): Command | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null;
  if (value.type === 'guess' && hasExactKeys(value, ['type', 'characterId'])) {
    return typeof value.characterId === 'string'
      ? { type: 'guess', characterId: value.characterId }
      : null;
  }
  if (value.type === 'question' && hasExactKeys(value, ['type', 'attribute', 'value'])) {
    const attribute = parseAttributeId(value.attribute);
    return attribute ? parseQuestion(attribute, value.value) : null;
  }
  return null;
}

export function parseClientMessage(value: unknown): MessageParseResult {
  if (!isRecord(value)) return { ok: false, code: 'INVALID_MESSAGE' };
  if (Object.hasOwn(value, 'protocolVersion') && value.protocolVersion !== PROTOCOL_VERSION) {
    return { ok: false, code: 'UNSUPPORTED_VERSION' };
  }
  if (value.protocolVersion !== PROTOCOL_VERSION || typeof value.type !== 'string') {
    return { ok: false, code: 'INVALID_MESSAGE' };
  }

  if (value.type === 'create-room' &&
      hasExactKeys(value, ['protocolVersion', 'type', 'mode', 'penalty']) &&
      (value.mode === 'solo' || value.mode === 'duo') &&
      (value.penalty === 'immediate_loss' || value.penalty === 'lose_turn')) {
    return { ok: true, message: {
      protocolVersion: PROTOCOL_VERSION,
      type: 'create-room',
      mode: value.mode,
      penalty: value.penalty,
    } };
  }

  if (value.type === 'join-room' &&
      hasExactKeys(value, ['protocolVersion', 'type', 'roomCode']) &&
      typeof value.roomCode === 'string' && /^[A-Z0-9]{6}$/.test(value.roomCode)) {
    return { ok: true, message: {
      protocolVersion: PROTOCOL_VERSION,
      type: 'join-room',
      roomCode: value.roomCode,
    } };
  }

  if ((value.type === 'ready' || value.type === 'leave') &&
      hasExactKeys(value, ['protocolVersion', 'type'])) {
    return { ok: true, message: { protocolVersion: PROTOCOL_VERSION, type: value.type } };
  }

  if (value.type === 'ready' &&
      hasExactKeys(value, ['protocolVersion', 'type', 'characterId']) &&
      typeof value.characterId === 'string') {
    return { ok: true, message: {
      protocolVersion: PROTOCOL_VERSION, type: 'ready', characterId: value.characterId,
    } };
  }

  if (value.type === 'action' && hasExactKeys(value, ['protocolVersion', 'type', 'command'])) {
    const command = parseCommand(value.command);
    if (command) return { ok: true, message: { protocolVersion: PROTOCOL_VERSION, type: 'action', command } };
  }

  return { ok: false, code: 'INVALID_MESSAGE' };
}
