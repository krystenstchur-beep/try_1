// Uses an installed Playwright and Chromium-compatible browser.
// PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE may point to bundled runtime tools.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
require('./render.cjs');
const dir=__dirname,output=path.resolve(dir,'../pdf/模电第三章_原稿保留修订版_2026-10-21.pdf');
(async()=>{
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  const page=await browser.newPage({viewport:{width:665,height:980}});
  await page.goto(pathToFileURL(path.join(dir,'index.html')).href);await page.waitForFunction(()=>window.NOTES_READY);
  await page.emulateMedia({media:'print'});
  await page.evaluate(async()=>{
   document.querySelectorAll('details').forEach(d=>d.open=true);
   await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));
   const register=document.getElementById('source-register');
   if(register){const start=register.previousElementSibling,wrap=document.createElement('div');wrap.className='source-register-layout';start.before(wrap);while(wrap.nextElementSibling)wrap.append(wrap.nextElementSibling);}
   // Empty anchor nodes must not separate a heading from the next readable paragraph.
   [...document.querySelectorAll('#content h2,#content h3,#content h4')].reverse().forEach(h=>{
    const group=document.createElement('div');group.className='heading-keep';h.before(group);group.append(h);
    while(group.nextElementSibling){
     const next=group.nextElementSibling;
     if(next.classList.contains('manuscript-unit')){
      // Keep only the manuscript title with the heading, not an entire multi-page record.
      group.style.breakAfter='avoid';break;
     }
     if(next.getBoundingClientRect().height>250){group.style.breakAfter='avoid';break;}
     group.append(next);
     if(next.textContent.trim()||next.querySelector('img')){
      if(h.tagName==='H2'&&group.nextElementSibling?.classList.contains('heading-keep')){
       const subhead=group.nextElementSibling;
       if(group.getBoundingClientRect().height+subhead.getBoundingClientRect().height<350){group.append(subhead);group.style.breakAfter='avoid';}
      }
      break;
     }
    }
   });
   document.querySelectorAll('.source-block').forEach(block=>{
    if(block.querySelector('img'))block.classList.add('figure-block');
    const next=block.nextElementSibling;
    if(!next?.classList.contains('source-block')||block.querySelector('.math-block')||!next.querySelector('.math-block'))return;
    if(block.getBoundingClientRect().height+next.getBoundingClientRect().height>360)return;
    const group=document.createElement('div');group.className='formula-keep';block.before(group);group.append(block,next);
   });
   document.querySelectorAll('.math-block').forEach(b=>{
    const math=b.querySelector('.katex-display>.katex');if(!math)return;
    const available=b.clientWidth-parseFloat(getComputedStyle(b).paddingLeft)-parseFloat(getComputedStyle(b).paddingRight);
    if(math.scrollWidth>available)math.style.fontSize=(parseFloat(getComputedStyle(math).fontSize)*available/math.scrollWidth)+'px';
   });
  });
  const scan=await page.evaluate(()=>({formulas:document.querySelectorAll('.katex').length,transcripts:document.querySelectorAll('.transcription').length,
   unexpanded:[...document.querySelectorAll('details')].filter(d=>!d.open).length,
   badMath:document.querySelectorAll('.math-error,.katex-error').length,
   wide:[...document.querySelectorAll('.math-block')].filter(b=>b.scrollWidth>b.clientWidth+3).map(b=>b.textContent.slice(0,60))}));
  if(scan.badMath||scan.unexpanded)throw Error(JSON.stringify(scan));
  await page.pdf({path:output,format:'A4',preferCSSPageSize:true,printBackground:true,tagged:true,outline:true,
   margin:{top:'17mm',right:'17mm',bottom:'18mm',left:'17mm'},displayHeaderFooter:true,
   headerTemplate:'<div style="font:8px sans-serif;color:#647267;width:100%;margin:0 17mm;border-bottom:1px solid #dce4d8;padding-bottom:5px">模电 · 第三章 3.1—3.9　｜　原稿保留修订版 · 2026-10-21</div>',
   footerTemplate:'<div style="font:9px sans-serif;color:#647267;width:100%;margin:0 17mm;display:flex;justify-content:space-between"><span>原稿 · 教材知识 · AI 补充 · 修正边界</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
  const finish=require('node:child_process').spawnSync(process.env.PYTHON_EXECUTABLE||'python',[path.join(dir,'finish-pdf.py'),output],{encoding:'utf8',windowsHide:true});
  if(finish.status!==0)throw new Error('PDF exported, but printed TOC numbering failed: '+(finish.stderr||finish.error));
  console.log(finish.stdout.trim());
  console.log(JSON.stringify({output,bytes:fs.statSync(output).size,...scan}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
