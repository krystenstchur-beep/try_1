const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {pathToFileURL}=require('url');
const work=__dirname,base=path.resolve(work,'../..'),project=path.resolve(base,'..');
const {chromium}=require('C:/Users/maluteng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const marked=require(path.join(base,'web-notes/assets/marked.umd.js')),katex=require(path.join(base,'web-notes/assets/katex.min.js'));
const main=path.join(base,'模电第三章_轻量版_v2.md'),mainHTML=path.join(base,'模电第三章_轻量版_v2.html');
const pdf=path.join(base,'output/pdf/模电第三章_轻量版_v2.pdf'),support=path.join(base,'模电第三章_轻量版_v2_配套');
fs.mkdirSync(support,{recursive:true});
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rel=(from,to)=>path.relative(path.dirname(from),to).split(path.sep).join('/');
const isExternal=s=>/^(https?:|mailto:|data:)/i.test(s);
const allFiles=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()){if(!['.git','node_modules','final-v2-2026-10-22'].includes(e.name))walk(path.join(d,e.name));}else allFiles.push(path.join(d,e.name));}}
walk(project);const index=new Map();for(const f of allFiles){const n=path.basename(f).toLowerCase();if(!index.has(n))index.set(n,[]);index.get(n).push(f);}
function resolve(source,url){
 const k=url.indexOf('#'),p=decodeURIComponent(k<0?url:url.slice(0,k)),hash=k<0?'':url.slice(k);
 if(!p)return {file:source,hash};
 const file=path.resolve(path.dirname(source),p),inside=!path.relative(project,file).startsWith('..');
 if(inside&&fs.existsSync(file))return {file,hash};
 const candidates=index.get(path.basename(p).toLowerCase())||[];
 if(candidates.length===1)return {file:candidates[0],hash};
 const normalized=p.replace(/\\/g,'/').replace(/^\.\//,'').toLowerCase();
 const suffix=candidates.filter(f=>f.replace(/\\/g,'/').toLowerCase().endsWith('/'+normalized));
 if(suffix.length===1)return {file:suffix[0],hash};
 if(candidates.length&&new Set(candidates.map(f=>sha(fs.readFileSync(f)))).size===1)return {file:candidates.sort((a,b)=>a.length-b.length)[0],hash};
 return {file:null,hash,missing:p};
}
function maskMath(text){const list=[];return {text:text.replace(/\$\$([\s\S]*?)\$\$|(?<!\\)\$([^\n$]+?)(?<!\\)\$/g,(all,d,i)=>{const n=list.length;list.push({tex:(d===undefined?i:d).replace(/^> ?/gm,''),display:d!==undefined});return `MATHSAVED${n}END`; }),list};}
const docs=new Map(),unresolved=[];
function discover(source){
 if(docs.has(source))return;
 const text=fs.readFileSync(source,'utf8');const output=source===main?mainHTML:path.join(support,path.basename(source,'.md')+'.html');
 if([...docs.values()].some(d=>d.output===output))throw Error('Duplicate companion name: '+output);
 docs.set(source,{source,text,output,hash:sha(fs.readFileSync(source))});
 marked.walkTokens(marked.lexer(maskMath(text).text),t=>{if(!['link','image'].includes(t.type)||!t.href||isExternal(t.href)||t.href.startsWith('#'))return;const r=resolve(source,t.href);if(r.file&&path.extname(r.file).toLowerCase()==='.md')discover(r.file);});
}
discover(main);
const oldCSS=fs.readFileSync(path.join(base,'tmp/light-export-2026-10-21/reader.css'),'utf8');
const extraCSS=`
.article blockquote{color:#234e78}.article blockquote .math-block{color:inherit;background:transparent;border:0;padding:5px 0}.article .kind-personal{color:#234e78}.article .kind-warning{color:#984825}.article p>strong:first-child{line-height:1.65}.figure-group{margin:24px 0}.figure-group img{margin:0 auto}.figure-group .figure-caption{font-size:13px;line-height:1.8;color:#53645a}.article img{cursor:zoom-in}.article .source-anchor{display:block;scroll-margin-top:78px}.article .kind-ai{color:#236b63}.article .unresolved{color:#984825;background:#fff5e9}.print-toc{display:none}.print-toc-title{font-weight:700}.math-block{max-width:100%}.article p:has(+.math-block){margin-bottom:8px}.article table .katex{font-size:.97em}
@media print{
 body{font-size:10.5pt;line-height:1.7}.article h2{break-before:auto}.article h1,.article h2,.article h3,.article h4{break-after:avoid}.article p{orphans:3;widows:3}.article p.label-line{break-after:avoid}.article p:has(+.math-block){break-after:avoid}.article .kind-warning,.article .kind-quote{break-inside:auto}.article blockquote{break-inside:auto;background:#f7f9fc;padding:1mm 3mm}.article blockquote p{orphans:3;widows:3}.article .math-block{overflow:visible;break-inside:avoid;padding:2mm 1mm;margin:3mm 0}.article .katex-display>.katex{font-size:var(--print-math-size,1em)}.article .figure-group{break-inside:avoid;margin:4mm 0}.article .figure-group img{max-width:100%;max-height:170mm;width:auto;height:auto;object-fit:contain;margin:auto}.article .figure-group.handwriting img{max-height:205mm}.article .figure-caption{font-size:9pt;line-height:1.65;margin:2mm 0 0}.article table{font-size:9.2pt;table-layout:auto;line-height:1.65}.article th,.article td{padding:1.8mm 2mm;overflow-wrap:anywhere}.article tr{break-inside:avoid}.article thead{display:table-header-group}.table-wrap{overflow:visible}.article pre{white-space:pre-wrap;overflow-wrap:anywhere}.print-toc{display:block;break-after:page;break-inside:avoid;margin:5mm 0;padding:3mm 0}.print-toc-items{columns:2;column-gap:8mm}.print-toc a{display:block;text-decoration:none;line-height:1.7;font-size:8.8pt;padding:1mm 0;break-inside:avoid}.print-toc a.level-4{padding-left:3mm;font-size:8.2pt}.print-toc a.level-2{font-weight:bold}.source-anchor{height:0;break-after:avoid}.article :target{animation:none}
}`;
fs.writeFileSync(path.join(support,'reader.css'),oldCSS+extraCSS);
fs.copyFileSync(path.join(base,'tmp/light-export-2026-10-21/reader.js'),path.join(support,'reader.js'));
const checks=[];
function render(d){
 const {text,list}=maskMath(d.text);let body=marked.parse(text,{gfm:true});
 body=body.replace(/<p>(MATHSAVED\d+END)<\/p>/g,'$1').replace(/MATHSAVED(\d+)END/g,(_,n)=>{const m=list[+n];const rendered=katex.renderToString(m.tex,{displayMode:m.display,throwOnError:true,strict:'ignore'});return m.display?`<div class="math-block" data-tex="${esc(m.tex)}">${rendered}</div>`:rendered;});
 body=body.replace(/\b(href|src)="([^"]+)"/g,(all,attr,raw)=>{
  const url=raw.replace(/&amp;/g,'&');if(isExternal(url)||url.startsWith('#'))return all;
  const r=resolve(d.source,url);
  if(!r.file){unresolved.push({source:d.source,url});if(attr==='src')throw Error('Missing image: '+url);return `data-missing-reference="${esc(url)}" class="unresolved"`;}
  const dest=docs.get(r.file)?.output||r.file;return `${attr}="${esc(rel(d.output,dest)+r.hash)}"`;
 });
 checks.push({source:d.source,output:d.output,maths:list.length,hash:d.hash});return body;
}
function shell(d,body){const mainDoc=d.source===main;return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="source-sha256" content="${d.hash}"><title>${esc(path.basename(d.source,'.md'))}</title><link rel="stylesheet" href="${esc(rel(d.output,path.join(base,'web-notes/assets/katex.min.css')))}"><link rel="stylesheet" href="${esc(rel(d.output,path.join(support,'reader.css')))}"></head><body><a class="skip" href="#content">跳至正文</a><header class="topbar"><a class="brand" href="${mainDoc?'#top':esc(rel(d.output,mainHTML))}">模电第三章 · ${mainDoc?'轻量版 v2':'原始档案回查'}</a><div class="tools"><button class="pending-button">待核对</button><a class="desktop-only" href="${esc(rel(d.output,pdf))}">PDF</a><button class="print-button desktop-only">打印</button><button class="menu-button" aria-controls="sidebar" aria-expanded="false">目录</button></div></header><aside class="sidebar" id="sidebar"><div class="side-label">章节目录</div><nav class="toc" aria-label="章节目录"></nav><div class="legend"><span>主体知识</span><span class="original">我的原始理解</span><span class="ai">AI 补充</span><span class="warning">校正／待核对</span></div></aside><div class="backdrop"></div><main class="page" id="top">${mainDoc?'':`<p class="return-link"><a href="${esc(rel(d.output,mainHTML))}">← 返回轻量版 v2</a></p>`}<article class="article" id="content">${body}</article><footer class="page-footer"><a href="#top">返回顶部</a></footer></main><dialog class="pending-dialog"><div class="dialog-head"><h2>待核对与校正回查</h2><button class="close-dialog">关闭</button></div><ul class="pending-list"></ul></dialog><script src="${esc(rel(d.output,path.join(support,'reader.js')))}"></script></body></html>`;}
for(const d of docs.values())fs.writeFileSync(d.output,shell(d,render(d)));

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  for(const d of docs.values()){
   await page.goto(pathToFileURL(d.output).href);await page.waitForFunction(()=>window.READER_READY);
   const info=await page.evaluate(isMain=>{
    const article=document.getElementById('content');const original=article.textContent.replace(/\s/g,'');
    article.querySelectorAll('a[id]:not([href])').forEach(a=>{if(a.textContent.trim())return;const holder=a.parentElement.tagName==='P'&&a.parentElement.children.length===1&&!a.parentElement.textContent.trim()?a.parentElement:a;const next=holder.nextElementSibling;if(next&&!next.id){next.id=a.id;holder.remove();}else a.classList.add('source-anchor');});
    const used=new Set([...document.querySelectorAll('[id]')].map(e=>e.id));
    article.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h,i)=>{if(!h.id){let id='heading-'+i;while(used.has(id))id+='x';h.id=id;used.add(id);}});
    const headings=[...article.querySelectorAll('h2,h3,h4')];const nav=document.querySelector('.toc');
    headings.forEach(h=>{const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;a.className='level-'+h.tagName.slice(1);nav.append(a);});
    article.querySelectorAll('p').forEach(p=>{
     const strong=p.firstElementChild?.tagName==='STRONG'?p.firstElementChild:null;const label=strong?.textContent||'';
     if(strong&&p.textContent.trim()===label.trim())p.classList.add('label-line');
     if(/校正|修正|待核对|待确认|尚未解决|需要修正/.test(label))p.classList.add('kind-warning');
     else if(/^我的|原文呈现/.test(label))p.classList.add('kind-personal');
     else if(/^AI /.test(label))p.classList.add('kind-ai');
    });
    article.querySelectorAll('table').forEach(t=>{const box=document.createElement('div');box.className='table-wrap';t.before(box);box.append(t);});
    article.querySelectorAll('p').forEach(p=>{
     if(p.children.length!==1||p.firstElementChild.tagName!=='IMG')return;
     const img=p.firstElementChild,figure=document.createElement('figure');figure.className='figure-group'+(/hand[12]-\d+\.jpg/.test(img.src)?' handwriting':'');
     if(p.id)figure.id=p.id;p.before(figure);figure.append(img);p.remove();
     const next=figure.nextElementSibling;
     if(next?.tagName==='P'&&(/^(图｜|图中文字与箭头)/.test(next.textContent.trim()))){next.classList.add('figure-caption');figure.append(next);}
     const link=document.createElement('a');link.href=img.getAttribute('src');link.target='_blank';link.rel='noopener';img.before(link);link.append(img);
    });
    const warnings=[...article.querySelectorAll('.kind-warning,p')].filter((p,i,a)=>a.indexOf(p)===i&&(p.classList.contains('kind-warning')||/【待核对：/.test(p.textContent)));
    warnings.forEach((p,i)=>{if(!p.id)p.id='review-'+(i+1);const li=document.createElement('li'),a=document.createElement('a'),small=document.createElement('small');a.href='#'+p.id;const previous=headings.filter(h=>h.compareDocumentPosition(p)&Node.DOCUMENT_POSITION_FOLLOWING).pop();a.textContent=previous?.textContent||'资料待核对';const copy=p.cloneNode(true);copy.querySelectorAll('.katex-mathml').forEach(x=>x.remove());small.textContent=copy.textContent.slice(0,140);li.append(a,small);document.querySelector('.pending-list').append(li);});
    article.querySelectorAll('[data-missing-reference]').forEach(a=>{a.title='待核对：项目工作区未找到 '+a.getAttribute('data-missing-reference');});
    if(original!==article.textContent.replace(/\s/g,''))throw Error('Body text changed during HTML layout');
    if(isMain){const toc=document.createElement('nav');toc.className='print-toc';toc.setAttribute('aria-label','打印目录');toc.innerHTML='<div class="print-toc-title">章节导航</div><div class="print-toc-items"></div>';headings.forEach(h=>{const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;a.className='level-'+h.tagName.slice(1);toc.lastElementChild.append(a);});headings[0].before(toc);}
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);if(new Set(ids).size!==ids.length)throw Error('Duplicate ids');
    const clone=article.cloneNode(true);clone.querySelectorAll('.print-toc,.katex-mathml').forEach(x=>x.remove());
    const chunks=[...clone.querySelectorAll('p,li,td,th,h1,h2,h3,h4')].filter(e=>!e.querySelector('.katex')&&!e.querySelector('p,li,td,th,h1,h2,h3,h4')).map(e=>e.textContent.trim()).filter(x=>x.length>=5);
    return {headings:headings.map(h=>({id:h.id,text:h.textContent})),images:document.images.length,maths:article.querySelectorAll('.katex').length,originalBlocks:article.querySelectorAll('blockquote').length,chunks};
   },d.source===main);
   await page.evaluate(()=>document.fonts.ready);
   fs.writeFileSync(d.output,'<!doctype html>\n'+await page.locator('html').evaluate(e=>e.outerHTML));
   const entry=checks.find(c=>c.source===d.source);Object.assign(entry,info);if(d.source===main)fs.writeFileSync(path.join(work,'body-text-chunks.json'),JSON.stringify(info.chunks));delete entry.chunks;
  }
  for(const d of docs.values())if(sha(fs.readFileSync(d.source))!==d.hash)throw Error('Markdown source changed while rendering');
 }finally{await browser.close();}
 fs.writeFileSync(path.join(work,'build-report.json'),JSON.stringify({main,mainHTML,pdf,documents:checks,unresolved},null,2));
 console.log(JSON.stringify({documents:docs.size,main:checks[0],unresolved},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
