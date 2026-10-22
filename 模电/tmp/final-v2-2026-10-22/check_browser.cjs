const fs=require('fs'),path=require('path');const {pathToFileURL,fileURLToPath}=require('url');
const {chromium}=require('C:/Users/maluteng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const work=__dirname,build=JSON.parse(fs.readFileSync(path.join(work,'build-report.json'),'utf8'));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const reports=[],missing=[],htmlAnchors=new Map();try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 for(const doc of build.documents){
  await page.goto(pathToFileURL(doc.output).href);await page.waitForFunction(()=>window.READER_READY);await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(()=>({title:document.title,mathErrors:document.querySelectorAll('.katex-error,.math-error').length,images:document.images.length,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),ids:[...document.querySelectorAll('[id]')].map(x=>x.id),links:[...document.querySelectorAll('a[href]')].map(a=>a.href)}));
  htmlAnchors.set(doc.output,new Set(result.ids));reports.push({...result,output:doc.output,ids:undefined,links:undefined});
  for(const href of result.links){if(!href.startsWith('file:'))continue;const u=new URL(href);const file=fileURLToPath(u);if(!fs.existsSync(file))missing.push({source:doc.output,href});else if(u.hash&&file.toLowerCase().endsWith('.html')){const target=fs.readFileSync(file,'utf8');const id=decodeURIComponent(u.hash.slice(1));if(!target.includes(`id="${id}"`))missing.push({source:doc.output,href,kind:'missing anchor'});}}
  if(doc.output===build.mainHTML){
   await page.locator('.toc a[href="#amp-6"]').click();await page.waitForTimeout(100);await page.screenshot({path:path.join(work,'desktop-section6.png')});
   await page.locator('#raw-hand2-5a').evaluate(e=>e.scrollIntoView());await page.screenshot({path:path.join(work,'desktop-original.png')});
   await page.setViewportSize({width:390,height:844});await page.goto(pathToFileURL(doc.output).href);await page.waitForFunction(()=>window.READER_READY);await page.locator('.menu-button').click();if(await page.locator('.menu-button').getAttribute('aria-expanded')!=='true')throw Error('Mobile navigation failed');await page.locator('.toc a[href="#bjt-4"]').click();await page.waitForTimeout(100);await page.screenshot({path:path.join(work,'mobile-model.png')});
   await page.locator('.pending-button').click();if(!await page.locator('.pending-dialog').isVisible())throw Error('Pending entry failed');await page.screenshot({path:path.join(work,'mobile-pending.png')});await page.locator('.close-dialog').click();await page.setViewportSize({width:1440,height:1000});
  }
 }
 }finally{await browser.close();}
 const bad=reports.filter(r=>r.mathErrors||r.brokenImages.length);const report={documents:reports,missing,passed:!bad.length&&!missing.length};fs.writeFileSync(path.join(work,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
