import test from 'node:test';
import assert from 'node:assert/strict';
import { auditAction, auditTime, auditRecordedFields, auditJsonTokens, parseAuditPayload, auditTarget, shortenAuditId } from '../src/utils/auditPresentation.js';

test('audit labels classify exact events without guessing unknown outcomes', () => {
  assert.equal(auditAction('ADMIN_CONVERSATION_INSPECTED').kind, 'access');
  assert.equal(auditAction('USER_UNBANNED').kind, 'confirmation');
  assert.equal(auditAction('UnknownFailedEvent').kind, 'other');
  assert.notEqual(auditAction('ADMIN_CONVERSATION_INSPECTED').title, 'ADMIN_CONVERSATION_INSPECTED');
  assert.equal(shortenAuditId('corr-12345678901234567890123456789'), 'corr-12345…456789');
});
test('audit payload preserves zero results and exact reasons rather than inferring viewed conversations', () => {
  const reason = '  Original reason\nwith details  ';
  const fields = auditRecordedFields(JSON.stringify({ returnedCount: 0, operationalReason: reason, secret: 'hidden' }));
  assert.equal(fields.find(f => f.key === 'returnedCount').value, '0');
  assert.equal(fields.find(f => f.key === 'operationalReason').value, reason);
  assert.equal(fields.length, 2);
});
test('JSON highlighting retains original copy and complete safe text for valid and legacy payloads', () => {
  for (const raw of [' {"reason":"<script>alert(1)</script>","value":-1.2,"ok":true} ', '[null,false,12]', 'null', '"legacy string"', 'unstructured legacy <b>text</b>']) {
    const parsed = parseAuditPayload(raw);
    assert.equal(parsed.original, raw);
    assert.equal(auditJsonTokens(raw).map(t => t.text).join(''), parsed.pretty);
  }
  assert.equal(parseAuditPayload('old raw text').valid, false);
});
test('Vietnam time defaults correctly across midnight and UTC can be selected', () => {
  assert.match(auditTime('2026-11-03T18:00:00'), /04\/11\/2026/);
  assert.match(auditTime('2026-11-03T18:00:00'), /01:00:00/);
  assert.match(auditTime('2026-11-03T18:00:00Z', 'utc'), /18:00:00/);
});
test('related routes require supported entities and valid case identifiers', () => {
  const id = '11111111-2222-4333-8444-555555555555';
  assert.equal(auditTarget({ entityName: 'Dispute', entityId: id }), `/admin/disputes/${id}`);
  assert.equal(auditTarget({ entityName: 'Conversation', entityId: 'list', newValuesJson: JSON.stringify({ disputeId: id }) }), `/admin/conversations?disputeId=${id}`);
  assert.equal(auditTarget({ entityName: 'Conversation', entityId: id }), null);
  assert.equal(auditTarget({ entityName: 'Dispute', entityId: 'javascript:alert(1)' }), null);
  assert.equal(auditTarget({ entityName: 'Unknown', entityId: id }), null);
});
