let scanner=null, chart=null, deferredInstall=null;
const $=id=>document.getElementById(id);
const store={events:"hhh_events",participants:"hhh_participants",attendance:"hhh_attendance",audit:"hhh_audit",settings:"hhh_settings"};

function read(k){return JSON.parse(localStorage.getItem(store[k])||"[]")}
function write(k,v){localStorage.setItem(store[k],JSON.stringify(v))}
function log(action,detail){const logs=read("audit");logs.unshift({time:new Date().toLocaleString(),action,detail});write("audit",logs.slice(0,500));renderAudit()}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function esc(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

document.querySelectorAll(".menu button").forEach(btn=>btn.addEventListener("click",()=>goTo(btn.dataset.page)));
$("mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
$("lockBtn").onclick=secureVault;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").style.display="inline-block"});
$("installBtn").onclick=()=>deferredInstall&&deferredInstall.prompt();

function goTo(page){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(page).classList.add("active");document.querySelectorAll(".menu button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageTitle").textContent=page.charAt(0).toUpperCase()+page.slice(1);refreshAll();}

function createEvent(){
 const e={id:"EVT-"+Date.now(),name:$("eventName").value.trim(),type:$("eventType").value,venue:$("eventVenue").value.trim(),organizer:$("eventOrganizer").value.trim(),start:$("startDate").value,end:$("endDate").value,retentionDays:$("retentionDays").value||365,consentRequired:$("consentRequired").value,createdAt:new Date().toISOString()};
 if(!e.name||!e.start||!e.end)return toast("Fill event name and dates.");
 const events=read("events");events.unshift(e);write("events",events);log("CREATE_EVENT",e.name);toast("Event created.");refreshAll();
 ["eventName","eventOrganizer","startDate","endDate"].forEach(id=>$(id).value="");
}

function registerParticipant(){
 const p={id:"P-"+Date.now(),eventId:$("participantEvent").value,fullName:$("fullName").value.trim(),email:$("email").value.trim(),phone:$("phone").value.trim(),organization:$("organization").value.trim(),role:$("role").value,accessLevel:$("accessLevel").value,consent:$("consent").value,qrValue:"HHH|"+$("participantEvent").value+"|P-"+Date.now(),createdAt:new Date().toISOString()};
 if(!p.eventId||!p.fullName)return toast("Select event and enter name.");
 if(p.consent==="no")return toast("Consent is required before registration.");
 const parts=read("participants");parts.unshift(p);write("participants",parts);log("REGISTER_PARTICIPANT",p.fullName);toast("Participant registered.");
 ["fullName","email","phone","organization"].forEach(id=>$(id).value="");refreshAll();
}

function checkIn(qr){
 const bits=qr.split("|"); if(bits.length!==3||bits[0]!=="HHH")return toast("Invalid QR.");
 const [_,eventId,participantId]=bits, session=$("sessionName").value.trim()||"Main Session";
 const p=read("participants").find(x=>x.id===participantId&&x.eventId===eventId); if(!p)return toast("Participant not found.");
 const att=read("attendance"); if(att.some(a=>a.eventId===eventId&&a.participantId===participantId&&a.session===session))return toast("Duplicate check-in blocked.");
 att.unshift({id:"ATT-"+Date.now(),eventId,participantId,session,time:new Date().toLocaleString(),method:"QR/Manual",operator:"Admin"});write("attendance",att);log("CHECK_IN",p.fullName+" • "+session);$("checkinResult").textContent=p.fullName+" checked in successfully for "+session;toast("Check-in successful.");refreshAll();
}
function manualCheckIn(){const v=$("manualQr").value.trim();if(!v)return toast("Enter QR value.");checkIn(v);$("manualQr").value=""}
function startScanner(){if(scanner)return toast("Scanner already running.");scanner=new Html5Qrcode("reader");scanner.start({facingMode:"environment"},{fps:10,qrbox:260},text=>checkIn(text)).catch(()=>toast("Camera failed. Use manual entry."))}
function stopScanner(){if(scanner)scanner.stop().then(()=>{scanner.clear();scanner=null})}

function refreshAll(){renderStats();renderEvents();renderOptions();renderParticipants();renderBadges();renderReports();renderAudit();renderChart();renderFeed();}
function renderStats(){const e=read("events"),p=read("participants"),a=read("attendance");$("statEvents").textContent=e.length;$("statParticipants").textContent=p.length;$("statCheckins").textContent=a.length;$("statRate").textContent=p.length?Math.round(a.length/p.length*100)+"%":"0%";}
function renderEvents(){const events=read("events");$("eventCards").innerHTML=events.length?events.map(e=>`<div class="event-card"><h3>${esc(e.name)}</h3><p class="meta">${esc(e.type)} • ${esc(e.venue)}</p><p>${esc(e.start)} to ${esc(e.end)}</p><p class="meta">Organizer: ${esc(e.organizer||"N/A")} • Retention: ${esc(e.retentionDays)} days</p></div>`).join(""):"<p>No events yet.</p>";}
function renderOptions(){const events=read("events");$("participantEvent").innerHTML=events.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join("");}
function renderParticipants(){const ps=read("participants"), ev=read("events");$("participantCards").innerHTML=ps.length?ps.map(p=>{const e=ev.find(x=>x.id===p.eventId);setTimeout(()=>qr("qr"+p.id,p.qrValue),20);return `<div class="participant-card"><h3>${esc(p.fullName)}</h3><p class="meta">${esc(p.role)} • ${esc(p.accessLevel)}</p><p>${esc(e?e.name:"Unknown event")}</p><p class="meta">${esc(p.organization)} • ${esc(p.phone)}</p><canvas class="qrCanvas" id="qr${p.id}"></canvas><p class="meta">${esc(p.qrValue)}</p><button onclick="printBadge('${p.id}')">Print Badge</button></div>`}).join(""):"<p>No participants yet.</p>";}
function renderBadges(){const ps=read("participants"),ev=read("events");$("badgeStudio").innerHTML=ps.map(p=>{const e=ev.find(x=>x.id===p.eventId);setTimeout(()=>qr("bqr"+p.id,p.qrValue),20);return `<div class="badge"><div class="logoMark">HH</div><h2>${esc(p.fullName)}</h2><p>${esc(p.role)} • ${esc(p.organization)}</p><strong>${esc(e?e.name:"Event")}</strong><canvas id="bqr${p.id}"></canvas><p>${esc(p.qrValue)}</p></div>`}).join("")||"<p>No badges yet.</p>";}
function qr(id,value){const el=$(id);if(el&&!el.dataset.done){QRCode.toCanvas(el,value,{width:120});el.dataset.done="1"}}
function renderReports(){const a=read("attendance"),ps=read("participants"),ev=read("events");$("attendanceTable").innerHTML=`<table><tr><th>Name</th><th>Event</th><th>Session</th><th>Time</th><th>Operator</th></tr>${a.map(r=>{const p=ps.find(x=>x.id===r.participantId),e=ev.find(x=>x.id===r.eventId);return `<tr><td>${esc(p?p.fullName:"Unknown")}</td><td>${esc(e?e.name:"Unknown")}</td><td>${esc(r.session)}</td><td>${esc(r.time)}</td><td>${esc(r.operator)}</td></tr>`}).join("")}</table>`;}
function renderAudit(){const logs=read("audit");$("auditLogs").innerHTML=`<table><tr><th>Time</th><th>Action</th><th>Detail</th></tr>${logs.map(l=>`<tr><td>${esc(l.time)}</td><td>${esc(l.action)}</td><td>${esc(l.detail)}</td></tr>`).join("")}</table>`}
function renderFeed(){const a=read("attendance").slice(0,5),ps=read("participants");$("liveFeed").innerHTML=a.map(r=>{const p=ps.find(x=>x.id===r.participantId);return `<div class="feed-item"><div><b>${esc(p?p.fullName:"Unknown")}</b><small>${esc(r.session)}</small></div><small>${esc(r.time)}</small></div>`}).join("")||"<p>No live check-ins yet.</p>";}
function renderChart(){const a=read("attendance");const labels=[...new Set(a.map(x=>x.session))].slice(0,8);const data=labels.map(l=>a.filter(x=>x.session===l).length);const ctx=$("attendanceChart");if(!ctx)return;if(chart)chart.destroy();chart=new Chart(ctx,{type:"line",data:{labels:labels.length?labels:["No data"],datasets:[{label:"Check-ins",data:data.length?data:[0],tension:.35,fill:true}]},options:{responsive:true,plugins:{legend:{display:false}}}});}
function rowsToCSV(rows){return rows.map(r=>r.map(v=>`"${String(v||"").replaceAll('"','""')}"`).join(",")).join("\n")}
function download(name,content,type="text/csv"){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function downloadAttendanceCSV(){const a=read("attendance"),ps=read("participants"),ev=read("events");download("humphreys_attendance.csv",rowsToCSV([["Name","Event","Session","Time","Operator"],...a.map(r=>{const p=ps.find(x=>x.id===r.participantId),e=ev.find(x=>x.id===r.eventId);return[p?.fullName,e?.name,r.session,r.time,r.operator]})]));}
function downloadParticipantsCSV(){const ps=read("participants"),ev=read("events");download("humphreys_participants.csv",rowsToCSV([["Name","Event","Email","Phone","Organization","Role","Access","Consent","QR"],...ps.map(p=>[p.fullName,ev.find(e=>e.id===p.eventId)?.name,p.email,p.phone,p.organization,p.role,p.accessLevel,p.consent,p.qrValue])]));}
function downloadEventsCSV(){download("humphreys_events.csv",rowsToCSV([["Name","Type","Venue","Organizer","Start","End","Retention"],...read("events").map(e=>[e.name,e.type,e.venue,e.organizer,e.start,e.end,e.retentionDays])]));}
function downloadJSON(){download("humphreys_backup.json",JSON.stringify({events:read("events"),participants:read("participants"),attendance:read("attendance"),audit:read("audit")},null,2),"application/json")}
function clearAllData(){if(confirm("Delete all local demo data?")){Object.values(store).forEach(k=>localStorage.removeItem(k));refreshAll();toast("Local data deleted.")}}
function saveSettings(){toast("Settings saved.");log("SAVE_SETTINGS","Brand settings updated.")}
async function secureVault(){const pass=prompt("Set/enter a vault passphrase for this browser demo:");if(!pass)return;const data=new TextEncoder().encode(JSON.stringify({events:read("events"),participants:read("participants"),attendance:read("attendance")}));const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(pass));const key=await crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt"]);const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,data);localStorage.setItem("hhh_vault",JSON.stringify({iv:Array.from(iv),data:Array.from(new Uint8Array(encrypted))}));log("SECURE_VAULT","Encrypted local backup created.");toast("Encrypted vault backup created.");}
function printBadge(id){goTo("badges");setTimeout(()=>window.print(),300)}
function printAllBadges(){window.print()}
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
refreshAll();
