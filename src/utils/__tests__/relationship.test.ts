import type { Relationship } from '@database/schemas';
import { relationshipToAction, otherParticipant } from '@utils/relationship';

const reqId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const connId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

describe('relationshipToAction', () => {
  it('maps none → connect', () => {
    const rel: Relationship = { state: 'none', request_id: null, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'connect' });
  });
  it('maps outgoing_pending → cancel with requestId', () => {
    const rel: Relationship = { state: 'outgoing_pending', request_id: reqId, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'cancel', requestId: reqId });
  });
  it('maps incoming_pending → respond with requestId', () => {
    const rel: Relationship = { state: 'incoming_pending', request_id: reqId, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'respond', requestId: reqId });
  });
  it('maps connected → open with connectionId', () => {
    const rel: Relationship = { state: 'connected', request_id: null, connection_id: connId };
    expect(relationshipToAction(rel)).toEqual({ kind: 'open', connectionId: connId });
  });
  it('maps self → { kind: self }', () => {
    const rel: Relationship = { state: 'self', request_id: null, connection_id: null };
    expect(relationshipToAction(rel)).toEqual({ kind: 'self' });
  });
  it('throws when outgoing_pending has no request_id', () => {
    const rel: Relationship = { state: 'outgoing_pending', request_id: null, connection_id: null };
    expect(() => relationshipToAction(rel)).toThrow();
  });
  it('throws when incoming_pending has no request_id', () => {
    const rel: Relationship = { state: 'incoming_pending', request_id: null, connection_id: null };
    expect(() => relationshipToAction(rel)).toThrow();
  });
  it('throws when connected has no connection_id', () => {
    const rel: Relationship = { state: 'connected', request_id: null, connection_id: null };
    expect(() => relationshipToAction(rel)).toThrow();
  });
});

describe('otherParticipant', () => {
  const me = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const them = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
  it('returns user_b when I am user_a', () => {
    expect(otherParticipant({ user_a_id: me, user_b_id: them }, me)).toBe(them);
  });
  it('returns user_a when I am user_b', () => {
    expect(otherParticipant({ user_a_id: them, user_b_id: me }, me)).toBe(them);
  });
});
