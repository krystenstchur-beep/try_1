// Local browser QA. Uses an existing Playwright installation and Edge/Chromium.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const webRoot = path.join(root, 'web-notes');
const report = [];
const failures = [];
function check(ok, message) { if (!ok) failures.push(message); }

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  try {
    for (const [filename, source, data, sectionCount] of [
      ['circuits.html','电路基础.md','circuits-data.js',4],
      ['index.html','复变函数.md','notes-data.js',5]
    ]) {
      const context = { window: {} };
      vm.runInNewContext(fs.readFileSync(path.join(webRoot,data),'utf8'),context);
      check(context.window.NOTE_MARKDOWN === fs.readFileSync(path.join(root,source),'utf8'),filename+': Markdown synchronization');
      const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
      const errors = [];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
      page.on('requestfailed',request=>errors.push(request.url()+': '+request.failure()?.errorText));
      await page.goto(pathToFileURL(path.join(webRoot,filename)).href);
      await page.waitForFunction(()=>window.NOTES_READY);
      await page.evaluate(()=>document.fonts.ready);
      const scan = await page.evaluate(() => {
        const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
        return {
          title:document.title,
          sections:document.querySelectorAll('.note-section').length,
          headings:[...document.querySelectorAll('.note-section h2')].map(el=>el.textContent),
          mathErrors:document.querySelectorAll('.math-error,.katex-error').length,
          formulas:document.querySelectorAll('.article .katex').length,
          statements:document.querySelectorAll('.property-statement').length,
          unboxedConclusions:[...document.querySelectorAll('.article p')].filter(p=>p.firstElementChild?.textContent==='结论。'&&!p.closest('.property-statement')).length,
          questions:document.querySelectorAll('#questions details').length,
          bodyAsides:document.querySelectorAll('#content .manuscript-questions').length,
          duplicates:ids.filter((id,index)=>ids.indexOf(id)!==index),
          brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.hash).filter(hash=>!document.getElementById(decodeURIComponent(hash.slice(1))))
        };
      });
      check(scan.sections===sectionCount,filename+': section count');
      check(scan.mathErrors===0,filename+': math parse errors');
      check(scan.unboxedConclusions===0,filename+': unboxed conclusions');
      check(scan.bodyAsides===0,filename+': questions interrupt article');
      check(!scan.duplicates.length,filename+': duplicate IDs '+scan.duplicates);
      check(!scan.brokenAnchors.length,filename+': broken anchors '+scan.brokenAnchors);
      for (const img of await page.locator('.article img').all()) await img.scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>[...document.querySelectorAll('.article img')].every(img=>img.complete&&img.naturalWidth>0));
      const layouts=[];
      for (const width of [1440,1024,768,390,360,320]) {
        await page.setViewportSize({width,height:1000});
        await page.evaluate(()=>scrollTo(0,0));
        const overflow = await page.evaluate(()=>({
          viewport:innerWidth,
          documentWidth:document.documentElement.scrollWidth,
          overflowing:[...document.querySelectorAll('.article p,.article li,.property-statement,.note-section h2')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>el.textContent.slice(0,80))
        }));
        check(overflow.documentWidth<=width+1,filename+': page overflow at '+width+' ('+overflow.documentWidth+')');
        check(!overflow.overflowing.length,filename+': article overflow at '+width+': '+overflow.overflowing.join(';'));
        layouts.push({width,...overflow});
        if(filename==='circuits.html'&&width===1440){
          await page.screenshot({path:path.join(__dirname,'circuits-desktop.png')});
          await page.evaluate(()=>{
            const p=[...document.querySelectorAll('.article p')].find(p=>p.textContent.startsWith('补充推理·用叠加'));
            scrollTo(0,scrollY+p.getBoundingClientRect().top-100);
          });
          await page.waitForTimeout(100);
          await page.screenshot({path:path.join(__dirname,'circuits-derivation.png')});
          await page.screenshot({path:path.join(__dirname,'circuits-full-desktop.png'),fullPage:true});
        }
        if(filename==='circuits.html'&&width===390){
          await page.screenshot({path:path.join(__dirname,'circuits-mobile.png')});
          await page.evaluate(()=>scrollTo(0,scrollY+document.getElementById('section-3-part-5').getBoundingClientRect().top-90));
          await page.screenshot({path:path.join(__dirname,'circuits-mobile-content.png')});
          await page.screenshot({path:path.join(__dirname,'circuits-full-mobile.png'),fullPage:true});
        }
      }
      await page.setViewportSize({width:390,height:844});
      await page.locator('#menu-button').click();
      check(await page.locator('#sidebar').isVisible(),filename+': mobile menu opens');
      await page.locator('#toc .toc-main').nth(2).click();
      check(!await page.locator('#sidebar').isVisible(),filename+': mobile menu closes after navigation');
      await page.locator('.reading-tabs a[href="#questions"]').click();
      const firstQuestion=page.locator('#source-question-archive details').first();
      await firstQuestion.locator('summary').click();
      check(await firstQuestion.getAttribute('open')!==null,filename+': question expands');
      await firstQuestion.locator('a').first().click();
      const landing=await page.evaluate(()=>{
        const el=document.getElementById(decodeURIComponent(location.hash.slice(1)));
        return {hash:location.hash,top:el.getBoundingClientRect().top};
      });
      check(landing.top>=60&&landing.top<200,filename+': question backlink positioning '+JSON.stringify(landing));
      await page.locator('#font-button').click();
      check(await page.locator('body').evaluate(el=>el.classList.contains('large-type')),filename+': font toggle');
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),filename+': enlarged mobile overflow');
      await page.setViewportSize({width:1440,height:1000});
      for(const aside of await page.locator('#context-margin .manuscript-questions').all()) {
        const section=await aside.getAttribute('data-section');
        await page.locator('#'+section).scrollIntoViewIfNeeded();
        await page.evaluate(()=>scrollBy(0,-90));
        await page.waitForTimeout(80);
        check(await aside.isVisible(),filename+': contextual aside '+section);
      }
      await page.locator('#focus-button').click();
      check(!await page.locator('#sidebar').isVisible(),filename+': focus hides sidebar');
      check(!await page.locator('.margin-notes').isVisible(),filename+': focus hides margin');
      check(errors.length===0,filename+': console/network errors '+errors.join('; '));
      report.push({filename,...scan,layouts,errors,backlink:landing});
      await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(__dirname,'check-results.json'),JSON.stringify({report,failures},null,2));
  console.log(JSON.stringify({pages:report.map(({filename,sections,formulas,statements,questions,errors})=>({filename,sections,formulas,statements,questions,errors})),failures},null,2));
  if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
