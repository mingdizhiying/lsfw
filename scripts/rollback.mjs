import {spawnSync} from 'node:child_process';
const [id,...reason]=process.argv.slice(2);
if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id||'')){console.error('用法：npm run rollback -- <Cloudflare版本ID> <原因>');process.exit(1)}
const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','rollback',id,'--message',reason.join(' ')||'Restore known good release'],{stdio:'inherit'});process.exit(r.status??1);
