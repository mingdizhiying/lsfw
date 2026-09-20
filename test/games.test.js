import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSteamGames} from '../src/games.js';
test('Steam parsing preserves zero playtime and rejects unavailable library',()=>{assert.deepEqual(parseSteamGames({response:{games:[{appid:10,name:'Test',playtime_forever:0},{appid:20,name:'Other',playtime_forever:150},{appid:30,playtime_forever:-1}]}}),[{appid:10,name:'Test',minutes:0},{appid:20,name:'Other',minutes:150}]);assert.throws(()=>parseSteamGames({response:{}}));assert.deepEqual(parseSteamGames({response:{games:[]}}),[])});
