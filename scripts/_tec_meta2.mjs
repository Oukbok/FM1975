import * as esbuild from 'esbuild';
const r = await esbuild.build({ entryPoints: { app: 'src/main.tsx' }, bundle: true, write: false, outdir: '/tmp/x', format: 'esm', splitting: true, chunkNames: 'chunks/[name]-[hash]', minify: true, jsx: 'automatic', external: ['assets/*'], metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
const outs = r.metafile.outputs;
// statische Hülle von app.js
const seen = new Set(); const q = [Object.keys(outs).find(k => k.endsWith('/app.js'))];
while (q.length) { const k = q.pop(); if (seen.has(k)) continue; seen.add(k); for (const i of outs[k].imports) if (i.kind === 'import-statement') q.push(i.path); }
let tot = 0; const ins = {};
for (const k of seen) { tot += outs[k].bytes; for (const [f, v] of Object.entries(outs[k].inputs)) ins[f] = v.bytesInOutput; }
console.log('statisch beim Start:', (tot/1024).toFixed(0), 'KiB in', seen.size, 'Dateien');
const dir = {}; for (const [k, v] of Object.entries(ins)) { const d = k.split('/').slice(0, 3).join('/'); dir[d] = (dir[d] || 0) + v; }
console.log(Object.entries(dir).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${(v/1024).toFixed(0).padStart(5)}K ${k}`).join('\n'));
console.log(Object.entries(ins).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${(v/1024).toFixed(0).padStart(5)}K ${k}`).join('\n'));
