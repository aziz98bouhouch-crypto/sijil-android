// Single source of truth for the student portal SPA.
// Served by the teacher (main.js) over LAN and bundled as the Android student app's index.html.
// NOTE: this whole document is one JS template literal. Inside it, do NOT use backticks or ${.
module.exports = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" type="image/png" href="logo.png"><title>مواكبتي</title><style>
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;background:radial-gradient(1200px 600px at 100% -10%,#dbeafe,transparent),radial-gradient(900px 500px at -10% 20%,#ccfbf1,transparent),#eef2f7;color:#0f172a;min-height:100vh;display:flex;justify-content:center;padding:14px 14px calc(88px + env(safe-area-inset-bottom,0px));-webkit-user-select:none;user-select:none}
input,textarea{user-select:text;-webkit-user-select:text}
.wrap{width:100%;max-width:660px;position:relative;z-index:1}
.brand{display:flex;align-items:center;gap:12px;margin:0 0 14px auto;max-width:360px}
.brand .logo{width:52px;height:52px;border-radius:14px;background:#fff;object-fit:contain;box-shadow:0 4px 14px rgba(79,124,255,.28);flex-shrink:0;animation:spfloat 3.2s ease-in-out infinite}
.brand .btext{min-width:0;flex:1}
.brand .bname{font-family:'Sakkal Majalla','Traditional Arabic','Amiri','Noto Naskh Arabic',serif;font-size:36px;font-weight:800;line-height:1;letter-spacing:.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(135deg,#4f7cff,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.brand small{display:block;color:#64748b;font-size:11px;font-weight:600;margin-top:3px}
.card{background:#fff;border-radius:16px;padding:15px;box-shadow:0 2px 10px rgba(15,23,42,.07);margin-bottom:12px;border:1px solid #eef2f7}
label{display:block;font-weight:600;margin-bottom:6px;font-size:13px}
input,select{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:11px;font-size:15px;margin-bottom:8px;background:#fff}
button{width:100%;padding:11px;border:0;border-radius:11px;background:#0f766e;color:#fff;font-size:15px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}
button.secondary{background:#eef2f7;color:#0f172a}
button svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.row2{display:flex;gap:8px}
.err{color:#dc2626;font-size:13px;margin-top:6px;display:none}
.modes{display:flex;gap:6px;margin-bottom:10px}
.modes button{padding:8px;font-size:12px;background:#eef2f7;color:#334155;border-radius:9px}
.modes button.on{background:#0f766e;color:#fff}
.banner{display:none;font-size:12px;text-align:center;padding:8px;border-radius:11px;margin-bottom:10px;background:#fef3c7;color:#92400e}
.banner.off{display:block}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.kpi{background:linear-gradient(180deg,#f8fafc,#f1f5f9);border:1px solid #e2e8f0;border-radius:13px;padding:10px;text-align:center}
.kpi b{display:block;font-size:17px}
.kpi span{font-size:10px;color:#475569}
.meta{font-size:12px;color:#334155;margin-bottom:8px;text-align:center}
h3{font-size:13px;color:#0f766e;margin:4px 0 10px;display:flex;align-items:center;gap:6px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 5px;border-bottom:1px solid #eef2f7;text-align:center}
th{background:#f1f5f9;color:#334155;font-weight:700}
.pass{color:#15803d;font-weight:700}
.fail{color:#dc2626;font-weight:700}
.att{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px;text-align:center}
.att b{display:block;font-size:16px;color:#0f172a}
.hwrow{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:7px;font-size:13px}
.hwrow.soon{border-color:#f59e0b;background:#fffbeb}
.hwrow.late{border-color:#dc2626;background:#fef2f2}
.cd{font-size:11px;font-weight:700;white-space:nowrap}
.done{color:#15803d}.pend{color:#b45309}
.none{color:#94a3b8;font-size:13px;text-align:center;padding:10px}
.headrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px}
.nm{font-weight:800;font-size:15px;display:flex;align-items:center;gap:7px}
.nm svg{width:18px;height:18px;stroke:#0f766e;fill:none;stroke-width:2}
.nm .logo{width:32px;height:32px;border-radius:9px;background:#fff;object-fit:contain;box-shadow:0 1px 5px rgba(0,0,0,.16),0 0 0 2px rgba(79,124,255,.22)}
.daysec{margin-bottom:10px}
.daysec .dh{background:linear-gradient(90deg,#0f766e,#0d9488);color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:10px 10px 0 0}
.slotrow{display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eef2f7;font-size:13px}
.slotrow .t{color:#64748b;font-size:12px;direction:ltr}
.lesson{display:flex;align-items:center;gap:12px;padding:11px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;text-decoration:none;color:#0f172a;background:#fff}
.lesson .ic{width:38px;height:38px;border-radius:11px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lesson .ic svg{width:20px;height:20px;stroke:#0f766e;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lesson b{font-size:13px;display:block}
.lesson small{color:#64748b;font-size:11px}
nav.tabs{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-top:1px solid #e2e8f0;box-shadow:0 -4px 16px rgba(15,23,42,.08);z-index:50;display:flex;max-width:660px;margin:0 auto;padding-bottom:env(safe-area-inset-bottom,0)}
nav.tabs button{border-radius:0;background:none;color:#94a3b8;font-size:10px;font-weight:700;padding:8px 2px;display:flex;flex-direction:column;gap:3px;align-items:center;position:relative}
nav.tabs button svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
nav.tabs button.on{color:#0f766e}
.dot{position:absolute;top:6px;left:26%;width:8px;height:8px;background:#dc2626;border-radius:50%;display:none;border:2px solid #fff}
.page{display:none}.page.on{display:block}
.chart{width:100%;height:160px}
.lock{display:inline-flex;align-items:center;gap:4px;font-size:10px;opacity:.9}
.lock svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2}
@media(max-width:440px){.kpis{grid-template-columns:1fr 1fr 1fr}}
#bgSym{position:fixed;inset:0;overflow:hidden;z-index:0;pointer-events:none}
#bgSym span{position:absolute;font-weight:800;line-height:1;will-change:transform;animation:drift linear infinite}
@keyframes drift{0%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(14px,-34px) rotate(180deg)}100%{transform:translate(0,0) rotate(360deg)}}
@media(prefers-reduced-motion:reduce){#bgSym span{animation:none}}
@keyframes spinr{to{transform:rotate(360deg)}}
#refreshBtn.spin svg{animation:spinr .8s linear infinite}
#splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#4f7cff,#8b5cf6);color:#fff;text-align:center;transition:opacity .5s ease,visibility .5s}
#splash.gone{opacity:0;visibility:hidden;pointer-events:none}
.sp-in{display:flex;flex-direction:column;align-items:center;gap:8px;animation:sppop .7s cubic-bezier(.2,.8,.2,1) both}
.sp-logo{width:96px;height:96px;border-radius:24px;background:#fff;object-fit:contain;box-shadow:0 14px 44px rgba(0,0,0,.3);animation:spfloat 2.6s ease-in-out infinite}
.sp-name{font-family:'Sakkal Majalla','Traditional Arabic','Amiri','Noto Naskh Arabic',serif;font-size:34px;font-weight:800;letter-spacing:.5px;margin-top:4px}
.sp-tag{font-size:12px;opacity:.85}
.sp-bar{margin-top:12px;width:130px;height:4px;border-radius:99px;background:rgba(255,255,255,.25);overflow:hidden}
.sp-bar i{display:block;height:100%;width:40%;border-radius:99px;background:#fff;animation:spbar 1.1s ease-in-out infinite}
@keyframes sppop{0%{transform:scale(.82);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes spfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes spbar{0%{transform:translateX(-130%)}100%{transform:translateX(330%)}}
@media(prefers-reduced-motion:reduce){.sp-in,.sp-logo,.sp-bar i,.brand .logo{animation:none}}
</style></head><body><div id="splash" aria-hidden="true"><div class="sp-in"><img class="sp-logo" src="logo.png" alt="" onerror="this.style.display='none'"/><div class="sp-name">مواكبتي</div><div class="sp-tag">سجل التقييم PRO · المواكبة التربوية الذكية</div><div class="sp-bar"><i></i></div></div></div><div id="bgSym" aria-hidden="true"></div><div class="wrap">
<div class="brand"><img class="logo" src="logo.png" alt="شعار مواكبتي" onerror="this.style.display='none'"/><div class="btext"><div class="bname">مواكبتي</div><small>سجل التقييم PRO</small></div></div>
<div class="banner" id="banner"></div>
<div class="card" id="auth">
  <label>الرمز الخاص بك</label><input id="pin" type="password" placeholder="رمزك السرّي — لا تشاركه" autocomplete="off">
  <label>رقم دخولك</label><input id="code" type="text" placeholder="مثال: 2025/01" autocomplete="off">
  <div class="row2"><button onclick="S.login()"><svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>دخول</button><button class="secondary" onclick="S.scan()" title="مسح رمز الربط"><svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg></button></div>
  <div class="err" id="err"></div>
  <div class="row2" style="margin-top:4px"><button class="secondary" style="font-size:12px;padding:9px" onclick="S.diag()">فحص الاتصال</button><button class="secondary" style="font-size:12px;padding:9px" onclick="S.forget()">إعادة الربط</button></div>
</div>
<div id="appWrap" style="display:none">
  <div class="card">
    <div class="headrow"><div class="nm"><img class="logo" src="logo.png" alt="شعار مواكبتي" onerror="this.style.display='none'"/><span id="vname"></span></div><div style="display:flex;gap:6px"><button class="secondary" id="refreshBtn" style="width:auto;padding:6px 10px;font-size:12px" onclick="S.refresh()" title="جلب آخر البيانات من الأستاذ"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>تحديث</button><button class="secondary" style="width:auto;padding:6px 10px;font-size:12px" onclick="S.diag()" title="فحص الاتصال"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 7v6"/><path d="M12 16h.01"/></svg>فحص</button><button class="secondary" style="width:auto;padding:6px 10px;font-size:12px" onclick="S.logout()"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>خروج</button></div></div>
    <div class="meta" id="vmeta"></div>
  </div>
  <div class="page on" id="pg-grades">
    <div class="card">
      <div class="kpis"><div class="kpi"><b id="vavg">—</b><span>المعدل العام</span></div><div class="kpi"><b id="vres">—</b><span>النتيجة</span></div><div class="kpi"><b id="vgrade">—</b><span>التقدير</span></div></div>
      <h3>الحضور — آخر 30 يوماً</h3>
      <div class="att"><div><b id="aab">0</b><span>غائب</span></div><div><b id="ala">0</b><span>متأخر</span></div><div><b id="aex">0</b><span>مبرر</span></div><div><b id="apx">0</b><span>حاضر</span></div></div>
    </div>
    <div class="card"><h3>النتائج في المواد (نشاط / فرض / علامة)</h3>
      <div style="overflow-x:auto"><table><thead><tr><th>المادة</th><th>معامل</th><th>نشاط</th><th>فرض</th><th>العلامة</th><th>النتيجة</th></tr></thead><tbody id="vsubs"></tbody></table></div>
    </div>
  </div>
  <div class="page" id="pg-hw"><div class="card"><h3>الواجبات المنزلية</h3><div id="vhw"></div></div></div>
  <div class="page" id="pg-sched"><div class="card"><h3>جدول الحصص الأسبوعي</h3><div id="vsched"></div></div></div>
  <div class="page" id="pg-evo"><div class="card"><h3>منحنى تطوّري (متوسط الدورات)</h3><div id="vevo"></div></div></div>
  <div class="page" id="pg-lessons"><div class="card"><h3>الدروس والموارد</h3><div id="vlessons"></div></div></div>
  <div class="page" id="pg-contact"><div class="card"><h3>التواصل مع الأستاذ</h3><div id="contactHint" style="font-size:12px;color:#64748b;margin-bottom:10px"></div><div id="contactForm"><label style="font-size:12px;color:#334155">نص رسالتك</label><textarea id="msgBody" placeholder="اكتب سؤالك أو طلبك للأستاذ هنا…" style="width:100%;min-height:120px;margin:6px 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;font:inherit;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box"></textarea><button onclick="S.sendMsg()"><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>إرسال عبر واتساب</button><div style="font-size:11px;color:#94a3b8;margin-top:10px;text-align:center">ستُفتح رسالة واتساب لدى أستاذك تتضمّن اسمك ورقم مسارك وقسمك مع نص رسالتك.</div></div></div></div>
</div>
<div style="text-align:center;margin:6px 0"><span class="lock" style="color:#64748b"><svg viewBox="0 0 24 24" style="stroke:#64748b"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>تطبيق محمي — عرض بياناتك أنت فقط</span></div>
<div id="diagBox" style="display:none"></div>
</div>
<nav class="tabs" id="tabs" style="display:none">
  <button data-pg="grades" class="on"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/></svg>نقطتي</button>
  <button data-pg="hw"><svg viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12l1.5 1.5L13 11M9 16h6"/></svg>واجباتي<span class="dot" id="dot-hw"></span></button>
  <button data-pg="sched"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>حصصي</button>
  <button data-pg="evo"><svg viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>تطوّري</button>
  <button data-pg="lessons"><svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>الدروس<span class="dot" id="dot-lessons"></span></button>
  <button data-pg="contact"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>تواصلي</button>
</nav>
<script>
var S={};
var D=null,META=null,CFG=null;
var LS='sjc_cfg',LSD='sjc_data',LSS='sjc_session',LSE='sjc_ep';
function $x(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function showErr(m){var e=$x("err");e.textContent=m;e.style.display="block"}
function hideErr(){$x("err").style.display="none"}
function loadCfg(){try{CFG=JSON.parse(localStorage.getItem(LS)||"{}")||{}}catch(e){CFG={}}CFG.mode=CFG.mode||"auto"}
function saveCfg(){try{localStorage.setItem(LS,JSON.stringify(CFG))}catch(e){}}
function banner(t){var b=$x("banner");if(t){b.textContent=t;b.className="banner off";}else{b.className="banner"}}
function nowIso(){return new Date().toISOString()}
function sig(d){if(!d)return "";return [d.avg,d.g,(d.subs||[]).length,(d.hw||[]).filter(function(h){return !h.sub}).length,(d.lessons||[]).length,(d.evo||[]).map(function(e){return e.c+":"+e.a}).join("|")].join("_")}
function readCache(code){try{var m=JSON.parse(localStorage.getItem(LSD)||"{}");var r=m[String(code).toLowerCase()];return r||null}catch(e){return null}}
function writeCache(code,obj){try{var m=JSON.parse(localStorage.getItem(LSD)||"{}");m[String(code).toLowerCase()]=obj;localStorage.setItem(LSD,JSON.stringify(m))}catch(e){}}
function sha256hex(txt){txt=String(txt==null?"":txt);if(window.crypto&&crypto.subtle&&crypto.subtle.digest){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(txt)).then(function(b){var a=new Uint8Array(b),s="";for(var i=0;i<a.length;i++){s+=(a[i]<16?"0":"")+a[i].toString(16)}return s})}return Promise.resolve("")}
function lanBase(){var b=(CFG.lan||"").trim();if(!b)return "";b=b.replace(/\\/+$/,"");return b}
function cloudBase(){return String(CFG.su||"").replace(/\\/+$/,"").trim()}
function cloudReady(){return !!(cloudBase()&&CFG.sk&&CFG.inst)}
function hostOf(u){try{return new URL(u).host}catch(e){var t=String(u||""),i=t.indexOf("://");if(i>=0)t=t.slice(i+3);return t.replace(/\\/+$/,"").split("/")[0]}}
var LAN_MS=3500,CLOUD_MS=9000,DEADLAN={net:1,timeout:1,badhost:1};
var WHY={
offline:"لا يوجد اتصال بالإنترنت الآن — ستُعرض آخر بيانات محفوظة",
nohost:"لم يكتمل الربط بعد — امسح رمز QR الذي أعطاك إياه الأستاذ",
nocloud:"لم يكتمل الربط السحابي — امسح رمز QR الخاص بك",
nocrypto:"متصفح هذا الهاتف لا يحسب البصمة الآمنة — استخدم الربط المحلي مع الأستاذ",
timeout:"الخادم لم يرد خلال المهلة — الشبكة ضعيفة، أعد المحاولة",
net:"تعذّر الوصول إلى الخادم — تحقّق من الاتصال ثم أعد المحاولة",
busy:"خادم الأستاذ رفض الطلب (كثرة المحاولات) — انتظر قليلًا ثم أعد المحاولة",
badsec:"الرمز الخاص غير مطابق — امسح رمز QR الخاص بك أو راجع أستاذك",
nodata:"لا توجد بيانات لرقم دخولك عند الأستاذ — راجعه معه",
notfound:"لا توجد بيانات منشورة لرقمك ورمزك — إمّا أن الأستاذ غيّر رمزك أو لم ينشر بعد",
key:"مفتاح السحابة مرفوض — على الأستاذ إعادة النشر من حسابه",
table:"جدول بيانات البوابة غير موجود لدى الأستاذ — على الأستاذ نشر البيانات",
srv:"خادم السحابة أعطى خطأ مؤقتًا — أعد المحاولة بعد قليل",
http:"خادم الأستاذ أعطى خطأ غير متوقع — أعد المحاولة"};
function readLS(k,d){try{var v=JSON.parse(localStorage.getItem(k)||"null");return (v&&typeof v==="object")?v:d}catch(e){return d}}
function writeLS(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function epState(){var s=readLS(LSE,{});s.good=(s.good==="lan"||s.good==="cloud")?s.good:"";s.lanFail=+s.lanFail||0;s.cloudFail=+s.cloudFail||0;s.note=s.note||"";return s}
function jsonOf(t){try{return JSON.parse(t)}catch(e){return null}}
function timed(u,ms,opt){return new Promise(function(res,rej){
  var ctl=null;try{if(window.AbortController)ctl=new AbortController()}catch(e){}
  var o=opt||{};if(ctl)o.signal=ctl.signal;var settled=false;
  var tmr=setTimeout(function(){if(settled)return;settled=true;try{if(ctl)ctl.abort()}catch(e){}rej("timeout")},ms);
  var hit=function(r){if(settled)return;r.text().then(function(txt){if(settled)return;settled=true;clearTimeout(tmr);res({r:r,txt:txt})},function(){if(settled)return;settled=true;clearTimeout(tmr);rej(navigator.onLine===false?"offline":"net")})};
  var miss=function(){if(settled)return;settled=true;clearTimeout(tmr);rej(navigator.onLine===false?"offline":"net")};
  try{fetch(u,o).then(hit,miss)}catch(e){if(!settled){settled=true;clearTimeout(tmr);rej("badhost")}}
})}
function attemptLan(code,pin){
  var b=lanBase();if(!b)return Promise.resolve({ok:false,which:"lan",kind:"nohost"});
  var u=b+"/api/view?code="+encodeURIComponent(code)+(pin?("&sec="+encodeURIComponent(pin)):"");
  return timed(u,LAN_MS,{cache:"no-store"}).then(function(x){
    var j=jsonOf(x.txt)||{};
    if(x.r.status===429)return {ok:false,which:"lan",kind:"busy",http:429};
    if(!x.r.ok){
      if(x.r.status===404)return {ok:false,which:"lan",kind:(String(j.error||"").indexOf("الرمز")>=0?"badsec":"nodata"),http:404};
      return {ok:false,which:"lan",kind:"http",http:x.r.status}
    }
    if(!j||!j.student)return {ok:false,which:"lan",kind:"nodata"};
    return {ok:true,which:"lan",j:{meta:j.meta,student:j.student}}
  },function(k){return {ok:false,which:"lan",kind:String(k||"net")}})
}
function attemptCloud(code,pin){
  if(!cloudReady())return Promise.resolve({ok:false,which:"cloud",kind:"nocloud"});
  return sha256hex(String(code)+"::"+String(pin||"")+"::"+String(CFG.inst)).then(function(rk){
    if(!rk)throw "nocrypto";
    var u=cloudBase()+"/rest/v1/portal_students?select=payload,meta&rowkey=eq."+encodeURIComponent(rk)+"&inst=eq."+encodeURIComponent(CFG.inst);
    return timed(u,CLOUD_MS,{headers:{apikey:CFG.sk,Authorization:"Bearer "+CFG.sk,"Content-Type":"application/json"},cache:"no-store"}).then(function(x){
      if(x.r.status===401||x.r.status===403)throw "key";
      if(x.r.status===404)throw "table";
      if(x.r.status>=500)throw "srv";
      if(!x.r.ok)throw "http"+x.r.status;
      var rows=jsonOf(x.txt);
      if(!rows||!rows.length||!rows[0].payload)throw "notfound";
      return {ok:true,which:"cloud",j:{meta:rows[0].meta,student:rows[0].payload}}
    })
  }).catch(function(k){var s=String(k&&k.message?k.message:k);if(s==="offline"||s==="timeout"||s==="net"||s==="badhost")return {ok:false,which:"cloud",kind:s};if(s.indexOf("TypeError")===0)return {ok:false,which:"cloud",kind:"net"};if(String(s).indexOf("http")===0)return {ok:false,which:"cloud",kind:"srv"};return {ok:false,which:"cloud",kind:(s||"net")}})
}
function useEnd(r){var s=epState();s.good=r.which;s.cloudFail=0;s.at=nowIso();writeLS(LSE,s);return {status:200,j:r.j,via:r.which}}
function lanTally(l){if(!l||l.which!=="lan")return;var s=epState();
  if(l.ok){if(s.lanFail||s.note){s.lanFail=0;s.note="";writeLS(LSE,s)}return}
  if(DEADLAN[l.kind])s.lanFail=(s.lanFail||0)+1;else s.lanFail=0;
  if(s.lanFail>=3&&cloudReady()&&CFG.lan){CFG.lan="";saveCfg();s.lanFail=0;s.note="حُذف عنوان الشبكة الداخلية المعطّل — الاعتماد على السحابة حتى تمسح رمز ربط جديدًا"}
  writeLS(LSE,s)}
function giveUp(a,b){
  var s=epState(),by={},lan=(a.which==="lan"?a:b),cloud=(a.which==="cloud"?a:b);
  by[lan.which]=lan.kind;by[cloud.which]=cloud.kind;
  s.at=nowIso();writeLS(LSE,s);
  var off=(navigator.onLine===false)||lan.kind==="offline"||cloud.kind==="offline";
  return Promise.reject({by:by,offline:!!off,lan:lan.kind,cloud:cloud.kind})
}
function fetchData(code,pin){
  var s=epState(),aL=attemptLan(code,pin),aC=attemptCloud(code,pin);
  var first=(s.good==="cloud")?aC:aL,second=(s.good==="cloud")?aL:aC;
  return first.then(function(a){
    if(a.ok){lanTally(a);second.then(lanTally,function(){});return useEnd(a)}
    return second.then(function(b){lanTally(a);lanTally(b);if(b.ok)return useEnd(b);return giveUp(a,b)},function(){return giveUp(a,{ok:false,which:"cloud",kind:"net"})})
  })
}
var PREF=["badsec","key","table","busy","notfound","nocrypto","nodata","nocloud","nohost","offline","timeout","net","srv"];
function why(err){
  if(!err)return WHY.net;
  var b=(err&&err.by)||{},k="";
  if(err.offline&&!b.cloud)return WHY.offline;
  for(var i=0;i<PREF.length;i++){if(b.lan===PREF[i]||b.cloud===PREF[i]){k=PREF[i];break}}
  if(!k)k=b.cloud||b.lan||"";
  if(String(k).indexOf("http")===0)k="srv";
  var m=WHY[k]||WHY.net;
  if(b.cloud==="nocloud"&&b.lan==="nohost")m=WHY.nohost;
  else if(b.cloud==="notfound"&&b.lan==="nodata")m=WHY.notfound+" — وتأكد أن الأستاذ ضغط «تحديث البيانات الآن»";
  else if(b.cloud==="nocloud"&&b.lan==="nodata")m=WHY.nodata;
  else if(b.cloud==="timeout"&&b.lan==="nodata")m=WHY.nodata;
  var nt=epState().note;if(nt)m=m+" ("+nt+")";
  return m
}
function probeLan(){var b=lanBase();if(!b)return Promise.resolve({kind:"nohost",ms:0});var t0=Date.now();
  return timed(b+"/manifest.webmanifest",2500,{cache:"no-store"}).then(function(x){return {kind:(x.r.ok?"ok":"http"),http:x.r.status,ms:Date.now()-t0}},function(k){return {kind:String(k),ms:Date.now()-t0}})
}
function probeCloud(){if(!cloudReady())return Promise.resolve({kind:"nocloud",ms:0});var t0=Date.now();
  return timed(cloudBase()+"/rest/v1/portal_students?select=rowkey&limit=1",4000,{headers:{apikey:CFG.sk,Authorization:"Bearer "+CFG.sk},cache:"no-store"}).then(function(x){return {kind:(x.r.ok?"ok":(x.r.status===401||x.r.status===403?"key":(x.r.status===404?"table":"srv"))),http:x.r.status,ms:Date.now()-t0}},function(k){return {kind:String(k),ms:Date.now()-t0}})
}
function verdict(r){if(!r)return "—";if(r.kind==="ok")return "يعمل ("+(r.ms||0)+"ms)";return (WHY[r.kind]||r.kind)+(r.http?(" — HTTP "+r.http):"")}
S.diag=function(){
  var box=$x("diagBox");
  if(!box){box=document.createElement("div");box.id="diagBox";(document.querySelector(".wrap")||document.body).appendChild(box)}
  box.style.display="block";box.className="card";box.innerHTML="<h3>فحص الاتصال</h3><div style='font-size:12px;color:#64748b'>جارٍ الفحص…</div>";
  Promise.all([probeLan(),probeCloud()]).then(function(rs){
    var s=epState(),c=currentCode(),cache=readCache(c);
    var rows=[["الشبكة الداخلية (خادم الأستاذ)",lanBase()?hostOf(lanBase()):"غير مُعَدّ",verdict(rs[0])],
      ["السحابة",cloudReady()?hostOf(cloudBase()):"غير مُعَدّ",verdict(rs[1])],
      ["المسار المعتمد",s.good||"لم يُحدَّد بعد","المفتاح السرّي محفوظ ولا يُعرض"],
      ["آخر بيانات محفوظة",cache?String(cache.at||"").slice(0,16).replace("T"," "):"لا يوجد","اضغط «تحديث» عند توفر الشبكة"]];
    var h="<h3>فحص الاتصال</h3>";
    rows.forEach(function(r){h+="<div class='slotrow' style='border-bottom:1px solid #eef2f7;padding:8px 0'><span style='font-size:12px'>"+esc(r[0])+"<br><b style='font-size:12px'>"+esc(r[1])+"</b></span><span style='font-size:11px;color:#475569;text-align:right;max-width:56%'>"+esc(r[2])+"</span></div>"});
    if(s.note)h+="<div style='font-size:11px;color:#92400e;margin-top:6px'>"+esc(s.note)+"</div>";
    h+="<div class='row2' style='margin-top:8px'><button class='secondary' onclick='S.diag()'>إعادة الفحص</button><button class='secondary' onclick='S.forget()'>إعادة الربط</button></div>";
    h+="<div style='font-size:10.5px;color:#94a3b8;margin-top:8px'>إن ظهرت «غير مُعَدّ» في السحابة فامسح رمز QR الخاص بك من تطبيق أستاذك؛ وإن فشل المسارَان فانتظر نشر الأستاذ لبياناته أو اتصالًا أفضل.</div>";
    box.innerHTML=h
  })
};
S.forget=function(){
  var box=$x("diagBox");var t=box?box:document.body;
  if(box){box.style.display="block";box.className="card";box.innerHTML="<h3>إعادة الربط</h3><div style='font-size:12px;color:#475569'>سيُحذف عنوان الشبكة ومفتاح السحابة ورمز دخولك المحفوظ من هذا الهاتف. لن تُحذف أي بيانات عند أستاذك.</div><div class='row2' style='margin-top:10px'><button onclick='S.forgetGo()'>تأكيد المسح</button><button class='secondary' onclick='S.diag()'>تراجع</button></div>"}
};
S.forgetGo=function(){try{localStorage.removeItem(LS);localStorage.removeItem(LSE);localStorage.removeItem(LSS)}catch(e){}CFG={mode:"auto"};saveCfg();banner("");S.logout();toast("مُسِحت إعدادات الربط — امسح رمز QR الخاص بك من جديد")};
function quietRefresh(silent){var c=currentCode();if(!c)return Promise.resolve(null);
  return fetchData(c,currentPin()).then(function(x){
    if(!x||x.status!==200||!x.j||!x.j.student)return null;
    var old=JSON.stringify(D);D=x.j.student;META=x.j.meta;
    writeCache(c,{sig:sig(D),meta:META,student:D,at:nowIso()});
    renderGrades();renderHw();renderSched();renderEvo();renderLessons();renderContact();paintMeta();
    if(!silent){banner("");if(JSON.stringify(D)!==old){$x("dot-hw").style.display="inline-block";toast("تم — وصلت بيانات جديدة من أستاذك")}else toast("أنت على آخر تحديث — لا توجد مستجدات")}
    else if(JSON.stringify(D)!==old){$x("dot-hw").style.display="inline-block";notify("تحديث جديد","أضاف الأستاذ مستجدات إلى بوابة نقطتي")}
    return JSON.stringify(D)!==old
  }).catch(function(e){if(!silent){banner("");toast(why(e))}return null})
}
function paintMeta(){$x("vmeta").textContent=((D.cls||"")+((D.br||D.lv)?(" — "+(D.br||"")+((D.lv?(" / "+D.lv):""))):""))+(META&&META.updatedAt?(" · حُدِّثت "+String(META.updatedAt).slice(0,16).replace("T"," ")):"")}
S.login=function(){var c=$x("code").value.trim();if(!c){showErr("أدخل رقم دخولك");return}
  banner("جارٍ تحميل بياناتك…");
  fetchData(c,$x("pin").value.trim()).then(function(x){
    if(!x||x.status!==200||!x.j||!x.j.student){return Promise.reject({by:{lan:"nodata",cloud:"notfound"}})}
    META=x.j.meta;D=x.j.student;banner("");hideErr();
    var prev=readCache(c);var changed=prev&&prev.sig&&sig(D)!==prev.sig;
    writeCache(c,{sig:sig(D),meta:META,student:D,at:nowIso()});
    try{localStorage.setItem(LSS,JSON.stringify({code:c,pin:$x("pin").value.trim(),mode:CFG.mode}))}catch(e){}
    show(changed,prev);
  }).catch(function(err){
    var msg=why(err);
    var cached=readCache(c);
    if(cached&&cached.student){D=cached.student;META=cached.meta;banner("⚠ وضع عدم الاتصال — بيانات محفوظة من "+(cached.at||"").slice(0,16).replace("T"," "));try{localStorage.setItem(LSS,JSON.stringify({code:c,pin:$x("pin").value.trim(),mode:CFG.mode}))}catch(e){}show(false,cached);showErr(msg+" — عُرضت آخر بيانات محفوظة")}
    else{showErr(msg)}
  })
}
function notify(title,body){try{var C=window.Capacitor;if(C&&C.Plugins&&C.Plugins.LocalNotifications){C.Plugins.LocalNotifications.schedule({notifications:[{id:Math.floor(Date.now())%100000,title:title,body:body}]});return}}catch(e){}try{document.title="• "+title}catch(e){}}
S.show=show;
function show(changed,prev){
  $x("auth").style.display="none";$x("appWrap").style.display="block";$x("tabs").style.display="flex";
  $x("vname").textContent=D.name||"متعلم";
  $x("vmeta").textContent=((D.cls||"")+((D.br||D.lv)?(" — "+(D.br||"")+((D.lv?(" / "+D.lv):""))):""))+(META&&META.updatedAt?(" · حُدِّثت "+String(META.updatedAt).slice(0,16).replace("T"," ")):"");
  renderGrades();renderHw();renderSched();renderEvo();renderLessons();renderContact();
  if(changed){var nhw=(D.hw||[]).filter(function(h){return !h.sub}).length;notify("مستجدات في بوابة نقطتي","علامات أو واجبات جديدة — الواجبات المعلّقة: "+nhw);$x("dot-hw").style.display="inline-block"}
  startPoll();
}
function renderGrades(){
  $x("vavg").textContent=D.avg==null?"—":Number(D.avg).toFixed(2);
  var r=$x("vres");r.textContent=(D.avg==null)?"—":(D.p?"ناجح":"راسب");r.className=D.p?"pass":"fail";
  $x("vgrade").textContent=D.g||"—";
  $x("aab").textContent=D.att?(D.att.ab||0):0;$x("ala").textContent=D.att?(D.att.la||0):0;$x("aex").textContent=D.att?(D.att.ex||0):0;$x("apx").textContent=D.att?(D.att.px||0):0;
  var s="";(D.subs||[]).forEach(function(x){s+="<tr><td>"+esc(x.s)+"</td><td>"+(x.c==null?"—":x.c)+"</td><td>"+(x.aa==null?"—":Number(x.aa).toFixed(1))+"</td><td>"+(x.ea==null?"—":Number(x.ea).toFixed(1))+"</td><td class='"+(x.p?"pass":"fail")+"'>"+(x.f==null?"—":Number(x.f).toFixed(2))+"</td><td class='"+(x.p?"pass":"fail")+"'>"+(x.p?"ناجح":"راسب")+"</td></tr>"});
  $x("vsubs").innerHTML=s||"<tr><td colspan='6' class='none'>لا توجد نتائج بعد</td></tr>";
}
function fmtCd(d){if(!d)return "";var t=new Date(String(d)+"T23:59:59");if(isNaN(t.getTime()))return "";var diff=t-new Date();var day=Math.ceil(diff/86400000);if(diff<0)return {tx:"متأخر "+Math.abs(day)+" يوم",cl:"late"};if(day===0)return {tx:"اليوم",cl:"soon"};if(day<=2)return {tx:"باقي "+day+" يوم",cl:"soon"};return {tx:"باقي "+day+" يوم",cl:""}}
function renderHw(){
  var hw=(D.hw||[]).slice().sort(function(a,b){return String(a.d||"9999").localeCompare(String(b.d||"9999"))});
  $x("vhw").innerHTML=hw.length?hw.map(function(h){var cd=h.sub?{tx:"مسلَّم",cl:""}:fmtCd(h.d);var cls=h.sub?"":(cd&&cd.cl?cd.cl:"");return "<div class='hwrow "+cls+"'><div><b>"+esc(h.t)+"</b><div style='font-size:11px;color:#64748b'>"+esc(h.s)+(h.d?(" · "+esc(h.d)):"")+"</div></div><span class='cd "+(h.sub?"done":"pend")+"'>"+(cd?esc(cd.tx):"—")+"</span></div>"}).join(""):"<div class='none'>لا توجد واجبات معلنة</div>";
}
function renderSched(){
  var sc=D.sched||[];var any=false;var html="";
  sc.forEach(function(day){var filled=(day.slots||[]).filter(function(s){return s.s});if(!filled.length)return;any=true;html+="<div class='daysec'><div class='dh'>"+esc(day.day)+"</div>";filled.forEach(function(s){html+="<div class='slotrow'><span>"+esc(s.s)+"</span><span class='t'>"+esc(s.t)+"</span></div>"});html+="</div>"});
  $x("vsched").innerHTML=any?html:"<div class='none'>لم ينشر الأستاذ جدول الحصص بعد</div>";
}
function renderEvo(){
  var e=(D.evo||[]);if(!e.length){$x("vevo").innerHTML="<div class='none'>لا توجد بيانات دورات كافية بعد</div>";return}
  var W=$x("vevo").clientWidth||320,H=160,pad=28,min=0,max=20;
  var pts=e.map(function(x,i){var X=e.length>1?(pad+i*(W-2*pad)/(e.length-1)):W/2;var Y=H-pad-((x.a-min)/(max-min))*(H-2*pad);return {X:X,Y:Y,a:x.a,c:x.c}});
  var line=pts.map(function(p,i){return (i?"L":"M")+p.X.toFixed(1)+" "+p.Y.toFixed(1)}).join(" ");
  var area="M"+pts[0].X.toFixed(1)+" "+(H-pad)+" "+pts.map(function(p){return "L"+p.X.toFixed(1)+" "+p.Y.toFixed(1)}).join(" ")+" L"+pts[pts.length-1].X.toFixed(1)+" "+(H-pad)+" Z";
  var dots=pts.map(function(p){return "<circle cx='"+p.X.toFixed(1)+"' cy='"+p.Y.toFixed(1)+"' r='4' fill='#0f766e'/><text x='"+p.X.toFixed(1)+"' y='"+(p.Y-9).toFixed(1)+"' font-size='11' text-anchor='middle' fill='#0f172a'>"+Number(p.a).toFixed(2)+"</text><text x='"+p.X.toFixed(1)+"' y='"+(H-8)+"' font-size='10' text-anchor='middle' fill='#64748b'>دورة "+p.c+"</text>"}).join("");
  var grid="<line x1='"+pad+"' y1='"+(H-pad)+"' x2='"+(W-pad)+"' y2='"+(H-pad)+"' stroke='#cbd5e1'/><line x1='"+pad+"' y1='"+pad+"' x2='"+(W-pad)+"' y2='"+pad+"' stroke='#eef2f7'/><text x='"+(pad-4)+"' y='"+(pad+3)+"' font-size='9' text-anchor='end' fill='#94a3b8'>20</text>";
  $x("vevo").innerHTML="<svg class='chart' viewBox='0 0 "+W+" "+H+"'><defs><linearGradient id='ga' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0f766e' stop-opacity='.22'/><stop offset='1' stop-color='#0f766e' stop-opacity='0'/></linearGradient></defs>"+grid+"<path d='"+area+"' fill='url(#ga)'/><path d='"+line+"' fill='none' stroke='#0f766e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>"+dots+"</svg>";
}
var TY={video:"<path d='M23 7l-7 5 7 5V7z'/><rect x='1' y='5' width='15' height='14' rx='2'/>",pdf:"<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/>",document:"<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='8' y1='13' x2='16' y2='13'/><line x1='8' y1='17' x2='13' y2='17'/>",link:"<path d='M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1'/><path d='M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1'/>",activity:"<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>",interactive:"<rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/>",image:"<rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/>"};
function renderLessons(){
  var L=D.lessons||[];$x("vlessons").innerHTML=L.length?L.map(function(x){return "<a class='lesson' href='"+esc(x.u)+"' target='_blank' rel='noopener'><span class='ic'><svg viewBox='0 0 24 24'>"+(TY[x.ty]||TY.link)+"</svg></span><span><b>"+esc(x.t)+"</b><small>"+esc(x.s)+(x.d?(" · "+esc(x.d)):"")+"</small></span></a>"}).join(""):"<div class='none'>لا توجد دروس منشورة حالياً</div>";
}
function renderContact(){
  var hint=$x("contactHint");if(!hint)return;
  var w=META&&META.whats?String(META.whats).replace(/[^0-9]/g,""):"";
  if(w){hint.textContent="أستاذك يستقبل رسائلك عبر واتساب. اكتب رسالتك بالأسفل ثم اضغط «إرسال عبر واتساب».";hint.style.color="#0f766e"}
  else{hint.textContent="لم يُفعّل الأستاذ بعدُ التواصل عبر واتساب — لن تُرسَل أي رسالة حتى يضيف رقمه.";hint.style.color="#94a3b8"}
}
S.sendMsg=function(){
  var w=META&&META.whats?String(META.whats).replace(/[^0-9]/g,""):"";
  if(!w){toast("لم يضف الأستاذ رقم واتساب بعد");return}
  var body=$x("msgBody")?String($x("msgBody").value||"").trim():"";
  if(!body){toast("اكتب نص رسالتك أولاً");return}
  var name=(D&&D.name)||"متعلم";
  var code=(D&&D.code)||currentCode()||"—";
  var cls=(D&&D.cls)||"—";
  var parts=["رسالة من تلميذ — بوابة مواكبتي","الاسم: "+name,"رقم المسار: "+code,"القسم: "+cls,"التاريخ: "+new Date().toLocaleString("ar"),"",body];
  var url="https://wa.me/"+w+"?text="+encodeURIComponent(parts.join("\\n"));
  try{var C=window.Capacitor;if(C&&C.Plugins&&C.Plugins.Browser&&C.Plugins.Browser.open){C.Plugins.Browser.open({url:url}).catch(function(){try{window.open(url,"_blank")}catch(e){window.location.href=url}});return}}catch(e){}
  try{var win=window.open(url,"_blank");if(!win)window.location.href=url}catch(e){window.location.href=url}
};
S.tab=function(pg){
  document.querySelectorAll("nav.tabs button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-pg")===pg)});
  document.querySelectorAll(".page").forEach(function(p){p.classList.toggle("on",p.id==="pg-"+pg)});
  if(pg==="hw"){$x("dot-hw").style.display="none"}if(pg==="lessons"){$x("dot-lessons").style.display="none"}
  if(pg==="evo")renderEvo();
};
document.querySelectorAll("nav.tabs button").forEach(function(b){b.onclick=function(){S.tab(b.getAttribute("data-pg"))}});
S.logout=function(){try{localStorage.removeItem(LSS)}catch(e){};D=null;$x("appWrap").style.display="none";$x("tabs").style.display="none";$x("auth").style.display="block";banner("")};
var _refreshing=false;
S.refresh=function(){var c=currentCode()||$x("code").value.trim();if(!c){toast("أدخل رقم دخولك أولاً");return}
  if(_refreshing)return;_refreshing=true;
  var btn=$x("refreshBtn");if(btn)btn.classList.add("spin");
  banner("جارٍ التحديث من الأستاذ…");
  quietRefresh(true).then(function(ch){
    banner("");
    if(ch===null)toast("تعذّر التحديث — اضغط «فحص الاتصال» لمعرفة السبب");
    else if(ch){$x("dot-hw").style.display="inline-block";toast("تم — وصلت بيانات جديدة من أستاذك")}
    else toast("أنت على آخر تحديث — لا توجد مستجدات")
  }).catch(function(){banner("");toast("تعذّر التحديث — اضغط «فحص الاتصال»")})
  .then(function(){_refreshing=false;if(btn)btn.classList.remove("spin")});
}
function applyScan(raw){raw=String(raw||"").trim();if(!raw){toast("لم يُعثر على رمز صالح");return}
  var su="",sk="",inst="",code="",sec="",host="";
  try{var u=new URL(raw);host=u.protocol+"//"+u.host;var p=u.searchParams;code=p.get("c")||p.get("code")||"";sec=p.get("s")||p.get("pin")||"";su=p.get("su")||"";sk=p.get("sk")||"";inst=p.get("in")||p.get("inst")||"";}
  catch(e){host=raw.replace(/\\/+$/,"");code="";sec=""}
  var cloudHost="";if(su){try{var cu=new URL(su);cloudHost=cu.protocol+"//"+cu.host}catch(e){}}
  if(/^(https?):\\/\\//i.test(host)&&host!==cloudHost)CFG.lan=host.replace(/\\/+$/,"");else if(cloudHost)CFG.lan="";
  if(su)CFG.su=su;if(sk)CFG.sk=sk;if(inst)CFG.inst=inst;
  if(!CFG.mode||CFG.mode==="auto")CFG.mode="auto";
  saveCfg();try{localStorage.removeItem(LSE)}catch(e){}
  if(code)$x("code").value=code;
  if(sec)$x("pin").value=sec;
  toast("تم الربط — جارٍ تحميل بياناتك…");
  if($x("code").value.trim())S.login();
}
S.scan=function(){
  try{var C=window.Capacitor;if(C&&C.Plugins&&C.Plugins.BarcodeScanner){var BS=C.Plugins.BarcodeScanner;var rp=BS.checkPermissions?BS.checkPermissions():Promise.resolve({camera:"granted"});rp.then(function(p){return (p&&p.camera==="granted")?Promise.resolve():BS.requestPermissions()}).then(function(){return BS.startScan({formats:["qr_code"]})}).then(function(res){applyScan(res&&res.barcode&&res.barcode.rawValue||"")}).catch(function(){toast("أُلغي المسح أو تعذّر")});return}}catch(e){}
  if(("BarcodeDetector" in window)&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){scanCam();return}
  toast("امسح رمز QR بهاتفك — استخدم زر المسح أعلى هذا التطبيق");
};
function scanCam(){var v=document.createElement("video");v.setAttribute("playsinline","");v.style.cssText="position:fixed;inset:0;width:100%;height:100%;object-fit:cover;background:#000;z-index:9998";document.body.appendChild(v);var st=document.createElement("button");st.textContent="إلغاء المسح";st.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;width:auto;padding:11px 20px;border-radius:12px;background:#dc2626;color:#fff";document.body.appendChild(st);var stream,track,timer,dead=false;function done(){dead=true;try{if(stream)stream.getTracks().forEach(function(t){t.stop()})}catch(e){}v.remove();st.remove()}st.onclick=done;var det=new window.BarcodeDetector({formats:["qr_code"]});navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(function(s){stream=s;v.srcObject=s;track=s.getVideoTracks()[0];v.play();function tick(){if(dead)return;det.detect(v).then(function(c){if(c&&c.length){done();applyScan(c[0].rawValue);return}}).catch(function(){});timer=setTimeout(tick,350)}tick()}).catch(function(){done();toast("تعذّر فتح الكاميرا — أدخل العنوان يدويًا")})}
function toast(m){var t=document.createElement("div");t.textContent=m;t.style.cssText="position:fixed;bottom:calc(100px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;z-index:10000;max-width:90%;text-align:center";document.body.appendChild(t);setTimeout(function(){t.remove()},2400)}
var pollT=null,POLL_VIS=120000,POLL_BG=600000;
function startPoll(){if(pollT)clearInterval(pollT);if(!currentCode())return;pollT=setInterval(function(){if(navigator.onLine===false)return;quietRefresh(true)},document.hidden?POLL_BG:POLL_VIS)}
function currentCode(){try{return (JSON.parse(localStorage.getItem(LSS)||"{}").code)||""}catch(e){return ""}}
function currentPin(){try{return (JSON.parse(localStorage.getItem(LSS)||"{}").pin)||""}catch(e){return ""}}
document.addEventListener("visibilitychange",function(){startPoll();if(!document.hidden&&D)quietRefresh(true)});
window.addEventListener("online",function(){if(D){banner("");quietRefresh(true)}});
window.addEventListener("offline",function(){if(D)banner("⚠ لا اتصال — المعروض آخر بيانات محفوظة")});
(function harden(){try{document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){var k=(e.key||"").toLowerCase();if(e.key==="F12"||(e.ctrlKey&&e.shiftKey&&["i","j","c","k"].indexOf(k)>=0)||(e.ctrlKey&&k==="u")||(e.metaKey&&e.altKey&&["i","j","c"].indexOf(k)>=0)){e.preventDefault();return false}});document.addEventListener("selectstart",function(e){var t=e.target&&e.target.tagName;if(t!=="INPUT"&&t!=="TEXTAREA")e.preventDefault()});}catch(e){}})();
loadCfg();
(function boot(){
  try{var sp=new URLSearchParams(location.search);
    var code0=sp.get("c")||sp.get("code")||"";var sec0=sp.get("s")||sp.get("pin")||"";
    var su0=sp.get("su")||"",sk0=sp.get("sk")||"",in0=sp.get("in")||sp.get("inst")||"";
    if(su0||sk0||in0||sp.get("m")||sec0){applyScan(location.href);}
    else if(code0&&!$x("code").value.trim())$x("code").value=code0;
  }catch(e){}
  var ses=null;try{ses=JSON.parse(localStorage.getItem(LSS)||"null")}catch(e){}
  if(ses&&ses.code){$x("code").value=ses.code;if(ses.pin)$x("pin").value=ses.pin;var cached=readCache(ses.code);if(cached&&cached.student){D=cached.student;META=cached.meta;$x("auth").style.display="none";$x("appWrap").style.display="block";$x("tabs").style.display="flex";show(false,cached);banner("جارٍ التحديث من الخادم…");fetchData(ses.code,ses.pin).then(function(x){if(x&&x.status===200&&x.j&&x.j.student){D=x.j.student;META=x.j.meta;writeCache(ses.code,{sig:sig(D),meta:META,student:D,at:nowIso()});banner("");renderGrades();renderHw();renderSched();renderEvo();renderLessons()}else{banner("تعذّر التحديث — عُرضت البيانات المحفوظة")}}).catch(function(e){banner("⚠ "+why(e)+" — عُرضت بيانات محفوظة من "+((cached.at||"").slice(0,16).replace("T"," ")))})}}
  $x("code").addEventListener("keyup",function(e){if(e.key==="Enter")S.login()});
})();
try{(function(){var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;setTimeout(function(){try{var s=$x("splash");if(!s)return;s.classList.add("gone");setTimeout(function(){try{if(s&&s.parentNode)s.parentNode.removeChild(s)}catch(e){}},600)}catch(e){}},rm?350:1250)})()}catch(e){}
(function bgSymbols(){try{
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var host=document.getElementById("bgSym");if(!host)return;
  var SYM=["π","∑","√","∞","÷","×","±","≈","∫","Δ","θ","α","β","Ω","µ","½","∠","⊥","§","¶","&","?","!","أ","ب","ت","ث","ج","ح","خ","د","ر","س","ع","ف","ق","ك","ل","م","ن","ه","و","ي","A","B","x","y","z","é","à","ç","ñ","♪","♫","∯","✂","🏛","⚔","📜","⌛","🕰","🌍","🗺","🧭","⛰","🌊"];
  var COL=["#4f7cff","#8b5cf6","#0f766e","#e11d48","#f59e0b","#0891b2"];
  for(var i=0;i<30;i++){
    var s=document.createElement("span");
    var ch=SYM[(Math.random()*SYM.length)|0];
    s.textContent=ch;
    s.style.left=(Math.random()*100).toFixed(2)+"%";
    s.style.top=(Math.random()*100).toFixed(2)+"%";
    var em=ch.codePointAt(0)>0x2500;
    s.style.fontSize=((em?30+Math.random()*40:22+Math.random()*54)|0)+"px";
    s.style.color=COL[(Math.random()*COL.length)|0];
    if(em){s.style.filter="drop-shadow(0 2px 6px rgba(15,23,42,.18))";s.style.opacity=(0.14+Math.random()*0.12).toFixed(3);}
    else{s.style.opacity=(0.06+Math.random()*0.07).toFixed(3);}
    s.style.animationDuration=(16+Math.random()*22).toFixed(1)+"s";
    s.style.animationDelay=(-Math.random()*30).toFixed(1)+"s";
    host.appendChild(s);
  }
}catch(e){}})();
</script></body></html>`;
