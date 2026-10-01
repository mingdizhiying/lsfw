import {readFileSync,writeFileSync} from 'node:fs';
writeFileSync(new URL('../src/release-snapshot.js',import.meta.url),'// Generated from RELEASES.md; do not edit.\nexport default '+JSON.stringify(readFileSync(new URL('../RELEASES.md',import.meta.url),'utf8'))+';\n');
