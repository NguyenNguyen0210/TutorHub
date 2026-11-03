import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChatFile, chatAttachmentPayload } from '../src/utils/chatAttachment.js';

test('chat accepts allowed files up to 10 MB and rejects empty, oversized or executable files', () => {
  for (const name of ['proof.JPG', 'notes.txt', 'lesson.pdf', 'image.gif', 'image.webp']) {
    assert.equal(validateChatFile({ name, size: 10 * 1024 * 1024 }), null);
  }
  for (const file of [{ name: 'empty.txt', size: 0 }, { name: 'big.pdf', size: 10 * 1024 * 1024 + 1 }, { name: 'lesson.pdf.exe', size: 100 }]) {
    assert.ok(validateChatFile(file));
  }
});
test('upload metadata is translated to the message contract without guessing or losing file size', () => {
  assert.deepEqual(chatAttachmentPayload({ storageKey: 'owned-key.pdf', fileName: 'lesson.pdf', contentType: 'application/pdf', size: 120 }), {
    attachmentKey: 'owned-key.pdf', attachmentName: 'lesson.pdf', attachmentContentType: 'application/pdf', attachmentSize: 120,
  });
  assert.throws(() => chatAttachmentPayload({}));
});
