(() => {
  const menu=document.querySelector('.menu-button'), side=document.querySelector('.sidebar'), shade=document.querySelector('.backdrop');
  function closeMenu(){side?.classList.remove('open');shade?.classList.remove('visible');menu?.setAttribute('aria-expanded','false');}
  menu?.addEventListener('click',()=>{const open=!side.classList.contains('open');side.classList.toggle('open',open);shade.classList.toggle('visible',open);menu.setAttribute('aria-expanded',String(open));});
  shade?.addEventListener('click',closeMenu);
  document.querySelectorAll('.toc a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.querySelector('.print-button')?.addEventListener('click',()=>window.print());
  const dialog=document.querySelector('.pending-dialog');
  document.querySelector('.pending-button')?.addEventListener('click',()=>{closeMenu();dialog?.showModal();});
  dialog?.querySelector('.close-dialog')?.addEventListener('click',()=>dialog.close());
  dialog?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>dialog.close()));
  dialog?.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
  const heads=[...document.querySelectorAll('#content h2[id],#content h3[id],#content h4[id]')];
  let queued=false;
  function sync(){queued=false;const h=heads.filter(h=>h.getBoundingClientRect().top<125).pop()||heads[0];if(!h)return;document.querySelectorAll('.toc a').forEach(a=>{const active=decodeURIComponent(a.hash.slice(1))===h.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(sync);}},{passive:true});sync();
  window.addEventListener('beforeprint',()=>{document.querySelectorAll('.math-block').forEach(b=>{const math=b.querySelector('.katex-display>.katex');if(!math)return;math.style.removeProperty('--print-math-size');const s=getComputedStyle(b),space=b.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-4;const w=math.scrollWidth;if(w>space)math.style.setProperty('--print-math-size',Math.max(.65,space/w)+'em');});});
  window.READER_READY=true;
})();
