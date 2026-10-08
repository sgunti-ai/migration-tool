import test from 'node:test';
import assert from 'node:assert/strict';
import {deltaMode} from '../src/deltaDiscovery.js';
test('first scan is initial full',()=>assert.equal(deltaMode(null),'INITIAL_FULL'));
test('saved cursor denotes incremental scan',()=>assert.equal(deltaMode('https://graph.microsoft.com/v1.0/users/delta?$deltatoken=a'),'INCREMENTAL'));
