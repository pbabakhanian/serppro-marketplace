(function () {
  'use strict';

  var API_KEY = 'spp_api_sz5XoYXgrPZWG14itXtfOCvxh1H4j5pI';
  var AUTH    = 'Basic ' + btoa(API_KEY + ':');
  var FOLDERS = [40, 41, 43, 47, 49];
  var SENS    = ['adult','casino','gambling','igaming','cannabis','dating','sweepstakes','xxx','sex','poker','betting'];

  var all = [], filtered = [];
  var page = 1, rpp = 25;
  var sortF = 'price', sortD = 'asc';
  var loading = false, loaded = 0;

  var favs    = ls('mp2_favs',    {});
  var blocks  = ls('mp2_blocks',  {});
  var presets = ls('mp2_presets', {});
  var cols    = { dr:1, da:1, traffic:1, spark:1, topics:1, df:1, price:1 };

  function ls(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch(e){ return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function id(x)    { return document.getElementById(x); }

  function gf() {
    return {
      q:   (id('mp2-q').value||'').trim().toLowerCase(),
      dr0: num('mp2-dr0', 0),    dr1: num('mp2-dr1', 100),
      tr0: num('mp2-tr0', 0),    tr1: num('mp2-tr1', Infinity),
      pr0: num('mp2-pr0', 0),    pr1: num('mp2-pr1', Infinity),
      top: (id('mp2-topics').value||'').trim().toLowerCase(),
      df:  id('mp2-df').value,
      hs:  id('mp2-hide-sens').checked
    };
  }
  function num(eid, def) { var v=parseFloat(id(eid)&&id(eid).value); return isNaN(v)?def:v; }

  function matches(s, f) {
    var m   = s.metadata || {};
    var dr  = +m.DR || 0;
    var tfc = +m['Estimated Traffic'] || 0;
    var pr  = +s.price || 0;
    var df  = m['Do-Follow'] || '';
    var top = (m.Topics || '').toLowerCase();
    var nm  = (s.name || '').toLowerCase();
    if (blocks[s.id])                                                return false;
    if (f.q   && !nm.includes(f.q))                                 return false;
    if (dr  < f.dr0 || dr  > f.dr1)                                 return false;
    if (tfc < f.tr0 || tfc > f.tr1)                                 return false;
    if (pr  < f.pr0 || pr  > f.pr1)                                 return false;
    if (f.top && !top.includes(f.top))                              return false;
    if (f.df  && df !== f.df)                                       return false;
    if (f.hs  && SENS.some(function(k){ return top.includes(k); })) return false;
    return true;
  }

  function doSort(arr) {
    return arr.slice().sort(function(a,b){
      var am=a.metadata||{}, bm=b.metadata||{};
      var av, bv;
      switch(sortF){
        case 'name': av=a.name||'';  bv=b.name||'';  break;
        case 'dr':   av=+am.DR||0;   bv=+bm.DR||0;   break;
        case 'da':   av=+am.DA||0;   bv=+bm.DA||0;   break;
        case 'tfc':  av=+am['Estimated Traffic']||0; bv=+bm['Estimated Traffic']||0; break;
        case 'df':   av=am['Do-Follow']||''; bv=bm['Do-Follow']||''; break;
        default:     av=+a.price||0; bv=+b.price||0;
      }
      if (typeof av==='string') return sortD==='asc'?av.localeCompare(bv):bv.localeCompare(av);
      return sortD==='asc'?av-bv:bv-av;
    });
  }

  function run() {
    filtered = doSort(all.filter(function(s){ return matches(s, gf()); }));
    id('mp2-cnt-match').textContent = filtered.length.toLocaleString();
    render(); pager();
  }

  function drCls(v) { var n=+v||0; return n>=60?'mp2-hi':n>=30?'mp2-mid':n>0?'mp2-lo':'mp2-na'; }
  function fmtT(v)  { var n=+v||0; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return Math.round(n/1e3)+'K'; return n?n.toString():'—'; }

  function spark(name) {
    var s=0; for(var i=0;i<name.length;i++) s=(s*31+name.charCodeAt(i))&0xFFFFFF;
    var pts=[]; for(var j=0;j<10;j++){ s=(s*1664525+1013904223)&0xFFFFFF; pts.push(((s&0xFF)/255)*20+j*0.4); }
    var mn=Math.min.apply(null,pts), mx=Math.max.apply(null,pts), sp=mx-mn||1;
    var norm=pts.map(function(p){ return 20-((p-mn)/sp)*16; });
    return norm.map(function(y,i){ return (i?'L':'M')+(i*6.2).toFixed(1)+','+y.toFixed(1); }).join(' ');
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function applyCols() {
    var map={dr:'c-dr',da:'c-da',traffic:'c-traffic',spark:'c-spark',topics:'c-topics',df:'c-df',price:'c-price'};
    Object.keys(map).forEach(function(k){
      var show=k==='spark'?(cols.spark&&cols.traffic):!!cols[k];
      document.querySelectorAll('#mp2 .'+map[k]).forEach(function(el){ el.style.display=show?'':'none'; });
    });
    document.querySelectorAll('#mp2 .mp2-spark').forEach(function(el){ el.style.display=cols.spark?'':'none'; });
  }

  function render() {
    var start=(page-1)*rpp, end=Math.min(start+rpp,filtered.length), slice=filtered.slice(start,end);
    id('mp2-from').textContent = filtered.length ? start+1 : 0;
    id('mp2-to').textContent   = end;
    id('mp2-tot').textContent  = filtered.length.toLocaleString();
    if (!slice.length) {
      id('mp2-body').innerHTML='<tr><td colspan="10" class="mp2-empty"><div class="mp2-empty-ico">🔍</div><div class="mp2-empty-txt">No sites match your filters.</div></td></tr>';
      return;
    }
    var html='';
    slice.forEach(function(s){
      var m=s.metadata||{}, dr=m.DR||'—', da=m.DA||'—';
      var tfc=m['Estimated Traffic']||'0', df=m['Do-Follow']||'', top=m.Topics||'', pr=+s.price||0;
      var isFav=!!favs[s.id], isBlk=!!blocks[s.id];
      var topHtml=top.split(';').map(function(t){ t=t.trim(); return t?'<span class="mp2-tag">'+esc(t)+'</span>':''; }).join('');
      var dfHtml=df==='Yes'?'<span class="mp2-df-y">✓ Yes</span>':df==='No'?'<span class="mp2-df-n">✗ No</span>':'<span class="mp2-df-u">—</span>';
      var spd=spark(s.name);
      html+='<tr'+(isBlk?' class="mp2-blocked"':'')+' data-id="'+s.id+'">';
      html+='<td><div class="mp2-acts"><button class="mp2-abtn mp2-fav'+(isFav?' on':'')+'" data-id="'+s.id+'" title="Favourite">★</button><button class="mp2-abtn mp2-blk'+(isBlk?' on':'')+'" data-id="'+s.id+'" title="Blacklist">✕</button></div></td>';
      html+='<td><div class="mp2-dom"><img class="mp2-fav-ico" src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(s.name)+'&sz=32" onerror="this.style.display=\'none\'" loading="lazy" alt=""><span class="mp2-dname">'+esc(s.name)+'</span><a class="mp2-dlink" href="https://'+encodeURIComponent(s.name)+'" target="_blank" rel="noopener">↗</a></div></td>';
      html+='<td class="c-dr"><span class="mp2-badge '+drCls(dr)+'">'+esc(String(dr))+'</span></td>';
      html+='<td class="c-da"><span class="mp2-badge '+drCls(da)+'">'+esc(String(da))+'</span></td>';
      html+='<td class="c-traffic"><div class="mp2-tfc"><span class="mp2-tfcnum">'+fmtT(tfc)+'</span>';
      if(cols.spark) html+='<svg class="mp2-spark" viewBox="0 0 58 22" fill="none"><path d="'+spd+'" stroke="#2563eb" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
      html+='</div></td>';
      html+='<td class="c-spark" style="display:none;width:0;padding:0;"></td>';
      html+='<td class="c-topics"><div class="mp2-tags">'+topHtml+'</div></td>';
      html+='<td class="c-df">'+dfHtml+'</td>';
      html+='<td class="c-price"><span class="mp2-price">$'+pr.toLocaleString()+'</span></td>';
      html+='<td><button class="mp2-buy" data-id="'+s.id+'">Buy →</button></td>';
      html+='</tr>';
    });
    id('mp2-body').innerHTML=html;
    applyCols();
  }

  function pager() {
    var pages=Math.ceil(filtered.length/rpp), el=id('mp2-pager');
    if(pages<=1){ el.innerHTML=''; return; }
    var h='';
    h+='<button class="mp2-pg" onclick="MP2.go('+(page-1)+')" '+(page===1?'disabled':'')+'>&#8249;</button>';
    range(page,pages).forEach(function(p){ h+=p==='…'?'<span class="mp2-pgdots">…</span>':'<button class="mp2-pg'+(p===page?' on':'')+'" onclick="MP2.go('+p+')">'+p+'</button>'; });
    h+='<button class="mp2-pg" onclick="MP2.go('+(page+1)+')" '+(page===pages?'disabled':'')+'>&#8250;</button>';
    el.innerHTML=h;
  }

  function range(cur,tot){
    if(tot<=7) return Array.from({length:tot},function(_,i){return i+1;});
    var r=[1]; if(cur>3) r.push('…');
    for(var i=Math.max(2,cur-1);i<=Math.min(tot-1,cur+1);i++) r.push(i);
    if(cur<tot-2) r.push('…'); r.push(tot); return r;
  }

  function addToCart(sid){
    var form=document.createElement('form'); form.method='POST'; form.action=window.MP2_CART||'/cart/items';
    var csrf=document.querySelector('meta[name="csrf-token"]');
    if(csrf) ap(form,'_token',csrf.content);
    ap(form,'service_id',sid); ap(form,'return_url',location.href);
    document.body.appendChild(form); form.submit();
  }
  function ap(form,n,v){ var i=document.createElement('input'); i.type='hidden'; i.name=n; i.value=v; form.appendChild(i); }

  function renderPresets(){
    var names=Object.keys(presets), el=id('mp2-preset-list');
    if(!names.length){ el.innerHTML='<span style="font-size:12px;color:var(--gray-400);">None saved</span>'; return; }
    el.innerHTML=names.map(function(n){ return '<button class="mp2-preset-chip" data-p="'+esc(n)+'">'+esc(n)+'<span class="mp2-del" data-pdel="'+esc(n)+'">✕</span></button>'; }).join('');
  }
  function savePreset(){
    var n=prompt('Name this preset:'); if(!n||!n.trim()) return;
    presets[n.trim()]={ q:id('mp2-q').value, dr0:id('mp2-dr0').value, dr1:id('mp2-dr1').value, tr0:id('mp2-tr0').value, tr1:id('mp2-tr1').value, pr0:id('mp2-pr0').value, pr1:id('mp2-pr1').value, top:id('mp2-topics').value, df:id('mp2-df').value, hs:id('mp2-hide-sens').checked };
    sv('mp2_presets',presets); renderPresets();
  }
  function loadPreset(n){
    var p=presets[n]; if(!p) return;
    id('mp2-q').value=p.q||''; id('mp2-dr0').value=p.dr0||''; id('mp2-dr1').value=p.dr1||'';
    id('mp2-tr0').value=p.tr0||''; id('mp2-tr1').value=p.tr1||''; id('mp2-pr0').value=p.pr0||''; id('mp2-pr1').value=p.pr1||'';
    id('mp2-topics').value=p.top||''; id('mp2-df').value=p.df||''; id('mp2-hide-sens').checked=!!p.hs;
    page=1; run();
  }

  async function loadFolder(fid,pg){
    var url='/api/v1/services?filters[folder_id][$eq]='+fid+'&expand[]=metadata&limit=100&page='+pg;
    try{ var r=await fetch(url,{headers:{Authorization:AUTH}}); return await r.json(); }
    catch(e){ return {data:[],pagination:{last_page:1}}; }
  }
  async function loadAll(){
    loading=true; prog(5);
    var first=await Promise.all(FOLDERS.map(function(f){ return loadFolder(f,1); }));
    var tasks=[];
    first.forEach(function(r,idx){
      (r.data||[]).forEach(function(s){ all.push(s); }); loaded+=(r.data||[]).length;
      var lp=(r.pagination||{}).last_page||1;
      for(var p=2;p<=lp;p++) tasks.push({f:FOLDERS[idx],p:p});
    });
    id('mp2-cnt-loaded').textContent=loaded.toLocaleString(); run(); prog(20);
    var BSZ=10, done=0, total=tasks.length;
    for(var i=0;i<total;i+=BSZ){
      var batch=tasks.slice(i,i+BSZ);
      var res=await Promise.all(batch.map(function(t){ return loadFolder(t.f,t.p); }));
      res.forEach(function(r){ (r.data||[]).forEach(function(s){ all.push(s); }); loaded+=(r.data||[]).length; });
      done+=batch.length; prog(20+Math.round((done/total)*78));
      id('mp2-cnt-loaded').textContent=loaded.toLocaleString();
      if(done%(BSZ*3)===0) run();
    }
    prog(100); loading=false;
    setTimeout(function(){ id('mp2-progress').style.display='none'; },700); run();
  }
  function prog(pct){ id('mp2-prog-fill').style.width=pct+'%'; }

  var debT;
  var lazyRun=(function(fn,ms){ return function(){ clearTimeout(debT); debT=setTimeout(fn,ms); }; })(function(){ page=1; run(); }, 380);

  function bindAll(){
    ['mp2-q','mp2-dr0','mp2-dr1','mp2-tr0','mp2-tr1','mp2-pr0','mp2-pr1','mp2-topics'].forEach(function(eid){ var el=id(eid); if(el) el.addEventListener('input',lazyRun); });
    id('mp2-df').addEventListener('change',function(){ page=1; run(); });
    id('mp2-hide-sens').addEventListener('change',function(){ page=1; run(); });
    id('mp2-clear').addEventListener('click',function(){
      ['mp2-q','mp2-dr0','mp2-dr1','mp2-tr0','mp2-tr1','mp2-pr0','mp2-pr1','mp2-topics'].forEach(function(eid){ var el=id(eid); if(el) el.value=''; });
      id('mp2-df').value=''; id('mp2-hide-sens').checked=false; page=1; run();
    });
    id('mp2-rpp').addEventListener('change',function(){ rpp=+this.value; page=1; run(); });
    document.querySelectorAll('#mp2-head th[data-sort]').forEach(function(th){
      th.addEventListener('click',function(){
        var f=this.dataset.sort;
        sortD=sortF===f?(sortD==='asc'?'desc':'asc'):'asc'; sortF=f;
        document.querySelectorAll('#mp2-head th').forEach(function(t){ t.classList.remove('mp2-sorted'); var si=t.querySelector('.mp2-sico'); if(si) si.textContent='↕'; });
        this.classList.add('mp2-sorted'); var si=this.querySelector('.mp2-sico'); if(si) si.textContent=sortD==='asc'?'↓':'↑';
        page=1; run();
      });
    });
    id('mp2-body').addEventListener('click',function(e){
      var buy=e.target.closest('.mp2-buy'), fav=e.target.closest('.mp2-fav'), blk=e.target.closest('.mp2-blk');
      if(buy){ addToCart(buy.dataset.id); return; }
      if(fav){ var sid=fav.dataset.id; favs[sid]?delete favs[sid]:(favs[sid]=1); sv('mp2_favs',favs); fav.classList.toggle('on'); return; }
      if(blk){
        var sid2=blk.dataset.id;
        if(blocks[sid2]){ delete blocks[sid2]; blk.classList.remove('on'); var r=blk.closest('tr'); if(r) r.classList.remove('mp2-blocked'); }
        else{ blocks[sid2]=1; blk.classList.add('on'); var r2=blk.closest('tr'); if(r2) r2.classList.add('mp2-blocked'); setTimeout(function(){ page=1; run(); },900); }
        sv('mp2_blocks',blocks);
      }
    });
    id('mp2-colbtn').addEventListener('click',function(e){ e.stopPropagation(); id('mp2-colpanel').classList.toggle('open'); });
    document.addEventListener('click',function(){ id('mp2-colpanel').classList.remove('open'); });
    id('mp2-colpanel').addEventListener('click',function(e){ e.stopPropagation(); });
    document.querySelectorAll('#mp2-colpanel input[data-col]').forEach(function(cb){ cb.addEventListener('change',function(){ cols[this.dataset.col]=this.checked?1:0; applyCols(); }); });
    id('mp2-save-preset').addEventListener('click',savePreset);
    id('mp2-preset-list').addEventListener('click',function(e){
      var del=e.target.closest('[data-pdel]'), chip=e.target.closest('[data-p]');
      if(del){ e.stopPropagation(); if(confirm('Delete preset "'+del.dataset.pdel+'"?')){ delete presets[del.dataset.pdel]; sv('mp2_presets',presets); renderPresets(); } }
      else if(chip) loadPreset(chip.dataset.p);
    });
  }

  window.MP2 = {
    go: function(p){ var pages=Math.ceil(filtered.length/rpp); if(p<1||p>pages) return; page=p; render(); pager(); id('mp2').scrollIntoView({behavior:'smooth'}); }
  };

  function init(){ bindAll(); renderPresets(); loadAll(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('turbo:load',function(){ if(!loading&&all.length===0) init(); });

})();
