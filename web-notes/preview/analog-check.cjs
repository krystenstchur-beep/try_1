// Local-only QA. Set PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE to installed tools.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const web=path.join(root,'web-notes');
const failures=[];
const report=[];
function check(ok,msg){if(!ok)failures.push(msg);}
function near(actual,expected,tolerance){return Math.abs(actual-expected)<tolerance;}

// Independently solve the example with simultaneous node/current equations.
const U=12,beta=50,Rtop=33000,Rbottom=10000,Re=1500,Rc=3300;
const conductance=1/Rtop+1/Rbottom+1/((beta+1)*Re);
const Vb=(U/Rtop+.7/((beta+1)*Re))/conductance;
const Ie=(Vb-.7)/Re,Ic=Ie*beta/(beta+1),Uce=U-Ic*Rc-Ie*Re;
const rbe=200+(beta+1)*.026/Ie,load=1/(1/Rc+1/5000);
const Ri=1/(1/Rtop+1/Rbottom+1/(rbe+(beta+1)*300));
const Au=-beta*load/(rbe+(beta+1)*300);
check(near(Ic*1000,1.242,.001),'Integrated example collector current');
check(near(Uce,6.00,.01),'Integrated example CE voltage');
check(near(Au,-6.01,.01),'Integrated example gain');
check(near(Ri/1000,5.24,.01),'Integrated example input resistance');
const example={Vb,Ie,Ic,Uce,rbe,Ri,Au,Aus:Au*Ri/(400+Ri)};

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  for(const [file,md,data,count] of [
   ['analog.html','模电.md','analog-data.js',9],
   ['circuits.html','电路基础.md','circuits-data.js',5],
   ['index.html','复变函数.md','notes-data.js',5]
  ]){
   const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(web,data),'utf8'),context);
   check(context.window.NOTE_MARKDOWN===fs.readFileSync(path.join(root,md),'utf8'),file+': Markdown synchronized');
   const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.goto(pathToFileURL(path.join(web,file)).href);
   await page.waitForFunction(()=>window.NOTES_READY);
   await page.evaluate(()=>document.fonts.ready);
   const scan=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    return {
     sections:[...document.querySelectorAll('.note-section h2')].map(x=>x.textContent),
     firstSectionStructure:[...document.querySelectorAll('#section-1 h3')].map(x=>x.textContent),
     formulas:document.querySelectorAll('.katex').length,
     mathErrors:document.querySelectorAll('.math-error,.katex-error').length,
     statements:document.querySelectorAll('.property-statement').length,
     unboxed:[...document.querySelectorAll('.article p')].filter(p=>p.firstElementChild?.textContent==='结论。'&&!p.closest('.property-statement')).length,
     unboxedConditions:[...document.querySelectorAll('.article p')].filter(p=>p.firstElementChild?.textContent==='条件与符号。'&&!p.closest('.property-statement')).length,
     questions:document.querySelectorAll('#source-question-archive details').length,
     inArticleQuestions:document.querySelectorAll('#content .manuscript-questions').length,
     duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
     brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.hash).filter(h=>!document.getElementById(decodeURIComponent(h.slice(1)))),
     localLinks:[...document.querySelectorAll('a[href]:not([href^="#"]):not([href^="https:"])')].map(a=>a.getAttribute('href')),
     externalResources:performance.getEntriesByType('resource').filter(x=>/^https?:/.test(x.name)).map(x=>x.name)
    };
   });
   check(scan.sections.length===count,file+': section count');
   check(!scan.mathErrors,file+': math parse errors');
   check(!scan.unboxed,file+': conclusions not boxed');
   check(!scan.unboxedConditions,file+': conditions should stay with conclusions');
   check(!scan.inArticleQuestions,file+': questions inside article');
   check(!scan.duplicateIds.length,file+': duplicate IDs '+scan.duplicateIds);
   check(!scan.brokenAnchors.length,file+': broken anchors '+scan.brokenAnchors);
   check(!scan.externalResources.length,file+': dependencies should work offline');
   for(const href of scan.localLinks){const target=path.resolve(web,decodeURIComponent(href.split('#')[0]));check(fs.existsSync(target),file+': missing local link '+href);}
   if(file==='analog.html'){
    check(scan.firstSectionStructure.length===4,'3.1 must retain four handwritten blocks');
    check(scan.questions===15,'15 manuscript questions/corrections should be accessible');
    for(const img of await page.locator('#content img').all())await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll('#content img')].every(i=>i.complete&&i.naturalWidth));
   }
   const layouts=[];
   for(const width of [1440,1024,768,390,360,320]){
    await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));
    const layout=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,
     overflow:[...document.querySelectorAll('.article p,.article li,.property-statement,.note-section h2')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.textContent.slice(0,100))}));
    check(layout.documentWidth<=width+1,file+': page overflow '+width+' '+layout.documentWidth);
    check(!layout.overflow.length,file+': text overflow '+width+' '+layout.overflow.join(';'));
    layouts.push(layout);
    if(file==='analog.html'&&[1440,390].includes(width)){
     const mode=width===1440?'desktop':'mobile';
     await page.screenshot({path:path.join(__dirname,'analog-'+mode+'.png')});
     await page.evaluate(()=>scrollTo(0,scrollY+document.getElementById('divider-feedback').getBoundingClientRect().top-105));
     await page.waitForTimeout(100);
     await page.screenshot({path:path.join(__dirname,'analog-feedback-'+mode+'.png')});
     await page.evaluate(()=>scrollTo(0,scrollY+document.getElementById('ce-ac-general').getBoundingClientRect().top-105));
     await page.screenshot({path:path.join(__dirname,'analog-formulas-'+mode+'.png')});
    }
   }
   await page.setViewportSize({width:390,height:844});
   await page.locator('#menu-button').click();check(await page.locator('#sidebar').isVisible(),file+': mobile menu opens');
   await page.locator('#toc .toc-main').last().click();check(!await page.locator('#sidebar').isVisible(),file+': mobile menu closes');
   check(await page.evaluate(()=>location.hash)==='#section-'+count,file+': navigation reaches last chapter');
   await page.locator('.reading-tabs a[href="#questions"]').click();
   const first=page.locator('#source-question-archive details').first();await first.locator('summary').click();
   check(await first.getAttribute('open')!==null,file+': independent questions expand');
   await first.locator('a[href^="#"]').first().click();
   const landing=await page.evaluate(()=>document.getElementById(location.hash.slice(1)).getBoundingClientRect().top);
   check(landing>=60&&landing<210,file+': backlink lands below toolbar '+landing);
   if(file==='analog.html'){
    await page.locator('.reading-tabs a[href="#questions"]').click();
    await page.screenshot({path:path.join(__dirname,'analog-mobile-questions.png')});
    const table=page.locator('#section-9 .table-wrap').first();
    check(await table.evaluate(e=>e.scrollWidth>e.clientWidth),'Comparison table scrolls independently on mobile');
   }
   await page.locator('#font-button').click();check(await page.locator('body').evaluate(e=>e.classList.contains('large-type')),file+': larger font');
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+': larger font overflow');
   await page.setViewportSize({width:1440,height:1000});
   for(const aside of await page.locator('#context-margin .manuscript-questions').all()){
    const id=await aside.getAttribute('data-section');await page.evaluate(id=>scrollTo(0,scrollY+document.getElementById(id).getBoundingClientRect().top-90),id);
    await page.waitForTimeout(100);check(await aside.isVisible(),file+': contextual aside '+id);
   }
   await page.locator('#focus-button').click();check(!await page.locator('#sidebar').isVisible(),file+': focus mode');
   check(!await page.locator('.margin-notes').isVisible(),file+': focus hides margin');
   await page.emulateMedia({media:'print'});check(!await page.locator('.topbar').isVisible(),file+': print hides chrome');
   check(!errors.length,file+': browser errors '+errors.join(';'));
   report.push({file,...scan,layouts,errors});await page.close();
  }
  const diagrams=await browser.newPage({viewport:{width:720,height:810}});
  for(const file of ['models','load-lines','divider-bias','ce-paths','cc-path','cb-path']){
   await diagrams.goto(pathToFileURL(path.join(web,'assets/analog',file+'.svg')).href);
   await diagrams.screenshot({path:path.join(__dirname,'analog-diagram-'+file+'.png')});
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(__dirname,'analog-check-results.json'),JSON.stringify({example,report,failures},null,2));
 console.log(JSON.stringify({pages:report.map(({file,sections,formulas,statements,questions})=>({file,sections:sections.length,formulas,statements,questions})),example,failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
