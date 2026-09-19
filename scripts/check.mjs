import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
for(const dir of ['src','public','scripts'])for(const file of readdirSync(dir)){if(!/\.m?js$/.test(file))continue;const r=spawnSync(process.execPath,['--check',dir+'/'+file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
