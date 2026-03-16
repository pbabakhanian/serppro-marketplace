(function () {
  'use strict';

  // No API key needed — requests use the logged-in user's session cookie automatically
  var FOLDERS = [40, 41, 43, 47, 49];
  var SENS    = ['adult','casino','gambling','igaming','cannabis','dating','sweepstakes','xxx','sex','poker','betting'];
  var CART_URL = window.MP2_CART_URL || '/cart?folder=5&table=1';

  var all = [], filtered = [];
  var page = 1, rpp = 25;
  var sortF = 'price', sortD = 'asc';
  var loading = false, loaded = 0;
  var topicTags = [];
  var expandedRow = null;

  var favs   = ls('mp2_favs',   {});
  var blocks = ls('mp2_blocks', {});
  var presets= ls('mp2_presets',{});
  var cols   = { dr:1, da:1, traffic:1, spark:1, country:1, lang:1, topics:1, df:1, price:1 };

  function ls(k,d){ try{ return JSON.parse(localStorage.getItem(k))||d; }catch(e){ return d; } }
  function sv(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function id(x)  { return document.getElementById(x); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function gv(eid){ var el=id(eid); return el?el.value:''; }

  /* ── TLD → Country + Language ── */
  var TLD_MAP={
    de:{lang:'German',   country:'Germany',       flag:'🇩🇪'},
    at:{lang:'German',   country:'Austria',        flag:'🇦🇹'},
    ch:{lang:'German',   country:'Switzerland',    flag:'🇨🇭'},
    fr:{lang:'French',   country:'France',         flag:'🇫🇷'},
    be:{lang:'French',   country:'Belgium',        flag:'🇧🇪'},
    es:{lang:'Spanish',  country:'Spain',          flag:'🇪🇸'},
    mx:{lang:'Spanish',  country:'Mexico',         flag:'🇲🇽'},
    ar:{lang:'Spanish',  country:'Argentina',      flag:'🇦🇷'},
    co:{lang:'Spanish',  country:'Colombia',       flag:'🇨🇴'},
    cl:{lang:'Spanish',  country:'Chile',          flag:'🇨🇱'},
    pe:{lang:'Spanish',  country:'Peru',           flag:'🇵🇪'},
    it:{lang:'Italian',  country:'Italy',          flag:'🇮🇹'},
    nl:{lang:'Dutch',    country:'Netherlands',    flag:'🇳🇱'},
    pl:{lang:'Polish',   country:'Poland',         flag:'🇵🇱'},
    pt:{lang:'Portuguese',country:'Portugal',      flag:'🇵🇹'},
    br:{lang:'Portuguese',country:'Brazil',        flag:'🇧🇷'},
    ru:{lang:'Russian',  country:'Russia',         flag:'🇷🇺'},
    ua:{lang:'Ukrainian',country:'Ukraine',        flag:'🇺🇦'},
    se:{lang:'Swedish',  country:'Sweden',         flag:'🇸🇪'},
    no:{lang:'Norwegian',country:'Norway',         flag:'🇳🇴'},
    dk:{lang:'Danish',   country:'Denmark',        flag:'🇩🇰'},
    fi:{lang:'Finnish',  country:'Finland',        flag:'🇫🇮'},
    gr:{lang:'Greek',    country:'Greece',         flag:'🇬🇷'},
    ro:{lang:'Romanian', country:'Romania',        flag:'🇷🇴'},
    hu:{lang:'Hungarian',country:'Hungary',        flag:'🇭🇺'},
    cz:{lang:'Czech',    country:'Czech Republic', flag:'🇨🇿'},
    sk:{lang:'Slovak',   country:'Slovakia',       flag:'🇸🇰'},
    hr:{lang:'Croatian', country:'Croatia',        flag:'🇭🇷'},
    bg:{lang:'Bulgarian',country:'Bulgaria',       flag:'🇧🇬'},
    tr:{lang:'Turkish',  country:'Turkey',         flag:'🇹🇷'},
    jp:{lang:'Japanese', country:'Japan',          flag:'🇯🇵'},
    cn:{lang:'Chinese',  country:'China',          flag:'🇨🇳'},
    kr:{lang:'Korean',   country:'South Korea',    flag:'🇰🇷'},
    th:{lang:'Thai',     country:'Thailand',       flag:'🇹🇭'},
    ae:{lang:'Arabic',   country:'UAE',            flag:'🇦🇪'},
    sa:{lang:'Arabic',   country:'Saudi Arabia',   flag:'🇸🇦'},
    il:{lang:'Hebrew',   country:'Israel',         flag:'🇮🇱'},
    in:{lang:'English',  country:'India',          flag:'🇮🇳'},
    uk:{lang:'English',  country:'United Kingdom', flag:'🇬🇧'},
    au:{lang:'English',  country:'Australia',      flag:'🇦🇺'},
    nz:{lang:'English',  country:'New Zealand',    flag:'🇳🇿'},
    ca:{lang:'English',  country:'Canada',         flag:'🇨🇦'},
    za:{lang:'English',  country:'South Africa',   flag:'🇿🇦'},
    ng:{lang:'English',  country:'Nigeria',        flag:'🇳🇬'},
    sg:{lang:'English',  country:'Singapore',      flag:'🇸🇬'},
    ph:{lang:'English',  country:'Philippines',    flag:'🇵🇭'},
    id:{lang:'Indonesian',country:'Indonesia',     flag:'🇮🇩'},
    my:{lang:'Malay',    country:'Malaysia',       flag:'🇲🇾'},
    vn:{lang:'Vietnamese',country:'Vietnam',       flag:'🇻🇳'}
  };
  var NAME_MAP=[
    [/\b(usa|american|usnews|usatoday)\b/i,'United States','🇺🇸','English'],
    [/\b(britain|british|england|london)\b/i,'United Kingdom','🇬🇧','English'],
    [/\b(australia|aussie|sydney|melbourne)\b/i,'Australia','🇦🇺','English'],
    [/\b(canada|canadian|toronto|montreal)\b/i,'Canada','🇨🇦','English'],
    [/\b(india|hindi|delhi|mumbai)\b/i,'India','🇮🇳','English'],
    [/\b(brasil|brazileiro)\b/i,'Brazil','🇧🇷','Portuguese'],
    [/\b(deutsch|berlin|muenchen|münchen)\b/i,'Germany','🇩🇪','German'],
    [/\b(france|paris|francais)\b/i,'France','🇫🇷','French'],
    [/\b(espana|madrid)\b/i,'Spain','🇪🇸','Spanish'],
    [/\b(italia|roma)\b/i,'Italy','🇮🇹','Italian'],
    [/\b(nederland|amsterdam)\b/i,'Netherlands','🇳🇱','Dutch'],
    [/\b(polska|warsaw)\b/i,'Poland','🇵🇱','Polish'],
    [/\b(russia|moscow)\b/i,'Russia','🇷🇺','Russian'],
    [/\b(tokyo|osaka)\b/i,'Japan','🇯🇵','Japanese'],
    [/\b(beijing|shanghai)\b/i,'China','🇨🇳','Chinese'],
    [/\b(seoul)\b/i,'South Korea','🇰🇷','Korean']
  ];
  function inferGeo(domain){
    var d=(domain||'').toLowerCase().replace(/^https?:\/\//,'');
    var parts=d.split('.');
    var tld=parts[parts.length-1];
    var sld=parts.length>2?parts[parts.length-2]:'';
    for(var i=0;i<NAME_MAP.length;i++){
      if(NAME_MAP[i][0].test(d)) return {country:NAME_MAP[i][1],flag:NAME_MAP[i][2],lang:NAME_MAP[i][3]};
    }
    if(TLD_MAP[tld]) return TLD_MAP[tld];
    if(sld==='co'&&tld==='uk') return {country:'United Kingdom',flag:'🇬🇧',lang:'English'};
    if(sld==='com'&&tld==='au') return {country:'Australia',flag:'🇦🇺',lang:'English'};
    return {country:'United States',flag:'🇺🇸',lang:'English'};
  }

  /* ── Traffic trend (deterministic from domain name) ── */
  function trendData(s){
    var m=s.metadata||{};
    var curr=+m['Estimated Traffic']||0;
    var prev=+m['Traffic_Prev']||0;
    if(m['Traffic_Prev']&&(curr||prev)){
      var pct=prev?Math.round(((curr-prev)/prev)*100):0;
      return {pct:pct,up:pct>=0,real:true};
    }
    var seed=0; var nm=(s.name||'');
    for(var i=0;i<nm.length;i++) seed=(seed*31+nm.charCodeAt(i))&0xFFFFFF;
    var pct=((seed&0x7F)-40); // -40 to +87 skewed slightly positive
    return {pct:pct,up:pct>=0,real:false};
  }

  /* ── Cart — native SPP URL ── */
  function addToCart(sid, name, price) {
    // POST to SPP cart silently, then redirect to native cart page
    var csrf = document.querySelector('meta[name="csrf-token"]');
    var fd = new FormData();
    fd.append('service_id', sid);
    fd.append('return_url', window.location.href);
    if (csrf) fd.append('_token', csrf.content);

    fetch(window.MP2_CART || '/portal/cart/items', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: fd
    }).then(function() {
      window.location.href = CART_URL;
    }).catch(function() {
      // Fallback: just navigate to cart
      window.location.href = CART_URL;
    });
  }

  /* ── Topic tags ── */
  function renderTopicTags(){
    var wrap=id('mp2-tag-pills'); if(!wrap) return;
    if(!topicTags.length){ wrap.innerHTML=''; return; }
    wrap.innerHTML=topicTags.map(function(t,i){
      return '<span class="mp2-tpill">'+esc(t)+'<button class="mp2-tpill-rm" data-ti="'+i+'">x</button></span>';
    }).join('');
    wrap.querySelectorAll('.mp2-tpill-rm').forEach(function(btn){
      btn.addEventListener('click',function(){ topicTags.splice(+this.dataset.ti,1); renderTopicTags(); page=1; run(); });
    });
  }
  function addTopicTag(val){
    val=val.trim().toLowerCase(); if(!val||topicTags.indexOf(val)!==-1) return false;
    topicTags.push(val); renderTopicTags(); page=1; run(); return true;
  }
  function bindTopicInput(){
    var inp=id('mp2-topics'); if(!inp) return;
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===','){ e.preventDefault(); if(addTopicTag(this.value)) this.value=''; }
      if(e.key==='Backspace'&&!this.value&&topicTags.length){ topicTags.pop(); renderTopicTags(); page=1; run(); }
    });
    inp.addEventListener('blur',function(){ if(this.value.trim()){ addTopicTag(this.value); this.value=''; } });
  }

  /* ── Filters — fully defensive ── */
  function num(eid,def){ var el=id(eid); if(!el) return def; var v=parseFloat(el.value); return isNaN(v)?def:v; }
  function gf(){
    return {
      q:   (gv('mp2-q')||'').trim().toLowerCase(),
      dr0: num('mp2-dr0',0),  dr1: num('mp2-dr1',Infinity),
      tr0: num('mp2-tr0',0),  tr1: num('mp2-tr1',Infinity),
      pr0: num('mp2-pr0',0),  pr1: num('mp2-pr1',Infinity),
      tags: topicTags.slice(),
      df:  gv('mp2-df'),
      lang: gv('mp2-lang'),
      country: gv('mp2-country'),
      hs:  !!(id('mp2-hide-sens')&&id('mp2-hide-sens').checked)
    };
  }

  function matches(s,f){
    var m=s.metadata||{};
    var dr=+m.DR||0, tfc=+m['Estimated Traffic']||0, pr=+s.price||0;
    var df=m['Do-Follow']||'', top=(m.Topics||'').toLowerCase(), nm=(s.name||'').toLowerCase();
    var geo=inferGeo(s.name);
    if(blocks[s.id]) return false;
    if(f.q    && !nm.includes(f.q)) return false;
    if(f.dr0  && dr < f.dr0) return false;
    if(f.dr1 < Infinity && dr > f.dr1) return false;
    if(f.tr0  && tfc < f.tr0) return false;
    if(f.tr1 < Infinity && tfc > f.tr1) return false;
    if(f.pr0  && pr < f.pr0) return false;
    if(f.pr1 < Infinity && pr > f.pr1) return false;
    if(f.tags.length && !f.tags.some(function(t){ return top.includes(t); })) return false;
    if(f.df   && df !== f.df) return false;
    if(f.lang && geo.lang.toLowerCase() !== f.lang.toLowerCase()) return false;
    if(f.country && !geo.country.toLowerCase().includes(f.country.toLowerCase().split(' ')[0])) return false;
    if(f.hs   && SENS.some(function(k){ return top.includes(k); })) return false;
    return true;
  }

  function doSort(arr){
    return arr.slice().sort(function(a,b){
      var am=a.metadata||{},bm=b.metadata||{},av,bv;
      switch(sortF){
        case 'name':    av=a.name||''; bv=b.name||''; break;
        case 'dr':      av=+am.DR||0;  bv=+bm.DR||0; break;
        case 'da':      av=+am.DA||0;  bv=+bm.DA||0; break;
        case 'tfc':     av=+am['Estimated Traffic']||0; bv=+bm['Estimated Traffic']||0; break;
        case 'df':      av=am['Do-Follow']||''; bv=bm['Do-Follow']||''; break;
        case 'country': av=inferGeo(a.name).country; bv=inferGeo(b.name).country; break;
        case 'lang':    av=inferGeo(a.name).lang; bv=inferGeo(b.name).lang; break;
        default:        av=+a.price||0; bv=+b.price||0;
      }
      if(typeof av==='string') return sortD==='asc'?av.localeCompare(bv):bv.localeCompare(av);
      return sortD==='asc'?av-bv:bv-av;
    });
  }

  function run(){
    try {
      filtered=doSort(all.filter(function(s){ return matches(s,gf()); }));
    } catch(e) {
      filtered=all.slice();
    }
    var cntEl=id('mp2-cnt-match');
    if(cntEl) cntEl.textContent=filtered.length.toLocaleString();
    render(); pager();
  }

  /* ── Rendering ── */
  function drCls(v){ var n=+v||0; return n>=60?'mp2-hi':n>=30?'mp2-mid':n>0?'mp2-lo':'mp2-na'; }
  function fmtT(v){ var n=+v||0; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return Math.round(n/1e3)+'K'; return n?n.toString():'—'; }

  function spark(name){
    var s=0; for(var i=0;i<name.length;i++) s=(s*31+name.charCodeAt(i))&0xFFFFFF;
    var pts=[]; for(var j=0;j<10;j++){ s=(s*1664525+1013904223)&0xFFFFFF; pts.push(((s&0xFF)/255)*20+j*0.4); }
    var mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),sp=mx-mn||1;
    var norm=pts.map(function(p){ return 20-((p-mn)/sp)*16; });
    return norm.map(function(y,i){ return (i?'L':'M')+(i*6.2).toFixed(1)+','+y.toFixed(1); }).join(' ');
  }

  function applyCols(){
    var map={dr:'c-dr',da:'c-da',traffic:'c-traffic',spark:'c-spark',country:'c-country',lang:'c-lang',topics:'c-topics',df:'c-df',price:'c-price'};
    Object.keys(map).forEach(function(k){
      var show=k==='spark'?(cols.spark&&cols.traffic):!!cols[k];
      document.querySelectorAll('#mp2 .'+map[k]).forEach(function(el){ el.style.display=show?'':'none'; });
    });
    document.querySelectorAll('#mp2 .mp2-spark').forEach(function(el){ el.style.display=cols.spark?'':'none'; });
  }

  function render(){
    var start=(page-1)*rpp,end=Math.min(start+rpp,filtered.length),slice=filtered.slice(start,end);
    var fromEl=id('mp2-from'),toEl=id('mp2-to'),totEl=id('mp2-tot');
    if(fromEl) fromEl.textContent=filtered.length?start+1:0;
    if(toEl)   toEl.textContent=end;
    if(totEl)  totEl.textContent=filtered.length.toLocaleString();

    var body=id('mp2-body'); if(!body) return;
    if(!slice.length){
      body.innerHTML='<tr><td colspan="12" class="mp2-empty"><div class="mp2-empty-ico">&#128269;</div><div class="mp2-empty-txt">No sites match your filters.</div></td></tr>';
      return;
    }
    var html='';
    slice.forEach(function(s){
      var m=s.metadata||{};
      var dr=m.DR||'—',da=m.DA||'—',tfc=m['Estimated Traffic']||'0';
      var df=m['Do-Follow']||'',top=m.Topics||'',pr=+s.price||0;
      var geo=inferGeo(s.name);
      var td=trendData(s);
      var isFav=!!favs[s.id],isBlk=!!blocks[s.id],isExp=expandedRow===s.id;
      var topHtml=top.split(';').map(function(t){ t=t.trim(); return t?'<span class="mp2-tag">'+esc(t)+'</span>':''; }).join('');
      var dfHtml=df==='Yes'?'<span class="mp2-df-y">&#10003;</span>':df==='No'?'<span class="mp2-df-n">&#10007;</span>':'<span class="mp2-df-u">—</span>';
      var spd=spark(s.name);
      var tColor=td&&td.up?'#2563eb':'#dc2626';
      var trendHtml=td?'<span class="mp2-trend '+(td.up?'mp2-trend-up':'mp2-trend-dn')+'">'+(td.up?'&#9650;':'&#9660;')+' '+Math.abs(td.pct)+'%'+(td.real?'':' est.')+'</span>':'';

      html+='<tr class="mp2-row'+(isBlk?' mp2-blocked':'')+(isExp?' mp2-expanded':'')+'" data-id="'+s.id+'">';
      // fav/block
      html+='<td><div class="mp2-acts"><button class="mp2-abtn mp2-fav'+(isFav?' on':'')+'" data-id="'+s.id+'" title="Favourite">&#9733;</button><button class="mp2-abtn mp2-blk'+(isBlk?' on':'')+'" data-id="'+s.id+'" title="Block">&#10005;</button></div></td>';
      // domain
      html+='<td><div class="mp2-dom">'
           +'<img class="mp2-fav-ico" src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(s.name)+'&sz=32" onerror="this.style.display=\'none\'" loading="lazy" alt="">'
           +'<div class="mp2-dom-info"><span class="mp2-dname">'+esc(s.name)+'</span><a class="mp2-dlink" href="https://'+encodeURIComponent(s.name)+'" target="_blank" rel="noopener">&#8599; visit</a></div>'
           +'<button class="mp2-expand-btn" data-id="'+s.id+'">'+(isExp?'&#9650;':'&#9660;')+'</button>'
           +'</div></td>';
      // DR DA
      html+='<td class="c-dr"><span class="mp2-badge '+drCls(dr)+'">'+esc(String(dr))+'</span></td>';
      html+='<td class="c-da"><span class="mp2-badge '+drCls(da)+'">'+esc(String(da))+'</span></td>';
      // Traffic + trend + spark
      html+='<td class="c-traffic"><div class="mp2-tfc"><div class="mp2-tfc-left"><span class="mp2-tfcnum">'+fmtT(tfc)+'</span>'+trendHtml+'</div>';
      if(cols.spark) html+='<svg class="mp2-spark" viewBox="0 0 58 22" fill="none"><path d="'+spd+'" stroke="'+tColor+'" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
      html+='</div></td>';
      html+='<td class="c-spark" style="display:none;width:0;padding:0;"></td>';
      // Country
      html+='<td class="c-country"><span class="mp2-country"><span class="mp2-flag">'+geo.flag+'</span><span class="mp2-country-name">'+esc(geo.country)+'</span></span></td>';
      // Language
      html+='<td class="c-lang"><span class="mp2-lang-badge">'+esc(geo.lang)+'</span></td>';
      // Topics
      html+='<td class="c-topics"><div class="mp2-tags">'+topHtml+'</div></td>';
      // DF
      html+='<td class="c-df">'+dfHtml+'</td>';
      // Price
      html+='<td class="c-price"><span class="mp2-price">$'+pr.toLocaleString()+'</span></td>';
      // Buy
      html+='<td><button class="mp2-buy" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+pr+'">Buy &#8594;</button></td>';
      html+='</tr>';

      if(isExp){
        html+='<tr class="mp2-detail-row" data-parent="'+s.id+'">'
             +'<td colspan="12"><div class="mp2-detail-panel">'+buildDetailPanel(s)+'</div></td>'
             +'</tr>';
      }
    });
    body.innerHTML=html; applyCols();

    // bind expand buttons
    body.querySelectorAll('.mp2-expand-btn').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var sid=this.dataset.id;
        expandedRow=(expandedRow===sid)?null:sid;
        render();
      });
    });
  }

  function buildDetailPanel(s){
    var m=s.metadata||{};
    var geo=inferGeo(s.name);
    var td=trendData(s);
    var pr=+s.price||0;
    var dr=+m.DR||0;
    var eff=dr>0?'$'+(pr/dr).toFixed(0)+'/DR':'—';

    return '<div class="mp2-dp-grid">'
      +'<div class="mp2-dp-section">'
      +'<div class="mp2-dp-title">Site Overview</div>'
      +'<div class="mp2-dp-stats">'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.DR||'—'))+'</div><div class="mp2-dp-slbl">Ahrefs DR</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.DA||'—'))+'</div><div class="mp2-dp-slbl">Moz DA</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+fmtT(m['Estimated Traffic'])+'</div><div class="mp2-dp-slbl">Traffic</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.RD||'—'))+'</div><div class="mp2-dp-slbl">Ref Domains</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.AS||'—'))+'</div><div class="mp2-dp-slbl">SEMrush AS</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+eff+'</div><div class="mp2-dp-slbl">Price/DR</div></div>'
      +'</div>'
      +'<div class="mp2-dp-meta-row">'
      +'<span class="mp2-dp-meta-item"><b>Country:</b> '+geo.flag+' '+esc(geo.country)+'</span>'
      +'<span class="mp2-dp-meta-item"><b>Language:</b> '+esc(geo.lang)+'</span>'
      +'<span class="mp2-dp-meta-item"><b>Do-Follow:</b> '+(m['Do-Follow']==='Yes'?'<span style="color:#16a34a">Yes</span>':'<span style="color:#dc2626">No</span>')+'</span>'
      +(td?'<span class="mp2-dp-meta-item"><b>Traffic trend:</b> <span style="color:'+(td.up?'#16a34a':'#dc2626')+'">'+(td.up?'&#9650;':'&#9660;')+' '+Math.abs(td.pct)+'%'+(td.real?'':' est.')+'</span></span>':'')
      +'</div>'
      +'</div>'
      +'<div class="mp2-dp-section">'
      +'<div class="mp2-dp-title">Live Data <span class="mp2-live-badge">On-demand</span></div>'
      +'<div id="mp2-live-'+s.id+'" class="mp2-live-wrap">'
      +'<button class="mp2-live-btn" data-domain="'+esc(s.name)+'" data-target="mp2-live-'+s.id+'">&#9889; Fetch Live SEMrush Data</button>'
      +'<div class="mp2-live-hint">Pulls live organic traffic + keywords from SEMrush</div>'
      +'</div>'
      +'</div>'
      +'</div>'
      +'<div class="mp2-dp-actions">'
      +'<button class="mp2-buy mp2-dp-buy" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+pr+'">Add to Cart &#8594;</button>'
      +'<a href="https://'+encodeURIComponent(s.name)+'" target="_blank" rel="noopener" class="mp2-dp-visit">&#8599; Visit Site</a>'
      +'</div>';
  }

  /* ── Live SEMrush ── */
  async function fetchLiveData(domain, targetId) {
    var wrap=id(targetId); if(!wrap) return;
    wrap.innerHTML='<div class="mp2-live-loading"><div class="mp2-spinner"></div> Fetching from SEMrush for '+esc(domain)+'...</div>';
    try{
      var resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:800,
          mcp_servers:[{type:'url',url:'https://mcp.semrush.com/v1/mcp',name:'semrush'}],
          messages:[{role:'user',content:'Use execute_report with report="domain_rank", params={"domain":"'+domain+'","database":"us","export_columns":["Dn","Rk","Or","Ot"]}. Return ONLY a raw JSON object with keys organic_keywords, organic_traffic, semrush_rank. No markdown.'}]
        })
      });
      var data=await resp.json();
      var result=null;
      (data.content||[]).forEach(function(block){
        if(result) return;
        var txt=block.type==='text'?block.text:(block.content&&block.content[0]?block.content[0].text||'':'');
        var lines=txt.split('\n');
        lines.forEach(function(line){
          var p=line.split(';');
          if(p.length>=4&&!isNaN(p[2])&&p[2].length>0){
            result={organic_keywords:+p[2]||0,organic_traffic:+p[3]||0,semrush_rank:+p[1]||0};
          }
        });
        if(!result){ var m2=txt.match(/\{[^}]+\}/); if(m2){ try{result=JSON.parse(m2[0]);}catch(e){} } }
      });
      if(!result) throw new Error('No data');
      wrap.innerHTML='<div class="mp2-live-data">'
        +'<div class="mp2-live-stat"><div class="mp2-live-val">'+fmtT(result.organic_traffic)+'</div><div class="mp2-live-lbl">Organic Traffic</div></div>'
        +'<div class="mp2-live-stat"><div class="mp2-live-val">'+fmtT(result.organic_keywords)+'</div><div class="mp2-live-lbl">Keywords</div></div>'
        +'<div class="mp2-live-stat"><div class="mp2-live-val">#'+Number(result.semrush_rank||0).toLocaleString()+'</div><div class="mp2-live-lbl">SEMrush Rank</div></div>'
        +'<div class="mp2-live-src">&#128994; SEMrush Live</div>'
        +'</div>';
    }catch(e){
      wrap.innerHTML='<div class="mp2-live-err">&#9888; Could not fetch. <button class="mp2-live-btn" data-domain="'+esc(domain)+'" data-target="'+esc(targetId)+'">Retry</button></div>';
    }
  }

  /* ── AI Link Matcher ── */
  async function runMatcher(){
    var urlEl=id('mp2-matcher-url'); if(!urlEl) return;
    var url=urlEl.value.trim();
    if(!url) return;
    if(!url.startsWith('http')) url='https://'+url;
    var out=id('mp2-matcher-out'); if(!out) return;
    out.innerHTML='<div class="mp2-match-loading"><div class="mp2-spinner"></div> Analyzing and matching against '+all.length.toLocaleString()+' publishers...</div>';
    try{
      var resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:800,
          tools:[{type:'web_search_20250305',name:'web_search'}],
          messages:[{role:'user',content:'Analyze this URL: '+url+'\nReturn ONLY a JSON object (no markdown): {"main_topic":"string","topics":["5-10 lowercase keywords"],"industry":"string","language":"English","country":"United States","min_dr":20,"max_dr":70}'}]
        })
      });
      var data=await resp.json();
      var analysis=null;
      (data.content||[]).forEach(function(block){
        if(analysis||block.type!=='text') return;
        var m=block.text.match(/\{[\s\S]*?\}/);
        if(m){ try{analysis=JSON.parse(m[0]);}catch(e){} }
      });
      if(!analysis) analysis={topics:[],main_topic:'general',min_dr:10,max_dr:70,language:'English',country:'United States'};

      var scored=all.map(function(s){
        var m2=s.metadata||{};
        var top=(m2.Topics||'').toLowerCase();
        var dr=+m2.DR||0;
        var geo=inferGeo(s.name);
        var score=0;
        var topics=analysis.topics||[];
        if(topics.length){ var hits=topics.filter(function(t){ return top.includes(t.toLowerCase()); }).length; score+=(hits/topics.length)*40; }
        if(analysis.main_topic&&top.includes(analysis.main_topic.toLowerCase())) score+=10;
        var minDr=analysis.min_dr||0,maxDr=analysis.max_dr||100;
        if(dr>=minDr&&dr<=maxDr) score+=25; else if(dr>=minDr-10) score+=10;
        if(!analysis.language||geo.lang.toLowerCase()===analysis.language.toLowerCase()) score+=20; else if(geo.lang==='English') score+=8;
        if(!analysis.country||geo.country.toLowerCase().includes((analysis.country||'').toLowerCase().split(' ')[0])) score+=15;
        return {s:s,score:Math.round(score)};
      }).filter(function(x){ return x.score>0; }).sort(function(a,b){ return b.score-a.score; }).slice(0,20);

      if(!scored.length){ out.innerHTML='<div class="mp2-match-empty">No strong matches found.</div>'; return; }

      var html='<div class="mp2-match-summary">'
        +'<div class="mp2-match-title">Top '+scored.length+' matches for <a href="'+esc(url)+'" target="_blank">'+esc(url.replace(/^https?:\/\//,'').split('/')[0])+'</a></div>'
        +'<div class="mp2-match-meta">Topics: '+esc((analysis.topics||[]).slice(0,5).join(', '))+' &middot; DR target: '+esc(String(analysis.min_dr||0))+'–'+esc(String(analysis.max_dr||100))+'</div>'
        +'</div><div class="mp2-match-list">';
      scored.forEach(function(x,idx){
        var s=x.s,m3=s.metadata||{},geo2=inferGeo(s.name),pr=+s.price||0;
        var topTags=(m3.Topics||'').split(';').slice(0,3).map(function(t){ t=t.trim(); return t?'<span class="mp2-tag">'+esc(t)+'</span>':''; }).join('');
        html+='<div class="mp2-match-row">'
             +'<div class="mp2-match-rank">#'+(idx+1)+'</div>'
             +'<div class="mp2-match-score-bar"><div class="mp2-match-fill" style="width:'+x.score+'%"></div></div>'
             +'<div class="mp2-match-score-val">'+x.score+'%</div>'
             +'<img class="mp2-fav-ico" src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(s.name)+'&sz=32" onerror="this.style.display=\'none\'" loading="lazy" alt="">'
             +'<div class="mp2-match-info"><div class="mp2-match-domain">'+esc(s.name)+' <span>'+geo2.flag+'</span></div><div class="mp2-match-tags">'+topTags+'</div></div>'
             +'<div class="mp2-match-metrics"><span class="mp2-badge '+drCls(m3.DR||0)+'">DR '+esc(String(m3.DR||'—'))+'</span><span class="mp2-match-tfc">'+fmtT(m3['Estimated Traffic'])+'</span></div>'
             +'<div class="mp2-match-price">$'+pr.toLocaleString()+'</div>'
             +'<button class="mp2-buy mp2-match-buy" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+pr+'">Buy &#8594;</button>'
             +'</div>';
      });
      html+='</div>';
      out.innerHTML=html;
    }catch(e){
      out.innerHTML='<div class="mp2-match-err">&#9888; Analysis failed. Check URL and try again.</div>';
    }
  }

  /* ── Pagination ── */
  function pager(){
    var pages=Math.ceil(filtered.length/rpp),el=id('mp2-pager');
    if(!el) return;
    if(pages<=1){ el.innerHTML=''; return; }
    var h='<button class="mp2-pg" onclick="MP2.go('+(page-1)+')" '+(page===1?'disabled':'')+'>&#8249;</button>';
    range(page,pages).forEach(function(p){ h+=p==='...'?'<span class="mp2-pgdots">&#8230;</span>':'<button class="mp2-pg'+(p===page?' on':'')+'" onclick="MP2.go('+p+')">'+p+'</button>'; });
    h+='<button class="mp2-pg" onclick="MP2.go('+(page+1)+')" '+(page===pages?'disabled':'')+'>&#8250;</button>';
    el.innerHTML=h;
  }
  function range(cur,tot){
    if(tot<=7) return Array.from({length:tot},function(_,i){return i+1;});
    var r=[1]; if(cur>3) r.push('...');
    for(var i=Math.max(2,cur-1);i<=Math.min(tot-1,cur+1);i++) r.push(i);
    if(cur<tot-2) r.push('...'); r.push(tot); return r;
  }

  /* ── Presets ── */
  function renderPresets(){
    var names=Object.keys(presets),el=id('mp2-preset-list'); if(!el) return;
    if(!names.length){ el.innerHTML='<span style="font-size:12px;color:var(--c400)">None saved</span>'; return; }
    el.innerHTML=names.map(function(n){ return '<button class="mp2-preset-chip" data-p="'+esc(n)+'">'+esc(n)+'<span class="mp2-del" data-pdel="'+esc(n)+'">x</span></button>'; }).join('');
  }
  function savePreset(){
    var n=prompt('Name this filter preset:'); if(!n||!n.trim()) return;
    presets[n.trim()]={q:gv('mp2-q'),dr0:gv('mp2-dr0'),dr1:gv('mp2-dr1'),tr0:gv('mp2-tr0'),tr1:gv('mp2-tr1'),pr0:gv('mp2-pr0'),pr1:gv('mp2-pr1'),tags:topicTags.slice(),df:gv('mp2-df'),lang:gv('mp2-lang'),country:gv('mp2-country'),hs:!!(id('mp2-hide-sens')&&id('mp2-hide-sens').checked)};
    sv('mp2_presets',presets); renderPresets();
  }
  function loadPreset(n){
    var p=presets[n]; if(!p) return;
    ['q','dr0','dr1','tr0','tr1','pr0','pr1','df','lang','country'].forEach(function(k){
      var el=id('mp2-'+k); if(el) el.value=p[k]||'';
    });
    var hs=id('mp2-hide-sens'); if(hs) hs.checked=!!p.hs;
    topicTags=p.tags?p.tags.slice():[]; renderTopicTags(); page=1; run();
  }

  /* ── Data loading ── */
  async function loadFolder(fid,pg){
    var url='/api/v1/services?filters[folder_id][$eq]='+fid+'&expand[]=metadata&limit=100&page='+pg;
    try{ var r=await fetch(url,{credentials:'same-origin'}); return await r.json(); }
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
    var cntEl=id('mp2-cnt-loaded'); if(cntEl) cntEl.textContent=loaded.toLocaleString();
    run(); prog(20);

    var BSZ=10,done=0,total=tasks.length;
    for(var i=0;i<total;i+=BSZ){
      var batch=tasks.slice(i,i+BSZ);
      var res=await Promise.all(batch.map(function(t){ return loadFolder(t.f,t.p); }));
      res.forEach(function(r){ (r.data||[]).forEach(function(s){ all.push(s); }); loaded+=(r.data||[]).length; });
      done+=batch.length; prog(20+Math.round((done/total)*78));
      var ce=id('mp2-cnt-loaded'); if(ce) ce.textContent=loaded.toLocaleString();
      if(done%(BSZ*3)===0) run();
    }
    prog(100); loading=false;
    setTimeout(function(){ var pr=id('mp2-progress'); if(pr) pr.style.display='none'; },700);
    run();
  }
  function prog(pct){ var el=id('mp2-prog-fill'); if(el) el.style.width=pct+'%'; }

  /* ── Events ── */
  var debT;
  var lazyRun=(function(fn,ms){ return function(){ clearTimeout(debT); debT=setTimeout(fn,ms); }; })(function(){ page=1; run(); },380);

  function bindAll(){
    ['mp2-q','mp2-dr0','mp2-dr1','mp2-tr0','mp2-tr1','mp2-pr0','mp2-pr1'].forEach(function(eid){
      var el=id(eid); if(el) el.addEventListener('input',lazyRun);
    });
    ['mp2-df','mp2-lang','mp2-country'].forEach(function(eid){
      var el=id(eid); if(el) el.addEventListener('change',function(){ page=1; run(); });
    });
    var hs=id('mp2-hide-sens'); if(hs) hs.addEventListener('change',function(){ page=1; run(); });

    var clr=id('mp2-clear'); if(clr) clr.addEventListener('click',function(){
      ['mp2-q','mp2-dr0','mp2-dr1','mp2-tr0','mp2-tr1','mp2-pr0','mp2-pr1','mp2-df','mp2-lang','mp2-country'].forEach(function(eid){ var el=id(eid); if(el) el.value=''; });
      var hs2=id('mp2-hide-sens'); if(hs2) hs2.checked=false;
      topicTags=[]; renderTopicTags(); page=1; run();
    });

    bindTopicInput();
    var rppEl=id('mp2-rpp'); if(rppEl) rppEl.addEventListener('change',function(){ rpp=+this.value; page=1; run(); });

    // sort headers
    document.querySelectorAll('#mp2-head th[data-sort]').forEach(function(th){
      th.addEventListener('click',function(){
        var f=this.dataset.sort;
        sortD=sortF===f?(sortD==='asc'?'desc':'asc'):'asc'; sortF=f;
        document.querySelectorAll('#mp2-head th').forEach(function(t){ t.classList.remove('mp2-sorted'); var si=t.querySelector('.mp2-sico'); if(si) si.textContent='&#8645;'; });
        this.classList.add('mp2-sorted'); var si2=this.querySelector('.mp2-sico'); if(si2) si2.textContent=sortD==='asc'?'&#8595;':'&#8593;';
        page=1; run();
      });
    });

    // tbody delegation
    var body=id('mp2-body');
    if(body) body.addEventListener('click',function(e){
      var live=e.target.closest('.mp2-live-btn');
      if(live){ fetchLiveData(live.dataset.domain,live.dataset.target); return; }
      var buy=e.target.closest('.mp2-buy');
      if(buy){ addToCart(buy.dataset.id,buy.dataset.name,buy.dataset.price); return; }
      var fav=e.target.closest('.mp2-fav');
      if(fav){ var sid2=fav.dataset.id; favs[sid2]?delete favs[sid2]:(favs[sid2]=1); sv('mp2_favs',favs); fav.classList.toggle('on'); return; }
      var blk=e.target.closest('.mp2-blk');
      if(blk){ var sid3=blk.dataset.id; if(blocks[sid3]){ delete blocks[sid3]; blk.classList.remove('on'); var r=blk.closest('tr'); if(r) r.classList.remove('mp2-blocked'); } else{ blocks[sid3]=1; blk.classList.add('on'); var r2=blk.closest('tr'); if(r2) r2.classList.add('mp2-blocked'); setTimeout(function(){ page=1; run(); },900); } sv('mp2_blocks',blocks); }
    });

    // column panel
    var colbtn=id('mp2-colbtn'); if(colbtn) colbtn.addEventListener('click',function(e){ e.stopPropagation(); var cp=id('mp2-colpanel'); if(cp) cp.classList.toggle('open'); });
    document.addEventListener('click',function(){ var cp=id('mp2-colpanel'); if(cp) cp.classList.remove('open'); });
    var cp2=id('mp2-colpanel'); if(cp2){ cp2.addEventListener('click',function(e){ e.stopPropagation(); }); cp2.querySelectorAll('input[data-col]').forEach(function(cb){ cb.addEventListener('change',function(){ cols[this.dataset.col]=this.checked?1:0; applyCols(); }); }); }

    // presets
    var sp=id('mp2-save-preset'); if(sp) sp.addEventListener('click',savePreset);
    var pl=id('mp2-preset-list'); if(pl) pl.addEventListener('click',function(e){
      var del=e.target.closest('[data-pdel]'),chip=e.target.closest('[data-p]');
      if(del){ e.stopPropagation(); if(confirm('Delete "'+del.dataset.pdel+'"?')){ delete presets[del.dataset.pdel]; sv('mp2_presets',presets); renderPresets(); } }
      else if(chip) loadPreset(chip.dataset.p);
    });

    // matcher
    var mbtn=id('mp2-matcher-btn'); if(mbtn) mbtn.addEventListener('click',runMatcher);
    var minp=id('mp2-matcher-url'); if(minp) minp.addEventListener('keydown',function(e){ if(e.key==='Enter') runMatcher(); });
  }

  window.MP2={
    go:function(p){ var pages=Math.ceil(filtered.length/rpp); if(p<1||p>pages) return; page=p; render(); pager(); var el=id('mp2'); if(el) el.scrollIntoView({behavior:'smooth'}); }
  };

  function init(){ bindAll(); renderPresets(); loadAll(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('turbo:load',function(){ if(!loading&&all.length===0) init(); });
})();
