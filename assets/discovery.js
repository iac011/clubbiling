'use strict';
(() => {
 const $ = selector => document.querySelector(selector);
 const language = () => document.documentElement.lang || 'fr';
 const copy = {
  fr:{all:'Tous les thèmes',chinese:'Chinois & culture',family:'Enfants & familles',search:'Rechercher un événement',city:'Ville',district:'Arrondissement',period:'Quand ?',anyCity:'Toutes les villes',anyDistrict:'Tous les arrondissements',anyPeriod:'À venir / en cours',week:'Dans les 7 jours',month:'Dans les 30 jours',freeOnly:'Uniquement les événements gratuits',more:'Afficher plus',refresh:'Actualiser',count:'événements trouvés',updated:'Données lues le',empty:'Aucun événement ne correspond à ces critères. Essayez un autre thème ou consultez les agendas officiels.',date:'Date / horaire publié',venue:'Lieu',price:'Tarif',free:'Gratuit',paid:'Payant — voir les conditions',unknownPrice:'À vérifier sur la fiche officielle',details:'Consulter la fiche officielle',source:'Publié sur',original:'Titres et détails dans la langue du document original.',ready:'Flux consulté',partial:'Couverture partielle',stale:'Dernière lecture en échec',unavailable:'Agenda externe — import indisponible',warning:'Certaines sources ne sont pas à jour. Vérifiez les agendas officiels avant de vous déplacer.',cached:'La dernière copie disponible est affichée ; impossible de lire la mise à jour.',pending:'Le compte sera relié après confirmation de ses liens publics.',read:'Lire sur WeChat',timezone:'Horaires locaux · Europe/Paris',ongoing:'Période publiée',unknownVenue:'Voir la fiche officielle'},
  zh:{all:'全部主题',chinese:'中文与中国文化',family:'儿童与亲子',search:'搜索活动',city:'城市',district:'巴黎区号',period:'活动时间',anyCity:'全部城市',anyDistrict:'巴黎全部区',anyPeriod:'即将开始 / 进行中',week:'未来 7 天',month:'未来 30 天',freeOnly:'仅显示免费活动',more:'显示更多',refresh:'刷新',count:'项活动符合条件',updated:'数据读取时间',empty:'没有符合筛选条件的活动。请更换主题或查看官方活动日历。',date:'官方日期 / 时间',venue:'地点',price:'费用',free:'免费',paid:'收费 — 请查看具体条件',unknownPrice:'请在官方页面确认',details:'查看官方活动详情',source:'收录平台',original:'活动标题与细节保留官方原文。',ready:'已读取',partial:'覆盖不完整',stale:'最近一次读取失败',unavailable:'外部日历 — 暂不可导入',warning:'部分来源尚未更新。出行前请在官方活动页核实。',cached:'暂时无法读取更新，当前显示最近保存的数据。',pending:'确认公开链接后，将接入账号内容。',read:'在微信阅读',timezone:'巴黎当地时间 · Europe/Paris',ongoing:'官方公布的活动期间',unknownVenue:'请查看官方活动详情'},
  en:{all:'All themes',chinese:'Chinese language & culture',family:'Children & families',search:'Search events',city:'City',district:'Paris district',period:'When?',anyCity:'All cities',anyDistrict:'All Paris districts',anyPeriod:'Upcoming / ongoing',week:'Next 7 days',month:'Next 30 days',freeOnly:'Free events only',more:'Show more',refresh:'Refresh',count:'matching events',updated:'Sources checked on',empty:'No events match these filters. Try another theme or check the official calendars.',date:'Published date / time',venue:'Venue',price:'Price',free:'Free',paid:'Paid — check conditions',unknownPrice:'Check the official event page',details:'Open official event page',source:'Listed on',original:'Event titles and details remain in the original source language.',ready:'Feed checked',partial:'Partial coverage',stale:'Latest check failed',unavailable:'External calendar — import unavailable',warning:'Some sources are not current. Check the official calendar before travelling.',cached:'Showing the latest saved copy; the update could not be read.',pending:'Public content will be linked once the account links are confirmed.',read:'Read on WeChat',timezone:'Local times · Europe/Paris',ongoing:'Published event period',unknownVenue:'See the official event page'}
 };
 let data=window.CLUB_CONTENT || {events:[],sources:[]}, theme='chinese', limit=12, failed=false;
 let wechat=window.CLUB_WECHAT || {articles:[]};
 const text = key => (copy[language()] || copy.fr)[key];
 const locale = () => ({fr:'fr-FR',zh:'zh-CN',en:'en-GB'}[language()]||'fr-FR');
 function el(tag,cls,value){const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;}
 function link(url){try{const parsed=new URL(url);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password?parsed.href:null;}catch{return null;}}
 function eventDates(event){
  const occurrence=(event.occurrences||[]).find(pair=>new Date(pair[1])>=new Date()) || (event.nextOccurrence&&new Date(event.nextOccurrence[1])>=new Date()?event.nextOccurrence:null);
  if(occurrence)return occurrence;
  if(event.start.slice(0,10)!==event.end.slice(0,10))return [event.start.slice(0,10),event.end.slice(0,10)];
  return [event.start,event.end];
 }
 function dateLabel(value){
  if(!value)return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(value))return new Intl.DateTimeFormat(locale(),{dateStyle:'medium',timeZone:'Europe/Paris'}).format(new Date(value+'T12:00:00Z'));
  const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat(locale(),{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Paris'}).format(date):'';
 }
 function active(event){
  if(/^\d{4}-\d{2}-\d{2}$/.test(event.end)){
   const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
   const p=Object.fromEntries(parts.map(v=>[v.type,v.value]));return event.end>=p.year+'-'+p.month+'-'+p.day;
  }
  return new Date(event.end)>=new Date();
 }
 function filtered(){
  const query=$('#agenda-search').value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const city=$('#agenda-city').value,district=$('#agenda-district').value,period=Number($('#agenda-period').value),free=$('#agenda-free').checked;
  const cutoff=period?Date.now()+period*86400000:Infinity;
  return data.events.filter(event=>{
   const range=eventDates(event),start=new Date(range[0]).getTime();
   const value=[event.title,event.city,event.venue,event.address,event.organizer].join(' ').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   return active(event)&&(!city||event.city===city)&&(!district||(event.city==='Paris'&&event.district===district))&&(!free||event.priceType==='free')&&(!query||value.includes(query))&&(theme==='all'||event[theme])&&start<=cutoff;
  }).sort((a,b)=>{
   if(theme!=='family'&&(a.chineseScore||0)!==(b.chineseScore||0))return (b.chineseScore||0)-(a.chineseScore||0);
   const first=Math.max(Date.now(),new Date(eventDates(a)[0]).getTime()),second=Math.max(Date.now(),new Date(eventDates(b)[0]).getTime());
   return first-second || a.title.localeCompare(b.title,locale());
  });
 }
 function detail(dl,key,value){const row=el('div');row.append(el('dt','',key),el('dd','',value));dl.append(row);}
 function card(event){
  const node=el('article','event-card'+(event.chinese?' is-chinese':''));
  const top=el('div','event-top');top.append(el('span','',event.city+(event.district?' · '+(language()==='zh'?'第 '+event.district+' 区':event.district==='1'?'1er':event.district+'e'):'')));
  if(event.chinese)top.append(el('span','event-topic',event.chineseScore>=60?text('chinese'):(language()==='zh'?'中国相关关键词':language()==='en'?'Related keyword':'Mot-clé lié à la Chine')));else if(event.family)top.append(el('span','event-topic',text('family')));
  const heading=el('h3','',event.title);heading.lang='fr';node.append(top,heading);
  if(event.excerpt){const p=el('p','',event.excerpt);p.lang='fr';node.append(p);}
  const dates=eventDates(event);const date=dateLabel(dates[0])+(dates[1]!==dates[0]?' – '+dateLabel(dates[1]):'');
  const dl=el('dl','event-details');detail(dl,text('date'),date);
  detail(dl,text('venue'),[event.venue,event.address].filter(Boolean).join(' · ')||text('unknownVenue'));
  detail(dl,text('price'),event.priceType==='free'?text('free'):event.priceType==='paid'?text('paid'):text('unknownPrice'));
  if(event.audience)detail(dl,language()==='zh'?'官方适用人群':language()==='en'?'Published audience':'Public indiqué',event.audience);
  node.append(dl,el('p','event-source',text('source')+' : '+event.sourceName));
  const url=link(event.url);if(url){const a=el('a','event-link',text('details'));a.href=url;a.target='_blank';a.rel='noopener noreferrer';node.append(a);}
  return node;
 }
 function sourceDirectory(){
  const grid=$('#source-directory');grid.replaceChildren();
  for(const source of data.sources){
   const url=link(source.url);if(!url)continue;const a=el('a','coverage-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
   const status=source.status==='ok'?(source.coverage==='partial'||source.skippedWithoutExplicitDate?text('partial'):text('ready')):source.status==='stale'?text('stale'):text('unavailable');
   a.append(el('strong','',source.city),el('small','',status+' · '+source.eventCount));if(source.lastSuccessAt)a.append(el('small','',dateLabel(source.lastSuccessAt)));grid.append(a);
  }
 }
 function updateLabels(){
  document.querySelectorAll('[data-agenda-label]').forEach(node=>node.textContent=text(node.dataset.agendaLabel));
  $('#agenda-search').placeholder=text('search');
  document.querySelectorAll('[data-theme]').forEach(button=>{button.textContent=text(button.dataset.theme);button.setAttribute('aria-pressed',String(button.dataset.theme===theme));});
  const city=$('#agenda-city'),prior=city.value;city.replaceChildren(new Option(text('anyCity'),''));
  const cities=new Set(data.events.filter(active).map(e=>e.city));data.sources.forEach(s=>cities.add(s.city));
  [...cities].sort((a,b)=>a==='Paris'?-1:b==='Paris'?1:a.localeCompare(b)).forEach(value=>city.add(new Option(value,value)));city.value=prior;
  $('#agenda-district').options[0].textContent=text('anyDistrict');
  $('#agenda-period').options[0].textContent=text('anyPeriod');$('#agenda-period').options[1].textContent=text('week');$('#agenda-period').options[2].textContent=text('month');
 }
 function render(){
  updateLabels();const list=filtered();const grid=$('#event-grid');grid.replaceChildren();
  if(!list.length)grid.append(el('p','event-empty',text('empty')));else list.slice(0,limit).forEach(event=>grid.append(card(event)));
  $('#agenda-count').textContent=list.length+' '+text('count');$('#agenda-more').hidden=list.length<=limit;
  const date=data.updatedAt?dateLabel(data.updatedAt):'';$('#agenda-updated').textContent=date?text('updated')+' '+date:'';
  $('#agenda-warning').textContent=failed?text('cached'):data.sources.some(s=>s.status!=='ok')?text('warning'):'';
  sourceDirectory();renderWeChat();
 }
 function renderWeChat(){
  const grid=$('#wechat-articles');grid.replaceChildren();
  if(wechat.accountName)$('#wechat-account-name').textContent=wechat.accountName;
  const channel=$('#wechat-channel-content');channel.replaceChildren();
  if(wechat.channel?.url&&link(wechat.channel.url)){
   const a=el('a','event-link',wechat.channel.name || (language()==='zh'?'在微信查看视频号':language()==='en'?'View on WeChat Channels':'Voir la chaîne sur WeChat'));
   a.href=link(wechat.channel.url);a.target='_blank';a.rel='noopener noreferrer';channel.append(a);
  }
  if(!wechat.articles?.length)return;
  $('#wechat-pending').hidden=true;
  for(const article of wechat.articles){
   const url=link(article.url);if(!url||new URL(url).hostname!=='mp.weixin.qq.com')continue;
   const row=el('div');const a=el('a','',article.title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);
   if(article.publishedAt)row.append(el('time','',dateLabel(article.publishedAt)));grid.append(row);
  }
 }
 async function refresh(){
  $('#agenda-refresh').disabled=true;
  try{const response=await fetch('content/events.json',{cache:'no-store'});if(!response.ok)throw new Error('content fetch');const next=await response.json();if(!Array.isArray(next.events)||!Array.isArray(next.sources))throw new Error('content schema');data=next;failed=false;}
  catch{failed=true;}
  try{const response=await fetch('content/wechat.json',{cache:'no-store'});if(response.ok)wechat=await response.json();}catch{/* Keep the approved local snapshot. */}
  render();$('#agenda-refresh').disabled=false;
 }
 document.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.theme;limit=12;render();}));
 ['#agenda-search','#agenda-city','#agenda-district','#agenda-period','#agenda-free'].forEach(selector=>$(selector).addEventListener(selector==='#agenda-search'?'input':'change',()=>{limit=12;render();}));
 $('#agenda-more').addEventListener('click',()=>{limit+=12;render();});$('#agenda-refresh').addEventListener('click',refresh);
 new MutationObserver(()=>render()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 render();
})();
