import test from 'node:test';
import assert from 'node:assert/strict';
import {timestamp,dateParagraph,orderSections} from '../public/project-order.js';
test('recognize plain date paragraph used by website updates',()=>{assert.ok(dateParagraph('2026-10-09'));assert.ok(dateParagraph('2026年10月9日'));assert.ok(!dateParagraph('更新于2026-10-09'));assert.equal(timestamp('2026-02-30'),null);assert.equal(timestamp('2026-10-09 25:00'),null);});
test('sort by timestamps instead of reversing source; stable equal dates and unknowns',()=>{const rows=[{title:'B',time:timestamp('2026-10-07')},{title:'C',time:timestamp('2026-10-09')},{title:'A',time:timestamp('2026-09-18')},{title:'D',time:null},{title:'E',time:timestamp('2026-10-09')}];assert.deepEqual(orderSections(rows,'asc').map(x=>x.title),['A','B','C','E','D']);assert.deepEqual(orderSections(rows,'desc').map(x=>x.title),['C','E','B','A','D']);});
