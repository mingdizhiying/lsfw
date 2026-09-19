import test from 'node:test';
import assert from 'node:assert/strict';
import {clean,hashPassword,verifyPassword,validDate} from '../src/security.js';
test('rich text strips scripts, handlers, external trackers and unsafe protocols',()=>{const out=clean('<h2>Title</h2><p><strong>Text</strong><script>alert(1)</script><img src="https://evil.test/a" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><img src="/media/abc-123" alt="safe"></p>');assert.match(out,/<strong>Text/);assert.match(out,/\/media\/abc-123/);assert.doesNotMatch(out,/script|onerror|evil|javascript/)});
test('password hashes verify only correct password',async()=>{const hash=await hashPassword('a secure test password');assert.equal(await verifyPassword('a secure test password',hash),true);assert.equal(await verifyPassword('wrong',hash),false);assert.equal(await verifyPassword(null,hash),false)});
test('calendar validation rejects impossible dates',()=>{assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2026-09-18'),true)});
