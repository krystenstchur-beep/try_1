'use strict';
const escapeHTML = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderMarkdown(source) {
  const maths = [];
  const protectedText = source.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (match, block, inline) => {
    const token = 'MATHTOKEN' + maths.length + 'END';
    maths.push({tex: block === undefined ? inline : block, display: block !== undefined});
    return block === undefined ? token : '\n\n' + token + '\n\n';
  });
  const prepared = protectedText
    .replace(/^(#{4,5}) /gm, (_, hashes) => hashes.slice(1) + ' ')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  let html = marked.parse(prepared);
  html = html.replace(/<p>(MATHTOKEN\d+END)<\/p>/g, '$1');
  return html.replace(/MATHTOKEN(\d+)END/g, (_, id) => {
    const math = maths[Number(id)];
    try {
      const result = katex.renderToString(math.tex.trim(), {displayMode:math.display,throwOnError:true,strict:'ignore'});
      return math.display ? '<div class="math-block">' + result + '</div>' : result;
    } catch (error) {
      console.error('公式排版失败', math.tex, error);
      return '<code class="math-error">' + escapeHTML(math.tex) + '</code>';
    }
  }).replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
}
function init() {
  const config = window.NOTE_CONFIG || {};
  const article = document.getElementById('content');
  const preface = document.getElementById('note-preface');
  if (preface) preface.innerHTML = renderMarkdown(window.NOTE_MARKDOWN.split(/^### /m)[0].replace(/^#{1,2} .+$/gm,''));
  const blocks = window.NOTE_MARKDOWN.split(/^### /m).slice(1);
  const labels = blocks.map(block => block.slice(0,block.indexOf('\n')).replace(/^[一二三四五六七八九十]+、/,'').replace(config.sectionNumbers ? /^\d+\.\d+\s+/ : /$^/,'').trim());
  const number = index => config.sectionNumbers?.[index] || String(index+1).padStart(2,'0');
  article.innerHTML = blocks.map((block,index) => {
    const newline = block.indexOf('\n');
    const heading = labels[index];
    return '<section class="note-section" id="section-' + (index + 1) + '"><h2><span class="section-number">' + number(index) + '</span>' + escapeHTML(heading) + '</h2>' + renderMarkdown(block.slice(newline+1)) + '</section>';
  }).join('');
  article.querySelectorAll('img[src^="web-notes/"]').forEach(img => {
    img.setAttribute('src',img.getAttribute('src').slice('web-notes/'.length));
    img.loading='lazy';
  });
  const sideQuestions = [...article.querySelectorAll('.manuscript-questions')];
  sideQuestions.forEach(aside => {
    aside.querySelectorAll('details').forEach(detail => {
      const copy=detail.cloneNode(true);
      copy.removeAttribute('open');
      document.getElementById('source-question-archive').appendChild(copy);
    });
    aside.hidden=true;
    document.getElementById('context-margin').appendChild(aside);
  });
  document.querySelectorAll('#source-question-archive summary').forEach((summary,index) => {
    const number=document.createElement('span');
    number.textContent=String(index+1).padStart(2,'0');
    const toggle=document.createElement('b');
    toggle.textContent='＋';
    toggle.setAttribute('aria-hidden','true');
    summary.prepend(number);
    summary.append(toggle);
  });
  document.getElementById('question-count').textContent=String(document.querySelectorAll('#questions details').length).padStart(2,'0');
  article.querySelectorAll('p').forEach(paragraph => {
    if(paragraph.firstElementChild?.tagName==='STRONG' && paragraph.firstElementChild.textContent==='结论。'){
      const formula=paragraph.nextElementSibling;
      const statement=document.createElement('div');
      statement.className='property-statement';
      paragraph.before(statement);
      statement.append(paragraph);
      if(formula?.classList.contains('math-block'))statement.append(formula);
    }
  });
  const sections = [...document.querySelectorAll('.note-section')];
  const parts = sections.map((section, index) => [...section.querySelectorAll('h3')].map((heading, partIndex) => {
    heading.id='section-' + (index+1) + '-part-' + (partIndex+1);
    return {id:heading.id,label:heading.textContent.replace(/^\d+\.\s*/,'')};
  }));
  document.getElementById('toc').innerHTML = labels.map((label,index) =>
    '<div class="toc-group"><a class="toc-main" href="#section-' + (index+1) + '"><span>' + number(index) + '</span>' + escapeHTML(label) + '</a><div class="toc-children">' +
    parts[index].map(part=>'<a class="toc-child" href="#'+part.id+'">'+escapeHTML(part.label)+'</a>').join('') + '</div></div>'
  ).join('');
  const colors = ['intro','removable','pole','zero','essential'];
  document.getElementById('knowledge-path').innerHTML=labels.map((label,index)=>
    '<a class="path-node '+(colors[index]||'intro')+'" href="#section-'+(index+1)+'"><div class="path-top"><span>'+number(index)+'</span><span aria-hidden="true">↗</span></div><h3>'+escapeHTML(config.pathTitles?.[index] || label)+'</h3><p>'+
    (config.pathDescriptions?.[index] || parts[index].map(part=>part.label.replace('与理解',''))).map(escapeHTML).join('<br>')+'</p></a>'
  ).join('');
  document.getElementById('section-count').textContent=String(sections.length).padStart(2,'0');
  article.querySelectorAll('blockquote').forEach(el => {if (/原稿修正|易错点/.test(el.textContent)) el.classList.add('correction');});
  document.querySelectorAll('[data-math]').forEach(el => {katex.render(el.dataset.math,el,{throwOnError:false,strict:'ignore'});});
  document.querySelectorAll('a[href^="https:"]').forEach(el => {el.target='_blank';el.rel='noopener noreferrer';});
  document.querySelectorAll('a[href^="#"]').forEach(el => el.addEventListener('click',() => {
    document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-button').setAttribute('aria-expanded','false');
  }));
  const nav = [...document.querySelectorAll('#toc .toc-main')];
  let scheduled=false;
  function updateReading() {
    scheduled=false;
    const total = document.documentElement.scrollHeight-innerHeight;
    const percent = Math.max(0,Math.min(100,total>0?Math.round(scrollY/total*100):0));
    document.getElementById('progress').style.width=percent+'%';
    document.getElementById('side-progress').style.width=percent+'%';
    document.getElementById('progress-text').textContent=percent+'%';
    let active=0;
    sections.forEach((section,index)=>{if(section.getBoundingClientRect().top<160)active=index;});
    nav.forEach((link,index)=>{link.classList.toggle('active',index===active);link.parentElement.classList.toggle('active',index===active);if(index===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    document.querySelectorAll('.path-node').forEach((link,index)=>link.classList.toggle('current',index===active));
    let hasContext=false;
    sideQuestions.forEach(aside=>{
      const matches=aside.dataset.section===sections[active].id;
      aside.hidden=!matches;
      if(matches)hasContext=true;
    });
    document.getElementById('general-margin').hidden=hasContext;
    const current=document.getElementById('questions').getBoundingClientRect().top<innerHeight*.5?2:document.getElementById('content').getBoundingClientRect().top<innerHeight*.5?0:1;
    document.querySelectorAll('.reading-tabs a').forEach((link,index)=>link.classList.toggle('active',index===current));
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(updateReading);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);updateReading();
  document.getElementById('font-button').addEventListener('click',function(){const active=document.body.classList.toggle('large-type');this.setAttribute('aria-pressed',String(active));schedule();});
  document.getElementById('focus-button').addEventListener('click',function(){const active=document.body.classList.toggle('focus-mode');this.setAttribute('aria-pressed',String(active));schedule();});
  document.getElementById('print-button').addEventListener('click',()=>window.print());
  document.getElementById('menu-button').addEventListener('click',function(){const active=document.getElementById('sidebar').classList.toggle('open');this.setAttribute('aria-expanded',String(active));});
  addEventListener('keydown',event=>{if(event.key==='Escape'){document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-button').setAttribute('aria-expanded','false');}});
  window.NOTES_READY=true;
}
try{init();}catch(error){console.error(error);document.getElementById('content').innerHTML='<p>笔记排版未能完成。请确认 assets 文件夹完整，或使用侧栏中的 Markdown 原文链接。</p>';}
