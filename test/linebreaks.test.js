import test from 'node:test';
import assert from 'node:assert/strict';
import {clean} from '../src/security.js';
test('editor Enter paragraphs and blank lines survive saving safely',()=>{
 assert.equal(clean('第一行<div>第二行</div><div><br></div><div>第三行</div>'),'第一行<p>第二行</p><p><br /></p><p>第三行</p>');
 assert.equal(clean('第一行\n\n第二行'),'第一行\n\n第二行');
 assert.equal(clean('<div onclick="alert(1)">进展</div>'),'<p>进展</p>');
});
