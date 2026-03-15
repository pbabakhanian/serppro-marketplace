(function () {
  'use strict';

  var API_KEY = window.MP2_KEY || 'spp_api_sz5XoYXgrPZWG14itXtfOCvxh1H4j5pI';
  var AUTH    = 'Basic ' + btoa(API_KEY + ':');
  var FOLDERS = [40, 41, 43, 47, 49];
  var SENS    = ['adult','casino','gambling','igaming','cannabis','dating','sweepstakes','xxx','sex','poker','betting'];

  var all = [], filtered = [];
  var page = 1, rpp = 25;
  var sortF = 'price', sortD = 'asc';
  var loading = false, loaded = 0;
  var topicTags = [];
  var expandedRow = null;

  var favs    = ls('mp2_favs',    {});
  var blocks  = ls('mp2_blocks',  {});
  var presets = ls('mp2_presets', {});
  var cart    = ls('mp2_cart_v2', {});
  var cols    = { dr:1, da:1, traffic:1, spark:1, country:1, lang:1, topics:1, df:1, price:1 };

  function ls(k,d){ try{ return JSON.parse(localStorage.getItem(k))||d; }catch(e){ return d; } }
  function sv(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function id(x)  { return document.getElementById(x); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ══════════════════════════════════════════
     COUNTRY + LANGUAGE INFERENCE
  ══════════════════════════════════════════ */
  var TLD_MAP = {
    // Country
    de:{lang:'German',   country:'Germany',        flag:'🇩🇪'},
    at:{lang:'German',   country:'Austria',         flag:'🇦🇹'},
    ch:{lang:'German',   country:'Switzerland',     flag:'🇨🇭'},
    fr:{lang:'French',   country:'France',          flag:'🇫🇷'},
    be:{lang:'French',   country:'Belgium',         flag:'🇧🇪'},
    es:{lang:'Spanish',  country:'Spain',           flag:'🇪🇸'},
    mx:{lang:'Spanish',  country:'Mexico',          flag:'🇲🇽'},
    ar:{lang:'Spanish',  country:'Argentina',       flag:'🇦🇷'},
    co:{lang:'Spanish',  country:'Colombia',        flag:'🇨🇴'},
    cl:{lang:'Spanish',  country:'Chile',           flag:'🇨🇱'},
    pe:{lang:'Spanish',  country:'Peru',            flag:'🇵🇪'},
    it:{lang:'Italian',  country:'Italy',           flag:'🇮🇹'},
    nl:{lang:'Dutch',    country:'Netherlands',     flag:'🇳🇱'},
    pl:{lang:'Polish',   country:'Poland',          flag:'🇵🇱'},
    pt:{lang:'Portuguese',country:'Portugal',       flag:'🇵🇹'},
    br:{lang:'Portuguese',country:'Brazil',         flag:'🇧🇷'},
    ru:{lang:'Russian',  country:'Russia',          flag:'🇷🇺'},
    ua:{lang:'Ukrainian',country:'Ukraine',         flag:'🇺🇦'},
    se:{lang:'Swedish',  country:'Sweden',          flag:'🇸🇪'},
    no:{lang:'Norwegian',country:'Norway',          flag:'🇳🇴'},
    dk:{lang:'Danish',   country:'Denmark',         flag:'🇩🇰'},
    fi:{lang:'Finnish',  country:'Finland',         flag:'🇫🇮'},
    gr:{lang:'Greek',    country:'Greece',          flag:'🇬🇷'},
    ro:{lang:'Romanian', country:'Romania',         flag:'🇷🇴'},
    hu:{lang:'Hungarian',country:'Hungary',         flag:'🇭🇺'},
    cz:{lang:'Czech',    country:'Czech Republic',  flag:'🇨🇿'},
    sk:{lang:'Slovak',   country:'Slovakia',        flag:'🇸🇰'},
    hr:{lang:'Croatian', country:'Croatia',         flag:'🇭🇷'},
    bg:{lang:'Bulgarian',country:'Bulgaria',        flag:'🇧🇬'},
    tr:{lang:'Turkish',  country:'Turkey',          flag:'🇹🇷'},
    jp:{lang:'Japanese', country:'Japan',           flag:'🇯🇵'},
    cn:{lang:'Chinese',  country:'China',           flag:'🇨🇳'},
    kr:{lang:'Korean',   country:'South Korea',     flag:'🇰🇷'},
    th:{lang:'Thai',     country:'Thailand',        flag:'🇹🇭'},
    ae:{lang:'Arabic',   country:'UAE',             flag:'🇦🇪'},
    sa:{lang:'Arabic',   country:'Saudi Arabia',    flag:'🇸🇦'},
    il:{lang:'Hebrew',   country:'Israel',          flag:'🇮🇱'},
    in:{lang:'English',  country:'India',           flag:'🇮🇳'},
    uk:{lang:'English',  country:'United Kingdom',  flag:'🇬🇧'},
    au:{lang:'English',  country:'Australia',       flag:'🇦🇺'},
    nz:{lang:'English',  country:'New Zealand',     flag:'🇳🇿'},
    ca:{lang:'English',  country:'Canada',          flag:'🇨🇦'},
    za:{lang:'English',  country:'South Africa',    flag:'🇿🇦'},
    ng:{lang:'English',  country:'Nigeria',         flag:'🇳🇬'},
    gh:{lang:'English',  country:'Ghana',           flag:'🇬🇭'},
    sg:{lang:'English',  country:'Singapore',       flag:'🇸🇬'},
    ph:{lang:'English',  country:'Philippines',     flag:'🇵🇭'},
    pk:{lang:'Urdu',     country:'Pakistan',        flag:'🇵🇰'},
    id:{lang:'Indonesian',country:'Indonesia',      flag:'🇮🇩'},
    my:{lang:'Malay',    country:'Malaysia',        flag:'🇲🇾'},
    vn:{lang:'Vietnamese',country:'Vietnam',        flag:'🇻🇳'},
    mx:{lang:'Spanish',  country:'Mexico',          flag:'🇲🇽'}
  };

  // Domain name pattern hints for country
  var NAME_COUNTRY = [
    [/\b(usa|american|unitedstates|usnews)\b/i,'United States','🇺🇸','English'],
    [/\b(uk|britain|british|england|london)\b/i,'United Kingdom','🇬🇧','English'],
    [/\b(australia|aussie|sydney|melbourne)\b/i,'Australia','🇦🇺','English'],
    [/\b(canada|canadian|toronto|montreal)\b/i,'Canada','🇨🇦','English'],
    [/\b(india|indian|hindi|delhi|mumbai)\b/i,'India','🇮🇳','English'],
    [/\b(brasil|brazil|brazileiro)\b/i,'Brazil','🇧🇷','Portuguese'],
    [/\b(deutsch|german|germany|berlin)\b/i,'Germany','🇩🇪','German'],
    [/\b(france|french|paris|francais)\b/i,'France','🇫🇷','French'],
    [/\b(espana|spain|spanish|madrid)\b/i,'Spain','🇪🇸','Spanish'],
    [/\b(italia|italian|italy|roma|rome)\b/i,'Italy','🇮🇹','Italian'],
    [/\b(nederland|dutch|netherlands|amsterdam)\b/i,'Netherlands','🇳🇱','Dutch'],
    [/\b(polska|poland|polish|warsaw)\b/i,'Poland','🇵🇱','Polish'],
    [/\b(russia|russian|moscow|русский)\b/i,'Russia','🇷🇺','Russian'],
    [/\b(japan|japanese|tokyo|osaka)\b/i,'Japan','🇯🇵','Japanese'],
    [/\b(china|chinese|beijing|shanghai)\b/i,'China','🇨🇳','Chinese'],
    [/\b(korea|korean|seoul)\b/i,'South Korea','🇰🇷','Korean']
  ];

  function inferGeo(domain) {
    var d = (domain||'').toLowerCase().replace(/^https?:\/\//,'');
    var parts = d.split('.');
    var tld = parts[parts.length-1];
    var sld = parts[parts.length-2]||'';

    // Check name patterns first
    for (var i=0;i<NAME_COUNTRY.length;i++) {
      if (NAME_COUNTRY[i][0].test(d)) {
        return {country:NAME_COUNTRY[i][1], flag:NAME_COUNTRY[i][2], lang:NAME_COUNTRY[i][3]};
      }
    }
    // TLD lookup
    if (TLD_MAP[tld]) return TLD_MAP[tld];
    // co.uk, com.au etc
    if (tld==='uk') return {country:'United Kingdom',flag:'🇬🇧',lang:'English'};
    if (sld==='au') return {country:'Australia',flag:'🇦🇺',lang:'English'};
    // Default
    return {country:'United States',flag:'🇺🇸',lang:'English'};
  }

  /* ══════════════════════════════════════════
     TRAFFIC TREND
     Uses metadata.Traffic_Prev if present, else seeded estimate
  ══════════════════════════════════════════ */
  function trendData(service) {
    var m = service.metadata||{};
    var curr = +m['Estimated Traffic']||0;
    var prev = +m['Traffic_Prev']||0;
    var isReal = !!m['Traffic_Prev'];

    if (!isReal) {
      // Deterministic seed from domain — consistent direction per site
      var s=0; var nm=(service.name||'');
      for(var i=0;i<nm.length;i++) s=(s*31+nm.charCodeAt(i))&0xFFFFFF;
      var pct = ((s & 0x3F) - 20); // -20 to +43 range
      return {pct:pct, up:pct>=0, real:false};
    }
    if (!curr && !prev) return null;
    var pct = prev ? Math.round(((curr-prev)/prev)*100) : 0;
    return {pct:pct, up:pct>=0, real:true};
  }

  /* ══════════════════════════════════════════
     CART
  ══════════════════════════════════════════ */
  function cartCount(){ return Object.keys(cart).length; }
  function cartTotal(){ return Object.values(cart).reduce(function(s,i){ return s+(+i.price||0); },0); }

  function updateCartUI(){
    var cnt=cartCount();
    ['mp2-cart-badge','mp2-hdr-cart-badge'].forEach(function(bid){
      var b=id(bid); if(b){ b.textContent=cnt; b.style.display=cnt>0?'flex':'none'; }
    });
    var panel=id('mp2-cart-panel'); if(!panel) return;
    var items=Object.entries(cart);
    if(!items.length){ panel.innerHTML='<div class="mp2-cart-empty">Cart is empty.<br>Browse and click Buy to add sites.</div>'; return; }
    var html='<div class="mp2-cart-items">';
    items.forEach(function(e){
      var sid=e[0],item=e[1];
      html+='<div class="mp2-cart-row"><div class="mp2-cart-name">'+esc(item.name)+'</div>'
           +'<div class="mp2-cart-right"><span class="mp2-cart-price">$'+Number(item.price).toLocaleString()+'</span>'
           +'<button class="mp2-cart-rm" data-rm="'+esc(sid)+'">✕</button></div></div>';
    });
    html+='</div><div class="mp2-cart-footer">'
         +'<div class="mp2-cart-total"><span>Total</span><span>$'+cartTotal().toLocaleString()+'</span></div>'
         +'<a href="/cart" class="mp2-cart-checkout">Checkout →</a>'
         +'<a href="/cart" class="mp2-cart-viewlink">View full cart</a></div>';
    panel.innerHTML=html;
    panel.querySelectorAll('[data-rm]').forEach(function(btn){ btn.addEventListener('click',function(){ removeFromCart(this.dataset.rm); }); });
  }

  function removeFromCart(sid){
    delete cart[sid]; sv('mp2_cart_v2',cart); updateCartUI();
    var btn=document.querySelector('.mp2-buy[data-id="'+sid+'"]');
    if(btn){ btn.textContent='Buy →'; btn.classList.remove('mp2-buy-added'); }
  }

  async function addToCart(sid,name,price){
    cart[sid]={name:name,price:price}; sv('mp2_cart_v2',cart); updateCartUI();
    try{
      var csrf=document.querySelector('meta[name="csrf-token"]');
      var fd=new FormData();
      fd.append('service_id',sid); fd.append('return_url',location.href);
      if(csrf) fd.append('_token',csrf.content);
      await fetch(window.MP2_CART||'/portal/cart/items',{method:'POST',headers:{'X-Requested-With':'XMLHttpRequest'},body:fd});
      var frame=document.querySelector('turbo-frame#cart-count-frame');
      if(frame&&frame.src) frame.src=frame.src;
    }catch(e){}
  }

  /* ══════════════════════════════════════════
     TOPIC TAGS
  ══════════════════════════════════════════ */
  function renderTopicTags(){
    var wrap=id('mp2-tag-pills'); if(!wrap) return;
    if(!topicTags.length){ wrap.innerHTML=''; return; }
    wrap.innerHTML=topicTags.map(function(t,i){
      return '<span class="mp2-tpill">'+esc(t)+'<button class="mp2-tpill-rm" data-ti="'+i+'">×</button></span>';
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

  /* ══════════════════════════════════════════
     FILTERS
  ══════════════════════════════════════════ */
  function gf(){
    return{
      q:(id('mp2-q').value||'').trim().toLowerCase(),
      dr0:num('mp2-dr0',0), dr1:num('mp2-dr1',100),
      tr0:num('mp2-tr0',0), tr1:num('mp2-tr1',Infinity),
      pr0:num('mp2-pr0',0), pr1:num('mp2-pr1',Infinity),
      tags:topicTags.slice(),
      df:id('mp2-df').value, lang:(id('mp2-lang')||{}).value||'',
      country:(id('mp2-country')||{}).value||'',
      hs:id('mp2-hide-sens').checked
    };
  }
  function num(eid,def){ var v=parseFloat(id(eid)&&id(eid).value); return isNaN(v)?def:v; }

  function matches(s,f){
    var m=s.metadata||{};
    var dr=+m.DR||0, tfc=+m['Estimated Traffic']||0, pr=+s.price||0;
    var df=m['Do-Follow']||'', top=(m.Topics||'').toLowerCase(), nm=(s.name||'').toLowerCase();
    var geo=inferGeo(s.name);
    if(blocks[s.id])                                                           return false;
    if(f.q    &&!nm.includes(f.q))                                             return false;
    if(dr<f.dr0||dr>f.dr1)                                                     return false;
    if(tfc<f.tr0||tfc>f.tr1)                                                   return false;
    if(pr<f.pr0||pr>f.pr1)                                                     return false;
    if(f.tags.length&&!f.tags.some(function(t){ return top.includes(t); }))    return false;
    if(f.df   &&df!==f.df)                                                      return false;
    if(f.lang &&geo.lang.toLowerCase()!==f.lang.toLowerCase())                  return false;
    if(f.country&&!geo.country.toLowerCase().includes(f.country.toLowerCase())) return false;
    if(f.hs   &&SENS.some(function(k){ return top.includes(k); }))             return false;
    return true;
  }

  function doSort(arr){
    return arr.slice().sort(function(a,b){
      var am=a.metadata||{},bm=b.metadata||{},av,bv;
      switch(sortF){
        case 'name':    av=a.name||'';  bv=b.name||'';  break;
        case 'dr':      av=+am.DR||0;   bv=+bm.DR||0;   break;
        case 'da':      av=+am.DA||0;   bv=+bm.DA||0;   break;
        case 'tfc':     av=+am['Estimated Traffic']||0; bv=+bm['Estimated Traffic']||0; break;
        case 'df':      av=am['Do-Follow']||''; bv=bm['Do-Follow']||''; break;
        case 'country': av=inferGeo(a.name).country; bv=inferGeo(b.name).country; break;
        case 'lang':    av=inferGeo(a.name).lang;    bv=inferGeo(b.name).lang;    break;
        default:        av=+a.price||0; bv=+b.price||0;
      }
      if(typeof av==='string') return sortD==='asc'?av.localeCompare(bv):bv.localeCompare(av);
      return sortD==='asc'?av-bv:bv-av;
    });
  }

  function run(){
    filtered=doSort(all.filter(function(s){ return matches(s,gf()); }));
    id('mp2-cnt-match').textContent=filtered.length.toLocaleString();
    render(); pager();
  }

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  function drCls(v){ var n=+v||0; return n>=60?'mp2-hi':n>=30?'mp2-mid':n>0?'mp2-lo':'mp2-na'; }
  function fmtT(v){ var n=+v||0; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return Math.round(n/1e3)+'K'; return n?n.toString():'—'; }

  function spark(name){
    var s=0; for(var i=0;i<name.length;i++) s=(s*31+name.charCodeAt(i))&0xFFFFFF;
    var pts=[]; for(var j=0;j<10;j++){ s=(s*1664525+1013904223)&0xFFFFFF; pts.push(((s&0xFF)/255)*20+j*0.4); }
    var mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),sp=mx-mn||1;
    var norm=pts.map(function(p){ return 20-((p-mn)/sp)*16; });
    return norm.map(function(y,i){ return (i?'L':'M')+(i*6.2).toFixed(1)+','+y.toFixed(1); }).join(' ');
  }

  function trendHtml(service){
    var t=trendData(service);
    if(!t) return '<span class="mp2-trend-na">—</span>';
    var cls=t.up?'mp2-trend-up':'mp2-trend-dn';
    var ico=t.up?'▲':'▼';
    var pct=Math.abs(t.pct)+'%';
    var tip=t.real?'Real data':'Estimated trend';
    return '<span class="mp2-trend '+cls+'" title="'+tip+'">'+ico+' '+pct+(t.real?'':' est.')+'</span>';
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
    id('mp2-from').textContent=filtered.length?start+1:0;
    id('mp2-to').textContent=end; id('mp2-tot').textContent=filtered.length.toLocaleString();
    if(!slice.length){ id('mp2-body').innerHTML='<tr><td colspan="13" class="mp2-empty"><div class="mp2-empty-ico">🔍</div><div class="mp2-empty-txt">No sites match your filters.</div></td></tr>'; return; }
    var html='';
    slice.forEach(function(s){
      var m=s.metadata||{},dr=m.DR||'—',da=m.DA||'—';
      var tfc=m['Estimated Traffic']||'0',df=m['Do-Follow']||'',top=m.Topics||'',pr=+s.price||0;
      var geo=inferGeo(s.name);
      var isFav=!!favs[s.id],isBlk=!!blocks[s.id],inCart=!!cart[s.id];
      var isExp=expandedRow===s.id;
      var topHtml=top.split(';').map(function(t){ t=t.trim(); return t?'<span class="mp2-tag">'+esc(t)+'</span>':''; }).join('');
      var dfHtml=df==='Yes'?'<span class="mp2-df-y">✓</span>':df==='No'?'<span class="mp2-df-n">✗</span>':'<span class="mp2-df-u">—</span>';
      var spd=spark(s.name);
      var trHtml=trendHtml(s);

      html+='<tr class="mp2-row'+(isBlk?' mp2-blocked':'')+(isExp?' mp2-expanded':'')+'" data-id="'+s.id+'" data-name="'+esc(s.name)+'">';
      // actions
      html+='<td class="mp2-acts-col"><div class="mp2-acts">'
           +'<button class="mp2-abtn mp2-fav'+(isFav?' on':'')+'" data-id="'+s.id+'" title="Favourite">★</button>'
           +'<button class="mp2-abtn mp2-blk'+(isBlk?' on':'')+'" data-id="'+s.id+'" title="Blacklist">✕</button>'
           +'</div></td>';
      // domain
      html+='<td class="mp2-dom-col">'
           +'<div class="mp2-dom">'
           +'<img class="mp2-fav-ico" src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(s.name)+'&sz=32" onerror="this.style.display=\'none\'" loading="lazy" alt="">'
           +'<div class="mp2-dom-info">'
           +'<span class="mp2-dname">'+esc(s.name)+'</span>'
           +'<a class="mp2-dlink" href="https://'+encodeURIComponent(s.name)+'" target="_blank" rel="noopener">↗ Visit</a>'
           +'</div>'
           +'<button class="mp2-expand-btn" data-id="'+s.id+'" title="View details">'+(isExp?'▲':'▼')+'</button>'
           +'</div></td>';
      // DR DA
      html+='<td class="c-dr"><span class="mp2-badge '+drCls(dr)+'">'+esc(String(dr))+'</span></td>';
      html+='<td class="c-da"><span class="mp2-badge '+drCls(da)+'">'+esc(String(da))+'</span></td>';
      // Traffic + trend + spark
      html+='<td class="c-traffic"><div class="mp2-tfc">'
           +'<div class="mp2-tfc-left"><span class="mp2-tfcnum">'+fmtT(tfc)+'</span>'+trHtml+'</div>';
      if(cols.spark) html+='<svg class="mp2-spark" viewBox="0 0 58 22" fill="none"><defs><linearGradient id="sg_'+s.id+'" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="'+(!trendData(s)||trendData(s).up?'#2563eb':'#ef4444')+'20"/><stop offset="100%" stop-color="'+(!trendData(s)||trendData(s).up?'#2563eb':'#ef4444')+'"/></linearGradient></defs><path d="'+spd+'" stroke="url(#sg_'+s.id+')" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" fill="none"/></svg>';
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
      html+='<td><button class="mp2-buy'+(inCart?' mp2-buy-added':'')+'" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+pr+'">'+(inCart?'✓ Added':'Buy →')+'</button></td>';
      html+='</tr>';

      // Expanded row detail panel
      if (isExp) {
        html+='<tr class="mp2-detail-row" data-parent="'+s.id+'">'
             +'<td colspan="13"><div class="mp2-detail-panel" id="mp2-detail-'+s.id+'">'+buildDetailPanel(s)+'</div></td>'
             +'</tr>';
      }
    });
    id('mp2-body').innerHTML=html; applyCols();

    // Bind expand buttons
    document.querySelectorAll('.mp2-expand-btn').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var sid=this.dataset.id;
        expandedRow=(expandedRow===sid)?null:sid;
        render();
        if(expandedRow) {
          var panel=id('mp2-detail-'+expandedRow);
          if(panel) panel.scrollIntoView({behavior:'smooth',block:'nearest'});
        }
      });
    });
  }

  function buildDetailPanel(s){
    var m=s.metadata||{};
    var geo=inferGeo(s.name);
    var t=trendData(s);
    var pr=+s.price||0;
    var dr=+m.DR||0;
    var efScore = dr>0 ? (pr/dr).toFixed(0) : '—';

    var html='<div class="mp2-dp-grid">'
      +'<div class="mp2-dp-section">'
      +'<div class="mp2-dp-title">Site Overview</div>'
      +'<div class="mp2-dp-stats">'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.DR||'—'))+'</div><div class="mp2-dp-slbl">Ahrefs DR</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.DA||'—'))+'</div><div class="mp2-dp-slbl">Moz DA</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+fmtT(m['Estimated Traffic'])+'</div><div class="mp2-dp-slbl">Est. Traffic</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.RD||'—'))+'</div><div class="mp2-dp-slbl">Ref. Domains</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.AS||'—'))+'</div><div class="mp2-dp-slbl">SEMrush AS</div></div>'
      +'<div class="mp2-dp-stat"><div class="mp2-dp-sval">'+esc(String(m.Keywords||'—'))+'</div><div class="mp2-dp-slbl">Keywords</div></div>'
      +'</div>'
      +'<div class="mp2-dp-meta-row">'
      +'<span class="mp2-dp-meta-item"><b>Country:</b> '+geo.flag+' '+esc(geo.country)+'</span>'
      +'<span class="mp2-dp-meta-item"><b>Language:</b> '+esc(geo.lang)+'</span>'
      +'<span class="mp2-dp-meta-item"><b>Do-Follow:</b> '+(m['Do-Follow']==='Yes'?'<span style="color:#16a34a">✓ Yes</span>':'<span style="color:#dc2626">✗ No</span>')+'</span>'
      +'<span class="mp2-dp-meta-item"><b>Price/DR:</b> $'+efScore+'</span>'
      +(t?'<span class="mp2-dp-meta-item"><b>Traffic Trend:</b> <span class="mp2-trend '+(t.up?'mp2-trend-up':'mp2-trend-dn')+'">'+(t.up?'▲':'▼')+' '+Math.abs(t.pct)+'%'+(t.real?'':' est.')+'</span></span>':'')
      +'</div>'
      +'</div>'
      +'<div class="mp2-dp-section">'
      +'<div class="mp2-dp-title">Live SEMrush Data <span class="mp2-live-badge">On Demand</span></div>'
      +'<div id="mp2-live-'+s.id+'" class="mp2-live-wrap">'
      +'<button class="mp2-live-btn" data-domain="'+esc(s.name)+'" data-target="mp2-live-'+s.id+'">⚡ Fetch Live Data</button>'
      +'<div class="mp2-live-hint">Pulls live organic traffic + keywords from SEMrush</div>'
      +'</div>'
      +'</div>'
      +'</div>'
      +'<div class="mp2-dp-actions">'
      +'<button class="mp2-buy mp2-dp-buy'+(cart[s.id]?' mp2-buy-added':'')+'" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+(+s.price||0)+'">'+(cart[s.id]?'✓ In Cart':'Add to Cart →')+'</button>'
      +'<a href="https://'+encodeURIComponent(s.name)+'" target="_blank" rel="noopener" class="mp2-dp-visit">↗ Visit Site</a>'
      +'</div>';
    return html;
  }

  /* ══════════════════════════════════════════
     LIVE SEMRUSH DATA (on-demand via Claude API)
  ══════════════════════════════════════════ */
  async function fetchLiveData(domain, targetId) {
    var wrap = id(targetId); if(!wrap) return;
    wrap.innerHTML = '<div class="mp2-live-loading"><div class="mp2-spinner"></div> Fetching live SEMrush data for '+esc(domain)+'…</div>';

    try {
      var resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          mcp_servers: [{ type: 'url', url: 'https://mcp.semrush.com/v1/mcp', name: 'semrush' }],
          messages: [{
            role: 'user',
            content: 'Use execute_report with report="domain_rank", params={"domain":"'+domain+'","database":"us","export_columns":["Dn","Rk","Or","Ot","Oc"]}. Return ONLY a JSON object with: organic_keywords (number), organic_traffic (number), semrush_rank (number). No other text.'
          }]
        })
      });

      var data = await resp.json();

      // Extract from MCP tool results or text
      var result = null;
      var content = data.content || [];

      // Try to find text with JSON
      for (var i=0; i<content.length; i++) {
        var block = content[i];
        var text = '';
        if (block.type === 'text') text = block.text;
        if (block.type === 'mcp_tool_result' && block.content && block.content[0]) text = block.content[0].text||'';
        if (!text) continue;
        // Parse semicolon-delimited SEMrush format
        var lines = text.split('\n');
        for (var j=0; j<lines.length; j++) {
          var parts = lines[j].split(';');
          if (parts.length >= 5 && !isNaN(parts[2])) {
            result = { organic_keywords: +parts[2]||0, organic_traffic: +parts[3]||0, semrush_rank: +parts[1]||0 };
            break;
          }
        }
        // Also try JSON parse
        if (!result) {
          var match = text.match(/\{[^}]+\}/);
          if (match) { try { result = JSON.parse(match[0]); } catch(e){} }
        }
        if (result) break;
      }

      if (!result) throw new Error('Could not parse SEMrush response');

      wrap.innerHTML = '<div class="mp2-live-data">'
        +'<div class="mp2-live-stat"><div class="mp2-live-val">'+fmtT(result.organic_traffic)+'</div><div class="mp2-live-lbl">Organic Traffic</div></div>'
        +'<div class="mp2-live-stat"><div class="mp2-live-val">'+fmtT(result.organic_keywords)+'</div><div class="mp2-live-lbl">Keywords</div></div>'
        +'<div class="mp2-live-stat"><div class="mp2-live-val">#'+Number(result.semrush_rank||0).toLocaleString()+'</div><div class="mp2-live-lbl">SEMrush Rank</div></div>'
        +'<div class="mp2-live-src">Source: SEMrush · Live</div>'
        +'</div>';
    } catch(e) {
      wrap.innerHTML = '<div class="mp2-live-err">⚠ Could not fetch live data. SEMrush credits may be low. <button class="mp2-live-btn" data-domain="'+esc(domain)+'" data-target="'+esc(targetId)+'">Retry</button></div>';
      // bind retry
      var retryBtn = wrap.querySelector('.mp2-live-btn');
      if (retryBtn) retryBtn.addEventListener('click', function(){ fetchLiveData(this.dataset.domain, this.dataset.target); });
    }
  }

  /* ══════════════════════════════════════════
     AI LINK MATCHER
  ══════════════════════════════════════════ */
  var matcherResults = [];

  function bindMatcher() {
    var btn = id('mp2-matcher-btn');
    var inp = id('mp2-matcher-url');
    if (!btn || !inp) return;
    btn.addEventListener('click', function(){ runMatcher(); });
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter') runMatcher(); });
  }

  async function runMatcher() {
    var url = (id('mp2-matcher-url').value||'').trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    var out = id('mp2-matcher-out');
    if (!out) return;
    out.innerHTML = '<div class="mp2-match-loading"><div class="mp2-spinner"></div> Analyzing your site and matching against '+all.length.toLocaleString()+' publishers…</div>';

    try {
      // Step 1: Analyze the URL with Claude API
      var resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: 'Analyze this website URL: '+url+'\n\nReturn ONLY a valid JSON object (no markdown, no extra text) with these exact fields:\n{"main_topic":"string","topics":["array","of","lowercase","keywords"],"industry":"string","language":"string like English","country":"string like United States","target_audience":"string","min_dr":number,"max_dr":number}\n\nBe specific with topics — use 5-10 relevant keywords. Set min_dr 10 below the site\'s estimated DR, max_dr 40 above it.'
          }]
        })
      });

      var data = await resp.json();
      var analysis = null;
      var content = data.content || [];
      for (var i=0; i<content.length; i++) {
        if (content[i].type === 'text') {
          var t = content[i].text;
          var m = t.match(/\{[\s\S]*\}/);
          if (m) { try { analysis = JSON.parse(m[0]); break; } catch(e){} }
        }
      }

      if (!analysis) analysis = { topics: [], main_topic: 'general', min_dr: 10, max_dr: 60, language: 'English', country: 'United States' };

      // Step 2: Score all loaded sites
      var scored = all.map(function(s){
        var sc = scoreForMatcher(s, analysis);
        return { s:s, score:sc };
      }).filter(function(x){ return x.score>0; })
        .sort(function(a,b){ return b.score-a.score; })
        .slice(0,20);

      matcherResults = scored;
      renderMatcherResults(url, analysis, scored);

    } catch(e) {
      out.innerHTML = '<div class="mp2-match-err">⚠ Analysis failed. Check your URL and try again.<br><small>'+esc(String(e))+'</small></div>';
    }
  }

  function scoreForMatcher(s, analysis) {
    var m = s.metadata||{};
    var top = (m.Topics||'').toLowerCase();
    var dr  = +m.DR||0;
    var geo = inferGeo(s.name);
    var score = 0;

    // Topic match (40%) — OR logic across all analysis topics
    var topics = analysis.topics||[];
    if (topics.length) {
      var hits = topics.filter(function(t){ return top.includes(t.toLowerCase()); }).length;
      score += (hits/topics.length)*40;
    }
    // Also check main topic directly (bonus)
    if (analysis.main_topic && top.includes(analysis.main_topic.toLowerCase())) score += 10;

    // DR range fit (25%)
    var minDr = analysis.min_dr||0, maxDr = analysis.max_dr||100;
    if (dr>=minDr && dr<=maxDr) score += 25;
    else if (dr>=minDr-10) score += 12;

    // Language match (20%)
    if (!analysis.language || geo.lang.toLowerCase()===analysis.language.toLowerCase()) score += 20;
    else if (geo.lang==='English') score += 10; // English sites always partially relevant

    // Country match (15%)
    if (!analysis.country || geo.country.toLowerCase().includes(analysis.country.toLowerCase().split(' ')[0])) score += 15;

    return Math.round(score);
  }

  function renderMatcherResults(url, analysis, scored) {
    var out = id('mp2-matcher-out'); if(!out) return;
    if (!scored.length) {
      out.innerHTML = '<div class="mp2-match-empty">No strong matches found. Try broadening your filters.</div>';
      return;
    }
    var html = '<div class="mp2-match-summary">'
      +'<div class="mp2-match-title">Top '+scored.length+' matches for <a href="'+esc(url)+'" target="_blank">'+esc(url)+'</a></div>'
      +'<div class="mp2-match-meta">Industry: <b>'+esc(analysis.industry||analysis.main_topic||'—')+'</b> · Topics: <b>'+esc((analysis.topics||[]).slice(0,5).join(', '))+'</b> · DR range: <b>'+esc(String(analysis.min_dr||0))+'–'+esc(String(analysis.max_dr||100))+'</b></div>'
      +'</div>'
      +'<div class="mp2-match-list">';
    scored.forEach(function(x, idx){
      var s=x.s, m=s.metadata||{}, geo=inferGeo(s.name);
      var pr=+s.price||0;
      var topTags=(m.Topics||'').split(';').slice(0,3).map(function(t){ t=t.trim(); return t?'<span class="mp2-tag">'+esc(t)+'</span>':''; }).join('');
      html+='<div class="mp2-match-row">'
           +'<div class="mp2-match-rank">#'+(idx+1)+'</div>'
           +'<div class="mp2-match-score-bar"><div class="mp2-match-fill" style="width:'+x.score+'%"></div></div>'
           +'<div class="mp2-match-score-val">'+x.score+'%</div>'
           +'<img class="mp2-fav-ico" src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(s.name)+'&sz=32" onerror="this.style.display=\'none\'" loading="lazy" alt="">'
           +'<div class="mp2-match-info">'
           +'<div class="mp2-match-domain">'+esc(s.name)+' <span class="mp2-match-flag">'+geo.flag+'</span></div>'
           +'<div class="mp2-match-tags">'+topTags+'</div>'
           +'</div>'
           +'<div class="mp2-match-metrics">'
           +'<span class="mp2-badge '+drCls(m.DR||0)+'">DR '+esc(String(m.DR||'—'))+'</span>'
           +'<span class="mp2-match-tfc">'+fmtT(m['Estimated Traffic'])+'</span>'
           +'</div>'
           +'<div class="mp2-match-price">$'+pr.toLocaleString()+'</div>'
           +'<button class="mp2-buy mp2-match-buy'+(cart[s.id]?' mp2-buy-added':'')+'" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+pr+'">'+(cart[s.id]?'✓':'Buy →')+'</button>'
           +'</div>';
    });
    html += '</div>';
    out.innerHTML = html;

    // Bind buy buttons in matcher
    out.querySelectorAll('.mp2-match-buy').forEach(function(btn){
      btn.addEventListener('click',function(){
        var sid=this.dataset.id,nm=this.dataset.name,pr=this.dataset.price;
        if(cart[sid]){ removeFromCart(sid); this.textContent='Buy →'; this.classList.remove('mp2-buy-added'); }
        else{ addToCart(sid,nm,pr); this.textContent='✓'; this.classList.add('mp2-buy-added'); var cw=id('mp2-cart-wrap'); if(cw) cw.classList.add('open'); updateCartUI(); }
      });
    });
  }

  /* ══════════════════════════════════════════
     PAGINATION
  ══════════════════════════════════════════ */
  function pager(){
    var pages=Math.ceil(filtered.length/rpp),el=id('mp2-pager');
    if(pages<=1){ el.innerHTML=''; return; }
    var h='<button class="mp2-pg" onclick="MP2.go('+(page-1)+')" '+(page===1?'disabled':'')+'>&#8249;</button>';
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

  /* ══════════════════════════════════════════
     PRESETS
  ══════════════════════════════════════════ */
  function renderPresets(){
    var names=Object.keys(presets),el=id('mp2-preset-list'); if(!el) return;
    if(!names.length){ el.innerHTML='<span style="font-size:12px;color:var(--gray-400)">None saved</span>'; return; }
    el.innerHTML=names.map(function(n){ return '<button class="mp2-preset-chip" data-p="'+esc(n)+'">'+esc(n)+'<span class="mp2-del" data-pdel="'+esc(n)+'">✕</span></button>'; }).join('');
  }
  function savePreset(){
    var n=prompt('Name this preset:'); if(!n||!n.trim()) return;
    presets[n.trim()]={q:id('mp2-q').value,dr0:id('mp2-dr0').value,dr1:id('mp2-dr1').value,tr0:id('mp2-tr0').value,tr1:id('mp2-tr1').value,pr0:id('mp2-pr0').value,pr1:id('mp2-pr1').value,tags:topicTags.slice(),df:(id('mp2-df')||{}).value||'',lang:(id('mp2-lang')||{}).value||'',country:(id('mp2-country')||{}).value||'',hs:(id('mp2-hide-sens')||{}).checked||false};
    sv('mp2_presets',presets); renderPresets();
  }
  function loadPreset(n){
    var p=presets[n]; if(!p) return;
    id('mp2-q').value=p.q||''; id('mp2-dr0').value=p.dr0||''; id('mp2-dr1').value=p.dr1||'';
    id('mp2-tr0').value=p.tr0||''; id('mp2-tr1').value=p.tr1||''; id('mp2-pr0').value=p.pr0||''; id('mp2-pr1').value=p.pr1||'';
    if(id('mp2-df')) id('mp2-df').value=p.df||'';
    if(id('mp2-lang')) id('mp2-lang').value=p.lang||'';
    if(id('mp2-country')) id('mp2-country').value=p.country||'';
    id('mp2-hide-sens').checked=!!p.hs;
    topicTags=p.tags?p.tags.slice():[]; renderTopicTags(); page=1; run();
  }

  /* ══════════════════════════════════════════
     DATA LOADING
  ══════════════════════════════════════════ */
  async function loadFolder(fid,pg){
    var url='/api/v1/services?filters[folder_id][$eq]='+fid+'&expand[]=metadata&limit=100&page='+pg;
    try{ var r=await fetch(url,{headers:{Authorization:AUTH}}); return await r.json(); }
    catch(e){ return {data:[],pagination:{last_page:1}}; }
  }
  async function loadAll(){
    loading=true; prog(5);
    var first=await Promise.all(FOLDERS.map(function(f){ return loadFolder(f,1); }));
    var tasks=[];
    first.forEach(function(r,idx){ (r.data||[]).forEach(function(s){ all.push(s); }); loaded+=(r.data||[]).length; var lp=(r.pagination||{}).last_page||1; for(var p=2;p<=lp;p++) tasks.push({f:FOLDERS[idx],p:p}); });
    id('mp2-cnt-loaded').textContent=loaded.toLocaleString(); run(); prog(20);
    var BSZ=10,done=0,total=tasks.length;
    for(var i=0;i<total;i+=BSZ){
      var batch=tasks.slice(i,i+BSZ);
      var res=await Promise.all(batch.map(function(t){ return loadFolder(t.f,t.p); }));
      res.forEach(function(r){ (r.data||[]).forEach(function(s){ all.push(s); }); loaded+=(r.data||[]).length; });
      done+=batch.length; prog(20+Math.round((done/total)*78)); id('mp2-cnt-loaded').textContent=loaded.toLocaleString();
      if(done%(BSZ*3)===0) run();
    }
    prog(100); loading=false; setTimeout(function(){ id('mp2-progress').style.display='none'; },700); run();
  }
  function prog(pct){ id('mp2-prog-fill').style.width=pct+'%'; }

  /* ══════════════════════════════════════════
     EVENTS
  ══════════════════════════════════════════ */
  var debT;
  var lazyRun=(function(fn,ms){ return function(){ clearTimeout(debT); debT=setTimeout(fn,ms); }; })(function(){ page=1; run(); },380);

  function bindAll(){
    ['mp2-q','mp2-dr0','mp2-dr1','mp2-tr0','mp2-tr1','mp2-pr0','mp2-pr1'].forEach(function(eid){ var el=id(eid); if(el) el.addEventListener('input',lazyRun); });
    ['mp2-df','mp2-lang','mp2-country'].forEach(function(eid){ var el=id(eid); if(el) el.addEventListener('change',function(){ page=1; run(); }); });
    var hs=id('mp2-hide-sens'); if(hs) hs.addEventListener('change',function(){ page=1; run(); });
    var clr=id('mp2-clear'); if(clr) clr.addEventListener('click',function(){
      ['mp2-q','mp2-dr0','mp2-dr1','mp2-tr0','mp2-tr1','mp2-pr0','mp2-pr1'].forEach(function(eid){ var el=id(eid); if(el) el.value=''; });
      ['mp2-df','mp2-lang','mp2-country'].forEach(function(eid){ var el=id(eid); if(el) el.value=''; });
      var hs2=id('mp2-hide-sens'); if(hs2) hs2.checked=false;
      topicTags=[]; renderTopicTags(); page=1; run();
    });
    bindTopicInput();
    var rppEl=id('mp2-rpp'); if(rppEl) rppEl.addEventListener('change',function(){ rpp=+this.value; page=1; run(); });

    // Sort headers
    document.querySelectorAll('#mp2-head th[data-sort]').forEach(function(th){
      th.addEventListener('click',function(){
        var f=this.dataset.sort; sortD=sortF===f?(sortD==='asc'?'desc':'asc'):'asc'; sortF=f;
        document.querySelectorAll('#mp2-head th').forEach(function(t){ t.classList.remove('mp2-sorted'); var si=t.querySelector('.mp2-sico'); if(si) si.textContent='↕'; });
        this.classList.add('mp2-sorted'); var si2=this.querySelector('.mp2-sico'); if(si2) si2.textContent=sortD==='asc'?'↓':'↑';
        page=1; run();
      });
    });

    // tbody delegation
    var body=id('mp2-body');
    if(body) body.addEventListener('click',function(e){
      // Live data button
      var liveBtn=e.target.closest('.mp2-live-btn');
      if(liveBtn){ fetchLiveData(liveBtn.dataset.domain, liveBtn.dataset.target); return; }

      var buy=e.target.closest('.mp2-buy');
      var fav=e.target.closest('.mp2-fav');
      var blk=e.target.closest('.mp2-blk');
      if(buy){
        var sid=buy.dataset.id,nm=buy.dataset.name,pr=buy.dataset.price;
        if(cart[sid]){ removeFromCart(sid); }
        else{ addToCart(sid,nm,pr); buy.textContent='✓ Added'; buy.classList.add('mp2-buy-added'); var cw=id('mp2-cart-wrap'); if(cw) cw.classList.add('open'); updateCartUI(); }
        return;
      }
      if(fav){ var sid2=fav.dataset.id; favs[sid2]?delete favs[sid2]:(favs[sid2]=1); sv('mp2_favs',favs); fav.classList.toggle('on'); return; }
      if(blk){ var sid3=blk.dataset.id; if(blocks[sid3]){ delete blocks[sid3]; blk.classList.remove('on'); var r=blk.closest('tr'); if(r) r.classList.remove('mp2-blocked'); } else{ blocks[sid3]=1; blk.classList.add('on'); var r2=blk.closest('tr'); if(r2) r2.classList.add('mp2-blocked'); setTimeout(function(){ page=1; run(); },900); } sv('mp2_blocks',blocks); }
    });

    // Column panel
    var colbtn=id('mp2-colbtn'); if(colbtn) colbtn.addEventListener('click',function(e){ e.stopPropagation(); id('mp2-colpanel').classList.toggle('open'); });
    document.addEventListener('click',function(e){
      var cp=id('mp2-colpanel'); if(cp&&!e.target.closest('#mp2-colwrap')) cp.classList.remove('open');
      var cw=id('mp2-cart-wrap'); if(cw&&!e.target.closest('#mp2-cart-wrap')&&!e.target.closest('#mp2-float-cart')&&!e.target.closest('#mp2-hdr-cart')) cw.classList.remove('open');
    });
    var cp2=id('mp2-colpanel'); if(cp2) cp2.addEventListener('click',function(e){ e.stopPropagation(); });
    document.querySelectorAll('#mp2-colpanel input[data-col]').forEach(function(cb){ cb.addEventListener('change',function(){ cols[this.dataset.col]=this.checked?1:0; applyCols(); }); });

    // Cart toggles
    var floatBtn=id('mp2-float-cart'); if(floatBtn) floatBtn.addEventListener('click',function(e){ e.stopPropagation(); var cw=id('mp2-cart-wrap'); if(cw) cw.classList.toggle('open'); updateCartUI(); });
    var hdrBtn=id('mp2-hdr-cart'); if(hdrBtn) hdrBtn.addEventListener('click',function(e){ e.stopPropagation(); var cw=id('mp2-cart-wrap'); if(cw){ cw.classList.toggle('open'); updateCartUI(); } });
    var cPanel=id('mp2-cart-wrap'); if(cPanel) cPanel.addEventListener('click',function(e){ e.stopPropagation(); });

    // Presets
    var sp=id('mp2-save-preset'); if(sp) sp.addEventListener('click',savePreset);
    var pl=id('mp2-preset-list'); if(pl) pl.addEventListener('click',function(e){
      var del=e.target.closest('[data-pdel]'),chip=e.target.closest('[data-p]');
      if(del){ e.stopPropagation(); if(confirm('Delete "'+del.dataset.pdel+'"?')){ delete presets[del.dataset.pdel]; sv('mp2_presets',presets); renderPresets(); } }
      else if(chip) loadPreset(chip.dataset.p);
    });

    bindMatcher();
  }

  window.MP2={ go:function(p){ var pages=Math.ceil(filtered.length/rpp); if(p<1||p>pages) return; page=p; render(); pager(); var el=id('mp2'); if(el) el.scrollIntoView({behavior:'smooth'}); } };

  function init(){ bindAll(); renderPresets(); updateCartUI(); loadAll(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('turbo:load',function(){ if(!loading&&all.length===0) init(); });
})();
