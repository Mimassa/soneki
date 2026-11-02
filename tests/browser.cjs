// Requires Playwright in the test environment only, plus a server at BASE_URL.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,timezoneId:'America/New_York'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.goto(process.env.BASE_URL||'http://127.0.0.1:8000/soneki/');await page.getByRole('heading',{name:'損益カレンダー'}).waitFor();
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
const click=s=>page.locator(s).click();
const fill=async(v)=>{for(const[k,x]of Object.entries(v))await page.locator(`[name="${k}"]`).fill(k==='executedAt'?x.slice(0,16):x)};
await click('[data-tab=history]');await page.locator('[data-new]').first().click();
await fill({quantity:'1.0',executionPrice:'153.250',executedAt:'2026-01-31T10:00:00'});await click('#trade-form [type=submit]');await page.locator('dialog').waitFor({state:'hidden'});
await click('[data-settle]');await fill({quantity:'0.5',executionPrice:'153.750',executedAt:'2026-01-31T11:00:00',pipsProfit:'50',positionProfit:'25000',swapProfit:'120'});assert.match(await page.locator('#live-total').innerText(),/25,120/);await click('#trade-form [type=submit]');await page.locator('dialog').waitFor({state:'hidden'});
await click('[data-settle]');await fill({quantity:'0.6',executionPrice:'153.100',executedAt:'2026-02-01T11:00:00',pipsProfit:'-15',positionProfit:'-7500',swapProfit:'380'});await click('#trade-form [type=submit]');assert.match(await page.locator('#form-error').innerText(),/超え/);await fill({quantity:'0.5'});await click('#trade-form [type=submit]');await page.locator('dialog').waitFor({state:'hidden'});
assert.match(await page.locator('.trade-head').innerText(),/18,000/);assert.match(await page.locator('.trade-head').innerText(),/全決済/);
await click('[data-tab=calendar]');await page.evaluate(()=>{month='2026-01';day='2026-01-31';render()});assert.match(await page.locator('#app .hero').innerText(),/25,120/);await click('[data-jump]');await page.locator('.highlight').waitFor();await click('[data-tab=calendar]');assert.equal(await page.locator('.selected').getAttribute('data-day'),'2026-01-31');
await click('[data-month="1"]');assert.match(await page.locator('#app .hero').innerText(),/-7,120/);
await page.locator('#calendar-pair').selectOption('EUR/JPY');assert.match(await page.locator('#app .hero').innerText(),/0 件/);await page.locator('#calendar-pair').selectOption('');
await click('[data-tab=analysis]');await page.locator('#period').selectOption('all');assert.match(await page.locator('.stats').innerText(),/18,000/);assert.equal(await page.locator('svg').count(),4);
await click('[data-tab=settings]');await page.locator('#number-font').selectOption('mono');await page.waitForFunction(()=>data.settings.numberFont==='mono');assert.match(await page.locator('.font-preview').evaluate(el=>getComputedStyle(el).fontFamily),/Menlo/);const dl=page.waitForEvent('download');await click('[data-export]');const download=await dl;const path=await download.path();assert.match(download.suggestedFilename(),/^fx-backup-\d{8}-\d{6}.json$/);await page.waitForFunction(()=>document.body.innerText.includes('エクスポート後の変更なし'));
await page.locator('#pair-0').fill('USD/JPY edited');await click('[data-pair-save="0"]');await page.waitForFunction(()=>document.body.innerText.includes('未保存の変更あり'));
await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":99}')});await page.waitForFunction(()=>document.querySelector('#toast').innerText.includes('読み込みできません'));assert.equal(await page.evaluate(()=>data.positions.length),1);
await page.locator('#import-file').setInputFiles(path);await page.waitForFunction(()=>data.settings.currencyPairs[0]==='USD/JPY');
await page.reload();await page.getByRole('heading',{name:'損益カレンダー'}).waitFor();assert.equal(await page.evaluate(()=>data.settlements.length),2);assert.equal(await page.evaluate(()=>data.settings.numberFont),'mono');assert.match(await page.locator('#app .digits').first().evaluate(el=>getComputedStyle(el).fontFamily),/Menlo/);
await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:'損益カレンダー'}).waitFor();await click('[data-tab=history]');await click('[data-new]');await page.locator('[name=side]').selectOption('sell');await fill({quantity:'0.3',executionPrice:'155',executedAt:'2026-02-03T12:00:00'});await click('#trade-form [type=submit]');await page.locator('dialog').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>data.positions.length),2);
await click('[data-settle]');await fill({quantity:'0.3',executionPrice:'154',executedAt:'2026-02-04T12:00:00',pipsProfit:'10',positionProfit:'300',swapProfit:'-10'});await click('#trade-form [type=submit]');await page.locator('dialog').waitFor({state:'hidden'});assert.match(await page.locator('.child').innerText(),/買い/);
await page.locator('[data-edit-s]').click();await fill({swapProfit:'-20'});await click('#trade-form [type=submit]');await page.locator('dialog').waitFor({state:'hidden'});assert.match(await page.locator('.child').innerText(),/280/);
await click('[data-delete-s]');await page.waitForFunction(()=>data.settlements.length===2);
await click('[data-tab=calendar]');for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow '+width)}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/soneki-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);console.log('PASS browser: CRUD, partial close, validation, calendar links, filters, analysis, backup/restore, reload, offline, sell close, responsive widths');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
