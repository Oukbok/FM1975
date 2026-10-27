// Spielt einige Spieltage und fotografiert alle Reiter des Spielerprofils (Ueberhang-Pruefung).
//   SECS=150 node tests/profile-history.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'; import { join, extname } from 'node:path';
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const s=createServer(async(q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';try{r.writeHead(200,{'Content-Type':T[extname(p)]||'x'}).end(await readFile(join('dist',p)))}catch{r.writeHead(404).end()}}).listen(0);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/fonts\./,r=>r.abort());
await pg.goto(`http://127.0.0.1:${s.address().port}/`);
await pg.click('text=Neues Spiel');await pg.fill('input[placeholder*="Mustermann"]','Test');await pg.click('.club-pick >> nth=0');
await pg.locator('input[type=range]').fill('300');await pg.click('text=SAISON STARTEN');await pg.waitForTimeout(800);
const weiter = pg.getByRole('button', { name: /weiter/i }).first();
const end=Date.now()+Number(process.env.SECS||90)*1000;
while(Date.now()<end){
  for (const sel of ['button:has-text("Spiel simulieren")','button:has-text("Überspringen")','button:has-text("Fortsetzen")','button:has-text("Zum Spielbericht")','button:has-text("Schließen")','button:has-text("Weiter zum")','button:has-text("OK")','.modal-close']) { const x=pg.locator(sel).first(); if (await x.isVisible().catch(()=>false)) await x.click().catch(()=>{}); }
  if (await weiter.isVisible().catch(()=>false)) await weiter.click().catch(()=>{});
  await pg.waitForTimeout(1000);
}
// pausieren
const pause = pg.getByRole('button', { name: /pause/i }).first(); if (await pause.isVisible().catch(()=>false)) await pause.click();
await pg.waitForTimeout(500);
console.log('Datum', (await pg.locator('body').innerText()).match(/\d{1,2}\. \w+ 19\d\d/)?.[0]);
for (let k=0;k<12 && await pg.locator('.modal-overlay').count();k++){ for (const sel of ['button:has-text("Überspringen")','button:has-text("Fortsetzen")','button:has-text("Zum Spielbericht")','button:has-text("Schließen")','.modal-close']) { const x=pg.locator(sel).first(); if (await x.isVisible().catch(()=>false)) { await x.click().catch(()=>{}); break; } } await pg.waitForTimeout(400); }
console.log('BTN', JSON.stringify(await pg.$$eval('.modal-overlay button', bs=>bs.map(b=>b.innerText.trim()))));await pg.screenshot({path:'/tmp/claude-0/stuck.png'});await pg.locator('.hd-nav-item').nth(2).click();await pg.locator('.tn-sub-item').nth(1).click();await pg.waitForTimeout(400);
await pg.locator('tbody tr').nth(8).click();await pg.waitForTimeout(500);
const names=['Übersicht','Attribute','Entwicklung','Spiele','Statistik','Karriere','Vertrag & Wert','Medizin','Bericht'];
for (let i=0;i<names.length;i++){ await pg.locator('.pp-tabs .tab').nth(i).click(); await pg.waitForTimeout(200);
  const ov=await pg.evaluate(()=>{const bb=document.querySelector('.pp-body').getBoundingClientRect().bottom; let mx=0; for(const e of document.querySelectorAll('.pp-body *')){mx=Math.max(mx,e.getBoundingClientRect().bottom)}; return Math.round(mx-bb)});
  console.log(names[i],'ueberhang',ov); await pg.screenshot({path:`/tmp/claude-0/h_${i}.png`}); }
console.log(errs.length?errs.join('\n'):'Keine JS-Fehler');
await b.close();s.close();
