// Rebuild the static reading copy from the editable Markdown. No external packages required.
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;
const marked=require(path.join(dir,'assets/marked.umd.js'));
const katex=require(path.join(dir,'assets/katex.min.js'));
const markdown=fs.readFileSync(path.join(dir,'模电第三章_保留原稿修订版.md'),'utf8');
let mathCount=0;
function render(source){
 const maths=[];
 source=source.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g,(m,b,i)=>{const id=maths.length;maths.push({tex:b===undefined?i:b,display:b!==undefined});return b===undefined?`MATHTOKEN${id}END`:`\n\nMATHTOKEN${id}END\n\n`;});
 source=source.replace(/^(#{4,5}) /gm,(_,h)=>h.slice(1)+' ').replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
 let html=marked.parse(source).replace(/<p>(MATHTOKEN\d+END)<\/p>/g,'$1');
 html=html.replace(/MATHTOKEN(\d+)END/g,(_,id)=>{const m=maths[+id];mathCount++;const s=katex.renderToString(m.tex.trim(),{displayMode:m.display,throwOnError:true,strict:'ignore'});return m.display?`<div class="math-block">${s}</div>`:s;});
 return html.replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
}
const [main,appendix]=markdown.split('<!-- APPENDIX -->');
const split=main.split(/^### /m),preface=split.shift().replace(/^#{1,2} .+$/gm,'');
const titles=[],questions=[];
const sections=split.map((s,i)=>{
 const nl=s.indexOf('\n'),title=s.slice(0,nl);titles.push(title);
 let html=render(s.slice(nl+1));
 html=html.replace(/<aside class="manuscript-questions"[\s\S]*?<\/aside>/g,a=>{
   questions.push(a.replace(/<aside /,'<aside id="question-group-'+(i+1)+'" '));
   return `<a class="section-questions-link" href="#question-group-${i+1}">本节疑问索引与回到正文链接 →</a>`;
 });
 return `<section class="note-section" id="section-${i+1}"><h2>${title}</h2>${html}</section>`;
}).join('\n');
const toc=titles.map((t,i)=>`<a href="#section-${i+1}">${t}</a>`).join('');
const legend='<div class="revision-legend"><span class="legend-original">我的原始内容</span><span class="legend-textbook">教材知识</span><span class="legend-ai">AI 补充／旧版转述</span><span class="legend-correction">修正与重要边界</span></div>';
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>模电第三章 · 保留原稿修订版</title><link rel="stylesheet" href="assets/katex.min.css"><link rel="stylesheet" href="base-style.css"><link rel="stylesheet" href="base-analog.css"><link rel="stylesheet" href="revision.css"></head>
<body class="circuit-notes analog-notes"><a class="skip" href="#content">跳至正文</a>
<header class="topbar"><a class="brand" href="#top"><span class="brand-symbol">β</span><span>模电 · 个人教材</span></a><div class="toolbar"><a href="#questions">疑问</a><a class="desktop-only" href="模电第三章_保留原稿修订版.md" download>源文件</a><button id="print-button" class="desktop-only">打印</button><button id="font-button" class="desktop-only" aria-pressed="false">Aa</button><button id="menu-button" aria-expanded="false" aria-controls="sidebar">目录 ☰</button></div></header>
<aside class="sidebar" id="sidebar"><div class="sidebar-label">第三章 · 3.1—3.9</div><nav id="toc">${toc}<a href="#questions">疑问索引</a><a href="#facsimiles">手写影印附录</a></nav><a class="source-link course-link" href="修改记录.md">修改记录 ↗</a><a class="source-link course-link" href="模电第三章_保留原稿修订版.md" download>可编辑 Markdown ↗</a><a class="source-link course-link" href="../pdf/模电第三章_原稿保留修订版_2026-10-21.pdf">PDF 阅读版 ↗</a></aside>
<main id="top"><div class="page-shell"><section class="hero"><div class="hero-copy"><div class="eyebrow">个人教材 · 原稿保留修订版 · 2026-10-21</div><h1>双极型晶体管<small>及其放大电路基础 · 3.1—3.9</small></h1><p class="hero-intro">保留当时怎样思考，再补上现在能够确认的理解。</p>${legend}</div></section><nav class="print-cover-toc"><h2>本章目录</h2>${toc}<a href="#questions">附录一 · 疑问索引</a><a href="#facsimiles">附录二 · 18 张手写原图</a></nav>
<details class="intro-notes" open><summary>修订约定、资料差异与符号</summary><div class="article">${render(preface)}</div></details>
<div class="body-layout"><article class="article" id="content">${sections}</article><aside class="margin-notes"><div class="context-box">${legend}<p>深蓝记录当时的思路，也保留暂时不成熟的判断。正确计算与适用条件请连同后面的核对块阅读。</p><a href="#questions">打开全部疑问 →</a></div><div id="context-margin"></div></aside></div>
<section class="questions" id="questions"><h2 class="questions-title">附录一 · 旧版疑问索引</h2><p class="source-ai">下列题目和答复由上一版 AI 整理，保留供定位，不声称都是你的逐字提问。完整原始疑问、留白和推理已放回正文深蓝块。</p><div id="source-question-archive">${questions.map(a=>'<div class="source-block source-ai">'+a+'</div>').join('')}</div></section>
<section class="article facsimile-intro" id="facsimiles">${render(appendix)}</section><footer class="revision-footer">独立另存版本 · 原 Markdown、网页和旧 PDF 保持原样。</footer></div></main>
<script>
const menu=document.getElementById('menu-button'),side=document.getElementById('sidebar');
menu.onclick=()=>{menu.setAttribute('aria-expanded',String(side.classList.toggle('open')))};
side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{side.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
document.getElementById('font-button').onclick=function(){this.setAttribute('aria-pressed',String(document.body.classList.toggle('large-type')))};
document.getElementById('print-button').onclick=()=>print();
document.querySelectorAll('.note-section h3').forEach((h,i)=>{if(!h.id)h.id='revision-heading-'+i});
const sections=[...document.querySelectorAll('.note-section')];let current='';
function sync(){let s=sections.filter(s=>s.getBoundingClientRect().top<160).pop()||sections[0];if(!s||current===s.id)return;current=s.id;document.querySelectorAll('#toc a').forEach(a=>a.classList.toggle('active',a.hash==='#'+s.id));let group=document.querySelector('#question-group-'+s.id.split('-')[1]);const box=document.getElementById('context-margin');box.innerHTML='';if(group){const copy=group.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.classList.add('source-ai');box.append(copy)}}
addEventListener('scroll',sync,{passive:true});sync();
addEventListener('beforeprint',()=>document.querySelectorAll('details').forEach(d=>d.open=true));
window.NOTES_READY=true;
</script></body></html>`;
fs.writeFileSync(path.join(dir,'index.html'),html);
console.log(JSON.stringify({sections:titles.length,mathCount,questions:questions.length,htmlBytes:Buffer.byteLength(html)}));
