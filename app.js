const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const demoMatches = [
 {id:"fb-1",sport:"Football",league:"UEFA Champions League",home:"Real Madrid",away:"Borussia Dortmund",homeBadge:"⚪",awayBadge:"🟡",homeScore:2,awayScore:1,status:"LIVE",minute:"67'",date:"today"},
 {id:"fb-2",sport:"Football",league:"Premier League",home:"Arsenal",away:"Liverpool",homeBadge:"🔴",awayBadge:"🔺",homeScore:1,awayScore:1,status:"LIVE",minute:"52'",date:"today"},
 {id:"bb-1",sport:"Basketball",league:"NBA · Preseason",home:"Boston Celtics",away:"Miami Heat",homeBadge:"☘️",awayBadge:"🔥",homeScore:84,awayScore:79,status:"LIVE",minute:"Q3 · 04:22",date:"today"},
 {id:"hk-1",sport:"Hockey",league:"NHL",home:"Toronto Maple Leafs",away:"Montreal Canadiens",homeBadge:"🍁",awayBadge:"🔵",homeScore:3,awayScore:2,status:"LIVE",minute:"P3 · 12:08",date:"today"},
 {id:"te-1",sport:"Tennis",league:"ATP Tour",home:"Carlos Alcaraz",away:"Jannik Sinner",homeBadge:"🎾",awayBadge:"🎾",homeScore:"1",awayScore:"1",status:"LIVE",minute:"Set 3",date:"today"},
 {id:"fb-3",sport:"Football",league:"La Liga",home:"Barcelona",away:"Atlético Madrid",homeBadge:"🔵",awayBadge:"🔴",homeScore:null,awayScore:null,status:"20:00",minute:"Today",date:"today"},
 {id:"bb-2",sport:"Basketball",league:"EuroLeague",home:"Real Madrid",away:"Fenerbahçe",homeBadge:"⚪",awayBadge:"🟡",homeScore:null,awayScore:null,status:"Tomorrow · 19:45",minute:"Tomorrow",date:"tomorrow"},
 {id:"fb-4",sport:"Football",league:"Premier League",home:"Chelsea",away:"Manchester City",homeBadge:"🔵",awayBadge:"🩵",homeScore:null,awayScore:null,status:"Sat · 17:30",minute:"In 5 days",date:"week"},
 {id:"fb-5",sport:"Football",league:"Serie A",home:"AC Milan",away:"Inter",homeBadge:"🔴",awayBadge:"🔵",homeScore:1,awayScore:0,status:"FT",minute:"Full time",date:"today"},
 {id:"bb-3",sport:"Basketball",league:"NBA",home:"LA Lakers",away:"Golden State Warriors",homeBadge:"💜",awayBadge:"🌉",homeScore:112,awayScore:108,status:"FT",minute:"Final",date:"today"}
];

const state = {view:"live", date:"today", sport:"all", search:"", matches:[], starred:new Set(JSON.parse(localStorage.getItem("sportpulse-starred")||"[]")), notified:new Set(), notificationPermission:("Notification" in window ? Notification.permission : "unsupported"), settings:{provider:localStorage.getItem("sportpulse-provider")||"demo",key:localStorage.getItem("sportpulse-key")||"",poll:Number(localStorage.getItem("sportpulse-poll")||60)}};
let pollTimer;
const viewTitles = {live:["HAPPENING NOW","Live matches"],upcoming:["COMING UP","Upcoming fixtures"],results:["THE FINAL WHISTLE","Recent results"],starred:["YOUR WATCHLIST","Starred matches"]};

function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function saveStars(){localStorage.setItem("sportpulse-starred",JSON.stringify([...state.starred]));}
function isLive(m){return String(m.status).toUpperCase()==="LIVE" || /LIVE/i.test(m.status);}
function isFinished(m){return ["FT","FINAL","FINISHED","AET","PEN"].some(s=>String(m.status).toUpperCase().includes(s));}
function matchTime(m){return m.minute || m.status;}
function formatScore(m){return m.homeScore==null?"–":`${m.homeScore} <span class="score-sep">:</span> ${m.awayScore}`;}

function getVisible(){
 let list=state.matches.filter(m=>{
  if(state.view==="live"&&!isLive(m))return false;
  if(state.view==="upcoming"&&(isLive(m)||isFinished(m)))return false;
  if(state.view==="results"&&!isFinished(m))return false;
  if(state.view==="starred"&&!state.starred.has(String(m.id)))return false;
  if(state.sport!=="all"&&m.sport!==state.sport)return false;
  if(state.search&&!`${m.home} ${m.away} ${m.league} ${m.sport}`.toLowerCase().includes(state.search))return false;
  if(state.view==="upcoming"&&state.date==="tomorrow"&&m.date!=="tomorrow")return false;
  if(state.view==="upcoming"&&state.date==="week"&&!["tomorrow","week"].includes(m.date))return false;
  return true;
 });
 if(state.view==="live")list.sort((a,b)=>Number(state.starred.has(String(b.id)))-Number(state.starred.has(String(a.id))));
 return list;
}
function render(){
 const visible=getVisible();
 $("#live-count").textContent=state.matches.filter(isLive).length;
 $("#section-kicker").textContent=viewTitles[state.view][0];$("#section-title").textContent=viewTitles[state.view][1];
 $("#matches").innerHTML=visible.map(m=>{
  const live=isLive(m),finished=isFinished(m),star=state.starred.has(String(m.id));
  const score=(m.homeScore==null||m.awayScore==null)?`<div class="score upcoming">${escapeHTML(m.status)}</div>`:`<div class="score">${escapeHTML(m.homeScore)} : ${escapeHTML(m.awayScore)}</div>`;
  return `<article class="match-card">
   <div class="match-meta"><span class="league-label">${escapeHTML(m.league||m.sport)}</span><span class="sport-pill">${escapeHTML(m.sport)}</span></div>
   <div class="match-main">
    <div class="team"><span class="team-badge">${escapeHTML(m.homeBadge||"●")}</span><span class="team-name">${escapeHTML(m.home)}</span></div>
    <div>${score}<div class="match-state ${live?"live":""}">${live?escapeHTML(matchTime(m)):finished?"FULL TIME":escapeHTML(m.minute||"Scheduled")}</div></div>
    <div class="team away"><span class="team-badge">${escapeHTML(m.awayBadge||"●")}</span><span class="team-name">${escapeHTML(m.away)}</span></div>
   </div>
   <div class="match-footer"><span>${live?"Live now":finished?"Result":"Scheduled match"} · ${escapeHTML(m.date==="tomorrow"?"Tomorrow":m.date==="week"?"Upcoming":"Today")}</span><button class="star-button ${star?"starred":""}" data-star="${escapeHTML(m.id)}" aria-label="${star?"Unstar":"Star"} ${escapeHTML(m.home)} vs ${escapeHTML(m.away)}" title="${star?"Remove from starred":"Star match"}">${star?"★":"☆"}</button></div>
  </article>`;
 }).join("");
 $("#empty-state").classList.toggle("hidden",visible.length!==0);
 $("#matches").classList.toggle("hidden",visible.length===0);
 $("#empty-title").textContent=state.view==="starred"?"No starred matches yet":"No matches found";
 $("#empty-copy").textContent=state.view==="starred"?"Tap the ☆ on any match to add it to your watchlist.":"Try changing your filters or check back later.";
 $("#date-strip").classList.toggle("hidden",state.view!=="upcoming");
}
function setView(view){
 state.view=view;$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$$(".bottom-item[data-view]").forEach(b=>b.classList.toggle("selected",b.dataset.view===view));
 if(view==="upcoming")state.date=state.date||"today";render();
}
function toast(msg){$("#status-message").textContent=msg;setTimeout(()=>{if($("#status-message").textContent===msg)$("#status-message").textContent="";},5000);}
async function enableNotifications(){
 if(!("Notification" in window)){ $("#notification-status").textContent="This browser does not support notifications.";return;}
 try{
  const p=await Notification.requestPermission();state.notificationPermission=p;
  $("#notification-status").textContent=p==="granted"?"Notifications enabled. Alerts are checked while the app is open.":p==="denied"?"Notifications are blocked in browser settings.":"Permission was not granted.";
  $("#enable-notifications").textContent=p==="granted"?"Enabled":"Try again";
  if(p==="granted")new Notification("SportPulse notifications enabled",{body:"Star a match and we'll alert you when it goes live while SportPulse is running.",icon:"./icons/icon-192.svg"});
 }catch(e){$("#notification-status").textContent="Could not request notification permission in this browser.";}
}
function checkStarredAlerts(nextMatches){
 if(state.notificationPermission!=="granted")return;
 for(const m of nextMatches){
  const id=String(m.id);if(!state.starred.has(id))continue;
  const previous=state.matches.find(old=>String(old.id)===id);
  const keyLive=`${id}:live`;const keyScore=`${id}:${m.homeScore}-${m.awayScore}`;
  if(isLive(m)&&(!previous||!isLive(previous))&&!state.notified.has(keyLive)){
   new Notification(`${m.home} vs ${m.away} is live`,{body:`Kick-off alert · ${m.league||m.sport}`,icon:"./icons/icon-192.svg",tag:keyLive});state.notified.add(keyLive);
  }else if(previous&&isLive(m)&&isLive(previous)&&(previous.homeScore!==m.homeScore||previous.awayScore!==m.awayScore)&&!state.notified.has(keyScore)){
   new Notification(`${m.home} ${m.homeScore} – ${m.awayScore} ${m.away}`,{body:`Score update · ${m.league||m.sport}`,icon:"./icons/icon-192.svg",tag:keyScore});state.notified.add(keyScore);
  }
 }
}
async function loadMatches({silent=false}={}){
 if(state.settings.provider==="demo"){
  const old=state.matches;state.matches=demoMatches.map(m=>({...m}));
  // Demo data is illustrative and does not simulate real live changes.
  $("#connection-label").textContent="Demo data";$("#data-note").textContent="Demo scores are illustrative, not real-time results. Configure a provider in Settings to load available real events.";
  render();if(!silent)toast("Demo matches loaded.");return;
 }
 if(state.settings.provider==="thesportsdb"){
  try{
   const key=state.settings.key.trim()||"123";
   const date=new Date();const dateString=date.toISOString().slice(0,10);
   const response=await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/eventsday.php?d=${dateString}`);
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const json=await response.json();
   const events=(json.events||[]).map(e=>{
    const status=String(e.strStatus||e.strProgress||"").toLowerCase();
    const live=/live|in play|1st half|2nd half|period|quarter/i.test(status);
    const finished=/finished|full time|ft|after extra time/i.test(status);
    return {id:String(e.idEvent),sport:e.strSport||"Other",league:e.strLeague||"Sports",home:e.strHomeTeam||"Home",away:e.strAwayTeam||"Away",homeBadge:"●",awayBadge:"●",homeScore:e.intHomeScore===""?null:e.intHomeScore,awayScore:e.intAwayScore===""?null:e.intAwayScore,status:live?"LIVE":finished?"FT":(e.strTime||"Scheduled"),minute:e.strProgress||e.strStatus||e.strTime||"",date:"today"};
   });
   const previous=state.matches;checkStarredAlerts(events);state.matches=events;
   $("#connection-label").textContent="TheSportsDB";$("#data-note").textContent="Data supplied by TheSportsDB. Coverage, score fields and update frequency vary by sport and event; the free endpoint is not a guaranteed live-score feed.";
   render();if(!silent)toast(`Loaded ${events.length} events from TheSportsDB.`);
  }catch(err){$("#connection-label").textContent="Provider error";toast("Could not load provider data. Check your connection, API key and provider availability.");console.error(err);}
 }
}
function startPolling(){clearInterval(pollTimer);pollTimer=setInterval(()=>loadMatches({silent:true}),state.settings.poll*1000);}

$$(".tab").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$$(".bottom-item[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#bottom-settings").addEventListener("click",()=>$("#settings-dialog").showModal());
$("#settings-open").addEventListener("click",()=>$("#settings-dialog").showModal());
$("#refresh").addEventListener("click",()=>loadMatches());
$("#search").addEventListener("input",e=>{state.search=e.target.value.toLowerCase().trim();render();});
$("#sport-filter").addEventListener("change",e=>{state.sport=e.target.value;render();});
$$(".date-chip").forEach(b=>b.addEventListener("click",()=>{$$(".date-chip").forEach(x=>x.classList.toggle("active",x===b));state.date=b.dataset.date;render();}));
$("#matches").addEventListener("click",e=>{
 const b=e.target.closest("[data-star]");if(!b)return;const id=String(b.dataset.star);
 if(state.starred.has(id)){state.starred.delete(id);toast("Removed from starred matches.");}
 else{state.starred.add(id);toast("Match starred. Alerts are checked while the app is open.");}
 saveStars();render();
});
$("#enable-notifications").addEventListener("click",enableNotifications);
$("#save-settings").addEventListener("click",e=>{
 e.preventDefault();
 state.settings.provider=$("#api-provider").value;state.settings.key=$("#api-key").value;state.settings.poll=Number($("#poll-interval").value);
 localStorage.setItem("sportpulse-provider",state.settings.provider);localStorage.setItem("sportpulse-key",state.settings.key);localStorage.setItem("sportpulse-poll",String(state.settings.poll));
 $("#settings-dialog").close();startPolling();loadMatches();toast("Settings saved.");
});
$("#api-provider").value=state.settings.provider;$("#api-key").value=state.settings.key;$("#poll-interval").value=String(state.settings.poll);
if(state.notificationPermission==="granted")$("#notification-status").textContent="Notifications are allowed by this browser.";
loadMatches();startPolling();
