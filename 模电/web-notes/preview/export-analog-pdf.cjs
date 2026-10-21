// Export the existing, fully rendered notes; keep web/Markdown sources unchanged.
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'output/pdf/模电第三章_双极型晶体管及其放大电路基础_3.1-3.9.pdf');

(async () => {
  fs.mkdirSync(path.dirname(output), {recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  try {
    const page = await browser.newPage({viewport:{width:1100,height:900}, reducedMotion:'reduce'});
    await page.goto(pathToFileURL(path.join(root,'web-notes/analog.html')).href);
    await page.waitForFunction(() => window.NOTES_READY);
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(img => {img.loading='eager';});
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
      const toc = document.createElement('nav');
      toc.className = 'pdf-toc';
      toc.innerHTML = '<h2>本章目录</h2>' + [...document.querySelectorAll('.note-section h2')].map(h => `<a href="#${h.closest('.note-section').id}">${h.innerHTML}</a>`).join('') +
        '<a href="#questions">附录 · 我的疑问与理解</a>';
      document.querySelector('.hero').after(toc);
      const preface = document.createElement('section');
      preface.className = 'pdf-preface article';
      preface.innerHTML = '<h2>材料顺序与整理约定</h2>' + document.getElementById('note-preface').innerHTML;
      toc.after(preface);
      document.querySelectorAll('#questions details').forEach(d => {d.open=true;});
      document.querySelector('#questions .section-label').innerHTML = '<h2>附录 · 我的疑问与理解</h2>';
      document.querySelectorAll('#questions summary b').forEach(e => e.remove());
      // The print appendix contains all source questions, not the context-dependent clone.
      document.querySelectorAll('#questions .manuscript-questions').forEach(e => {
        e.hidden=false;
        e.style.maxHeight='none';
        e.style.overflow='visible';
      });
      // Keep headings with the following content, including intervening anchor nodes.
      [...document.querySelectorAll('#content h2,#content h3,#content h4')].reverse().forEach(h => {
        const group=document.createElement('div');
        group.className='pdf-heading-block';
        h.before(group);
        group.append(h);
        while(group.nextElementSibling) {
          const next=group.nextElementSibling;
          group.append(next);
          if(next.textContent.trim() || next.querySelector('img')) {
            if(['H2','H3'].includes(h.tagName) && next.tagName==='P' && group.nextElementSibling?.classList.contains('pdf-heading-block')) continue;
            break;
          }
        }
      });
      const sourceHeading=[...document.querySelectorAll('#content h3')].find(h=>h.textContent.includes('材料依据'));
      if(sourceHeading) {
        const first=sourceHeading.closest('.pdf-heading-block');
        const source=document.createElement('div');
        source.className='pdf-source-index';
        first.before(source);
        while(source.nextElementSibling) source.append(source.nextElementSibling);
      }
    });
    await page.emulateMedia({media:'print'});
    await page.addStyleTag({content:`
      @page { size: A4; }
      html,body { background:white!important; }
      body { color:#283b33; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .hero { padding:18mm 0 10mm!important; }
      .hero h1 { font-size:30pt!important; line-height:1.5; }
      .hero h1 small { font-size:18pt; }
      .hero .eyebrow,.hero .hero-intro,.hero .hero-tags { display:flex!important; }
      .hero .hero-intro { display:block!important; margin:6mm 0; font-size:12pt; }
      .hero .hero-tags { font-size:10pt; }
      .pdf-toc { padding:0 0 8mm; break-after:page; }
      .pdf-toc h2 { font-size:14pt; padding:0 0 3mm; border-bottom:1px solid #d8e4d0; }
      .pdf-toc a { display:block; padding:2mm 3mm; font-size:11pt; border-bottom:1px solid #e9eee4; }
      .pdf-toc .section-number { display:inline-block; width:11mm; font-size:11pt; }
      .pdf-preface { break-after:page; }
      .pdf-preface h2 { display:block; font-size:19pt; }
      .article { font-size:10.5pt!important; line-height:1.8; }
      .article p { margin:3mm 0; orphans:3; widows:3; }
      .article li { margin:1.5mm 0; orphans:2; widows:2; }
      .article .note-section { padding:8mm 0 0; border:0; }
      .article .note-section:first-child { padding-top:0; }
      .pdf-heading-block { break-inside:avoid; }
      .article h2 { font-size:19pt!important; margin:0 0 5mm; }
      .article h3 { font-size:13pt; margin:6mm 0 3mm; }
      .article h4 { font-size:11.5pt!important; margin:5mm 0 2mm; }
      h2,h3,h4,summary { break-after:avoid; }
      .property-statement { padding:4mm; margin:4mm 0; break-inside:avoid; }
      .property-statement p { line-height:1.8!important; }
      .math-block { margin:4mm 0; padding:3mm; overflow:visible!important; }
      .article .math-block .katex { font-size:1em; }
      .math-block .katex-display>.katex { white-space:nowrap!important; }
      .article blockquote { margin:4mm 0; padding:1mm 4mm; }
      .article .table-wrap { overflow:visible; margin:4mm 0; }
      .article table { min-width:0!important; font-size:9pt!important; line-height:1.65; table-layout:auto; }
      .article th,.article td { padding:2.2mm; min-width:0!important; }
      .article thead { display:table-header-group; }
      .article tr { break-inside:avoid; }
      .article .pdf-source-index { font-size:9.5pt; line-height:1.65; }
      .article .pdf-source-index table { font-size:8.5pt!important; line-height:1.55; }
      .article .pdf-source-index td,.article .pdf-source-index th { padding:1.7mm; }
      .article img { width:auto!important; max-width:100%!important; max-height:150mm; margin:4mm auto!important; break-inside:avoid; }
      .questions { display:block!important; break-before:page; padding:0; }
      .questions .section-label { margin-bottom:6mm; }
      .questions .section-label h2 { font-size:19pt; }
      #source-question-archive { font-size:10.5pt; line-height:1.8; }
      .questions details { break-inside:avoid; border-bottom:1px solid #d8e4d0; padding:0 0 3mm; }
      .questions summary { padding:4mm 0 2mm; font-size:11pt; font-weight:600; }
      .questions details>div { padding:0 3mm 3mm; font-size:10.5pt; color:#445148; line-height:1.8; max-width:none; }
      .questions details p { orphans:3; widows:3; }
      .questions details a { font-size:10pt; }
      .questions summary:after { display:none; }
      .questions .math-block { font-size:10pt; }
      .side-question-label { font-size:12pt; margin:5mm 0 2mm; }
      .side-question-intro { font-size:10pt; }
    `});
    await page.setViewportSize({width:665,height:990});
    // Scale only unusually wide displayed equations to fit the printable line.
    await page.evaluate(() => {
      document.querySelectorAll('.math-block').forEach(block => {
        const math=block.querySelector('.katex-display>.katex');
        if(!math)return;
        const available=block.clientWidth-parseFloat(getComputedStyle(block).paddingLeft)-parseFloat(getComputedStyle(block).paddingRight);
        if(math.scrollWidth>available) math.style.fontSize=(parseFloat(getComputedStyle(math).fontSize)*available/math.scrollWidth)+'px';
      });
    });
    const errors = await page.locator('.katex-error,.math-error').count();
    if(errors) throw new Error(`${errors} formula errors`);
    await page.pdf({
      path:output, format:'A4', printBackground:true, preferCSSPageSize:true,
      margin:{top:'17mm',right:'17mm',bottom:'18mm',left:'17mm'},
      displayHeaderFooter:true,
      headerTemplate:'<div style="width:100%;margin:0 17mm;font:8px sans-serif;color:#7b8978;border-bottom:1px solid #e2e8de;padding-bottom:5px">模电 · 第三章　双极型晶体管及其放大电路基础　3.1—3.9</div>',
      footerTemplate:'<div style="width:100%;margin:0 17mm;display:flex;justify-content:space-between;font:9px sans-serif;color:#7b8978"><span>个人学习笔记 · 保留思考，让理解可以重访</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
      outline:true, tagged:true
    });
    console.log(JSON.stringify({output,bytes:fs.statSync(output).size,formulaErrors:errors}));
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
