import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const file=(path)=>resolve(root,path);
test('monorepo application and service boundaries exist',()=>{
 for(const path of [
  'apps/web/index.html','apps/web/src/App.tsx','apps/web/src/main.tsx',
  'apps/api/server.ts','apps/api/server/discoveryGateway.ts',
  'services/discovery/package.json','services/discovery/prisma/schema.prisma',
  'services/discovery/docker-compose.yml','packages/contracts/src/discovery.ts'
 ]) assert.equal(existsSync(file(path)),true,path);
 for(const oldPath of ['src','server','server.ts','index.html','platform'])
  assert.equal(existsSync(file(oldPath)),false,'obsolete path: '+oldPath);
});
test('root scripts target moved entrypoints',()=>{
 const pkg=JSON.parse(readFileSync(file('package.json'),'utf8'));
 assert.match(pkg.scripts.dev,/apps\/api\/server\.ts/);
 assert.match(pkg.scripts['build:api'],/apps\/api\/server\.ts/);
 const config=readFileSync(file('vite.config.ts'),'utf8');
 assert.match(config,/apps\/web/);
});
test('core DB path remains stable while Discovery owns a separate schema',()=>{
 assert.equal(existsSync(file('prisma/schema.prisma')),true);
 assert.match(readFileSync(file('prisma/schema.prisma'),'utf8'),/provider\s*=\s*"sqlite"/);
 assert.match(readFileSync(file('services/discovery/prisma/schema.prisma'),'utf8'),/provider\s*=\s*"postgresql"/);
});
