import test from 'node:test';
import assert from 'node:assert/strict';
import {contentId,shanghaiDate} from '../public/editor-compat.js';
test('poetry creation works without randomUUID on older mobile browsers',()=>{const legacy={getRandomValues:a=>crypto.getRandomValues(a)};const ids=Array.from({length:100},()=>contentId(legacy));assert.equal(new Set(ids).size,100);for(const id of ids)assert.match(id,/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);assert.match(contentId({}),/^[a-f\d-]{36}$/)});
test('poetry date is ISO regardless of browser locale, including Shanghai midnight',()=>{assert.equal(shanghaiDate(new Date('2026-09-20T15:59:59Z')),'2026-09-20');assert.equal(shanghaiDate(new Date('2026-09-20T16:00:00Z')),'2026-09-21');assert.equal(shanghaiDate(new Date('2026-12-31T16:00:00Z')),'2027-01-01')});
