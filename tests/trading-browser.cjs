const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles',acceptDownloads:true});
 const page=await context.newPage(),errors=[],dialogs=[];let accept=true;
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{dialogs.push(d.message());return accept?d.accept():d.dismiss()});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8000/soneki/');await page.getByRole('heading',{name:'損益カレンダー'}).waitFor();
 await page.evaluate(async()=>{
 const at='2026-11-27T10:00:00+09:00';
 const p=(id,pair)=>({id,currencyPair:pair,side:'buy',quantity:'2',executionPrice:'150',executedAt:at,createdAt:at,updatedAt:at});
 const s=(id,positionId,time,profit,swap='0')=>({id,positionId,quantity:'0.2',executionPrice:'151',executedAt:time+'+09:00',positionProfit:profit,swapProfit:swap,pipsProfit:'1',createdAt:at,updatedAt:at});
 await save({positions:[p('p1','USD/JPY'),p('p2','EUR/JPY')],settlements:[s('s1','p1','2026-11-28T03:00:00','100','5'),s('s2','p1','2026-12-01T03:00:00','200','10'),s('s3','p1','2026-12-01T07:10:00','-30'),s('s4','p1','2027-01-01T03:00:00','40'),s('s5','p1','2026-11-29T03:00:00','900'),s('s6','p2','2026-12-01T03:00:00','50'),s('s7','p2','2026-11-30T07:00:00','800')],settings:defaults()});
 month='2026-11';day='2026-11-30';render();
 });
 const baseline=await page.evaluate(()=>JSON.stringify({positions:data.positions,settlements:data.settlements}));
 assert.deepEqual(await page.locator('.weekday').allTextContents(),['月','火','水','木','金']);
 assert.equal(await page.locator('.calendar').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),5);
 assert.match(await page.locator('[data-day="2026-11-27"]').innerText(),/105/);assert.match(await page.locator('[data-day="2026-11-30"]').innerText(),/260/);
 assert.match(await page.locator('.hero .amount').innerText(),/365/);assert.match(await page.locator('.monthly-summary').innerText(),/365/);
 assert.match(await page.locator('[data-exception-count]').innerText(),/2/);assert.match(await page.locator('[data-exception-total]').innerText(),/1,700/);
 assert.equal(await page.locator('.selected-settlements [data-jump]').count(),2);
 await page.locator('[data-jump="s2"]').click();assert.equal(await page.locator('#s-s2').getAttribute('class'),'child highlight');assert.match(await page.locator('#s-s2').innerText(),/2026-12-01 03:00/);
 await page.locator('[data-tab=calendar]').click();assert.equal(await page.locator('.selected').getAttribute('data-day'),'2026-11-30');
 await page.locator('#calendar-pair').selectOption('USD/JPY');assert.match(await page.locator('.hero .amount').innerText(),/315/);assert.match(await page.locator('[data-exception-total]').innerText(),/900/);
 await page.locator('.exception-panel summary').click();await page.locator('[data-jump="s5"]').click();assert.equal(await page.locator('#s-s5').getAttribute('class'),'child highlight');
 await page.locator('[data-tab=calendar]').click();assert.equal(await page.locator('#calendar-pair').inputValue(),'USD/JPY');
 await page.locator('#calendar-pair').selectOption('');await page.locator('[data-month="1"]').click();assert.match(await page.locator('.hero .amount').innerText(),/\+10/);
 const colors=await page.evaluate(()=>[getComputedStyle(document.querySelector('[data-day="2026-12-01"] .money')).color,getComputedStyle(document.querySelector('[data-day="2026-12-31"] .money')).color]);assert.deepEqual(colors,['rgb(255, 136, 136)','rgb(114, 203, 165)']);
 await page.locator('[data-tab=analysis]').click();await page.locator('#period').selectOption('year');await page.locator('#analysis-year').fill('2026');await page.locator('#analysis-year').dispatchEvent('change');assert.match(await page.locator('.stats').innerText(),/375/);
 assert.match(await page.locator('svg').nth(0).textContent(),/2026-11-27/);assert.match(await page.locator('svg').nth(0).textContent(),/2026-12-31/);assert.doesNotMatch(await page.locator('svg').nth(0).textContent(),/2027-01-01/);
 await page.locator('#analysis-year').fill('2027');await page.locator('#analysis-year').dispatchEvent('change');assert.equal(await page.locator('svg').count(),0);assert.match(await page.locator('[data-exception-total]').innerText(),/1,700/);
 await page.locator('#period').selectOption('month');await page.locator('#analysis-month').fill('2026-11');await page.locator('#analysis-month').dispatchEvent('change');assert.match(await page.locator('.stats').innerText(),/365/);
 await page.locator('[data-tab=settings]').click();assert.equal(await page.locator('#number-font option').count(),40);
 // Every candidate at narrow viewport; fallback layout must remain usable.
 await page.setViewportSize({width:320,height:844});
 const keys=await page.locator('#number-font option').evaluateAll(xs=>xs.map(x=>x.value));
 for(const key of keys){await page.locator('#number-font').selectOption(key);await page.waitForFunction(key=>data.settings.numberFont===key,key);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'settings overflow '+key)}
 await page.locator('summary').filter({hasText:'フォント名とサンプル'}).click();await page.locator('[data-font="hiragino-mincho"]').click();await page.waitForFunction(()=>data.settings.numberFont==='hiragino-mincho');
 assert.match(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),/Hiragino Mincho ProN/);
 await page.locator('[data-tab=analysis]').click();assert.match(await page.locator('svg text').first().evaluate(el=>getComputedStyle(el).fontFamily),/Hiragino Mincho ProN/);assert.equal(await page.locator('svg span').count(),0);
 await page.reload();await page.getByRole('heading',{name:'損益カレンダー'}).waitFor();assert.equal(await page.evaluate(()=>data.settings.numberFont),'hiragino-mincho');assert.equal(await page.evaluate(()=>JSON.stringify({positions:data.positions,settlements:data.settlements})),baseline);
 // Validate warning + explicit cancellation/confirmation, preserving parent/child integrity.
 await page.locator('[data-tab=history]').click();await page.locator('[data-expand="p1"]').click();await page.locator('[data-settle="p1"]').click();
 assert.match(await page.locator('#trade-form input').first().evaluate(el=>getComputedStyle(el).fontFamily),/Hiragino Mincho ProN/);
 for(const [key,value]of Object.entries({quantity:'0.2',executionPrice:'150',executedAt:'2026-12-06T03:00',positionProfit:'15',swapProfit:'0',pipsProfit:'0'}))await page.locator(`[name="${key}"]`).fill(value);
 assert.equal(await page.locator('#trading-warning').isVisible(),true);accept=false;await page.locator('#trade-form [type=submit]').click();assert.match(dialogs.at(-1),/取引可能時間外/);assert.equal(await page.evaluate(()=>data.settlements.length),7);assert.equal(await page.locator('dialog').isVisible(),true);
 accept=true;await page.locator('#trade-form [type=submit]').click();await page.locator('dialog').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>data.settlements.length),8);
 // Unchanged millisecond timestamp survives edit, JSON and reload.
 await page.evaluate(async()=>{const n=copy();n.settlements.find(s=>s.id==='s3').executedAt='2026-12-01T07:10:00.999+09:00';await save(n);render()});
 await page.locator('[data-edit-s="s3"]').click();assert.equal(await page.locator('[name=executedAt]').inputValue(),'2026-12-01T07:10:00.999');await page.locator('#trade-form [type=submit]').click();await page.locator('dialog').waitFor({state:'hidden'});
 await page.locator('[data-tab=settings]').click();const download=page.waitForEvent('download');await page.locator('[data-export]').click();const file=await (await download).path();
 await page.locator('#number-font').selectOption('sans');await page.waitForFunction(()=>data.settings.numberFont==='sans');await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>data.settings.numberFont==='hiragino-mincho');assert.match(dialogs.at(-1),/休場時間の新規約定 0件・決済 3件/);assert.equal(await page.evaluate(()=>data.settlements.find(s=>s.id==='s3').executedAt),'2026-12-01T07:10:00.999+09:00');
 // Large values must wrap inside cells, including all candidate fonts.
 await page.evaluate(async()=>{const n=copy();n.settlements.find(s=>s.id==='s2').positionProfit='9999999999999.12345678';await save(n);tab='calendar';month='2026-11';day='2026-11-30';render()});
 for(const key of keys){await page.evaluate(key=>{data.settings.numberFont=key;applyNumberFont()},key);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'calendar overflow '+key);assert.equal(await page.locator('.day').evaluateAll(xs=>xs.every(el=>el.scrollWidth<=el.clientWidth)),true,'cell overflow '+key)}
 await page.evaluate(()=>{data.settings.numberFont='system';applyNumberFont()});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/soneki-trading-calendar.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS trading UI: 5 columns, rollover totals, exceptions, history links, fonts, warning confirm/cancel, millisecond edits, backup compatibility, narrow layouts');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
