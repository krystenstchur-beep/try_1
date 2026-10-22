const fs=require('fs'),path=require('path');const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/maluteng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const work=__dirname,base=path.resolve(work,'../..'),html=path.join(base,'模电第三章_轻量版_v2.html'),output=path.join(base,'output/pdf/模电第三章_轻量版_v2.pdf');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage({viewport:{width:665,height:987},reducedMotion:'reduce'});await page.goto(pathToFileURL(html).href);await page.waitForFunction(()=>window.READER_READY);await page.emulateMedia({media:'print'});await page.evaluate(()=>document.fonts.ready);
const metrics=await page.evaluate(()=>{
 const bad=[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);if(bad.length)throw Error('Broken images '+bad);
 const scaled=[];
 document.querySelectorAll('.math-block').forEach(b=>{const m=b.querySelector('.katex-display>.katex');if(!m)return;m.style.removeProperty('--print-math-size');const css=getComputedStyle(b),space=b.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-6;const width=m.scrollWidth;if(width>space){const factor=space/width;m.style.setProperty('--print-math-size',factor+'em');scaled.push({tex:b.dataset.tex,factor});}});
 const overflow=[...document.querySelectorAll('.math-block,.table-wrap')].filter(e=>e.scrollWidth>e.clientWidth+3).map(e=>({type:e.className,width:e.clientWidth,scroll:e.scrollWidth}));
 if(overflow.length)throw Error('Print overflow '+JSON.stringify(overflow));
 return {maths:document.querySelectorAll('#content .katex').length,images:document.images.length,scaled,overflow};
});
await page.pdf({path:output,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<div style="width:100%;margin:0 17mm;border-bottom:1px solid #dce2d9;padding-bottom:4px;font-family:Microsoft YaHei;font-size:8px;color:#65736c">模电第三章 · 轻量版 v2</div>',footerTemplate:'<div style="width:100%;margin:0 17mm;text-align:right;font-family:Arial;font-size:9px;color:#65736c"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',outline:true,tagged:true});
fs.writeFileSync(path.join(work,'export-report.json'),JSON.stringify({output,bytes:fs.statSync(output).size,...metrics},null,2));console.log(JSON.stringify({output,bytes:fs.statSync(output).size,...metrics},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
