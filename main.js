const {app,BrowserWindow,Menu,shell,ipcMain,dialog,nativeImage,Tray,Notification}=require('electron');
const path=require('path');
const fs=require('fs');
const http=require('http');
const os=require('os');
const crypto=require('crypto');
const {execFile}=require('child_process');

app.setPath('userData', path.join(app.getPath('appData'), 'sijil-taqyim-pro'));

const gotTheLock=app.requestSingleInstanceLock();
if(!gotTheLock){ app.quit(); }

let win=null;

function createWindow(){
  const iconPath=path.join(__dirname,'build','icon.ico');
  win=new BrowserWindow({
    width:1360,
    height:860,
    minWidth:980,
    minHeight:640,
    show:false,
    autoHideMenuBar:true,
    backgroundColor:'#0f172a',
    icon:fs.existsSync(iconPath)?iconPath:undefined,
    webPreferences:{
      contextIsolation:true,
      nodeIntegration:false,
      sandbox:true,
      preload:path.join(__dirname,'preload.js'),
      spellcheck:false
    }
  });
  win.loadFile('index.html');
  win.once('ready-to-show',()=>win.show());
  win.webContents.setWindowOpenHandler(({url})=>{
    if(/^https?:/i.test(url))shell.openExternal(url);
    return {action:'deny'};
  });
  win.on('close',(e)=>{ try{ if(tray&&!quitRequested){ e.preventDefault(); win.hide(); } }catch(e2){} });
  win.on('closed',()=>{win=null;});
}

Menu.setApplicationMenu(null);

ipcMain.handle('print-pdf', async (event, html, name)=>{
  let w=null;
  try{
    w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});
    await w.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));
    const data=await w.webContents.printToPDF({printBackground:true,pageSize:'A4'});
    const safeName=String(name||'نموذج_امتحان.pdf').replace(/[\\/:*?"<>|]/g,'_');
    const def=/(?:\.pdf)$/i.test(safeName)?safeName:safeName+'.pdf';
    const r=await dialog.showSaveDialog({defaultPath:def,filters:[{name:'PDF',extensions:['pdf']}]});
    if(r.canceled||!r.filePath)return{ok:false,cancelled:true};
    fs.writeFileSync(r.filePath,data);
    if(win&&win.isMinimized())win.restore();
    return{ok:true,path:r.filePath};
  }catch(e){
    return{ok:false,error:String((e&&e.message)||e)};
  }finally{
    if(w){try{w.destroy()}catch(e){}}
  }
});

ipcMain.handle('pick-backup-dir', async ()=>{
  try{
    const r=await dialog.showOpenDialog({title:'اختر مجلد النسخ الاحتياطي على القرص',properties:['openDirectory','createDirectory']});
    if(r.canceled||!r.filePaths.length)return{ok:false,cancelled:true};
    return{ok:true,path:r.filePaths[0]};
  }catch(e){
    return{ok:false,error:String((e&&e.message)||e)};
  }
});

ipcMain.handle('write-backup-file', (event, dir, payload)=>{
  try{
    if(!dir||typeof dir!=='string'||!fs.existsSync(dir))return{ok:false,error:'مجلد غير موجود'};
    const stamp=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const name='sijil-autobak-'+stamp.getFullYear()+'-'+pad(stamp.getMonth()+1)+'-'+pad(stamp.getDate())+'_'+pad(stamp.getHours())+pad(stamp.getMinutes())+pad(stamp.getSeconds())+'.json';
    const file=path.join(dir,name);
    fs.writeFileSync(file,payload,'utf8');
    const list=fs.readdirSync(dir).filter(f=>/^sijil-autobak-.*\.json$/i.test(f)).sort();
    while(list.length>10){fs.unlinkSync(path.join(dir,list.shift()));}
    return{ok:true,path:file};
  }catch(e){
    return{ok:false,error:String((e&&e.message)||e)};
  }
});

// ===== PORTAL (بوابة المتعلمين عن بعد — خادم محلي بلا إنترنت) =====
let portalSrv=null,portalData=null,portalBasePort=8050;
let syncLastPush=null;

function lanIPv4(){
  const out=[];
  try{
    const ifs=os.networkInterfaces();
    for(const k of Object.keys(ifs||{})){
      (ifs[k]||[]).forEach(ifc=>{if(ifc&&ifc.family==='IPv4'&&!ifc.internal)out.push(ifc.address);});
    }
  }catch(e){}
  return out;
}
function portalUrls(port){const urls=['http://127.0.0.1:'+port];lanIPv4().forEach(a=>urls.push('http://'+a+':'+port));return urls;}

const PORTAL_HTML=require("./portal-html.js");

function sha256HexNode(txt){try{return crypto.createHash('sha256').update(String(txt==null?'':txt)).digest('hex');}catch(e){return '';}}
function ctEq(a,b){if(!a||!b||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++){r|=a.charCodeAt(i)^b.charCodeAt(i);}return r===0;}
const MAX_AT=6,WIN_AT=60000,THROT_MS=180;
const portalFails=new Map();
function portalLocked(ip){const e=portalFails.get(ip);if(!e)return false;if(Date.now()-e.t>=WIN_AT){portalFails.delete(ip);return false;}return e.n>=MAX_AT;}
function portalHit(ip){const now=Date.now();const e=portalFails.get(ip)||{n:0,t:now};if(now-e.t>=WIN_AT){e.n=0;e.t=now;}e.n++;e.t=now;portalFails.set(ip,e);}
function portalClear(ip){portalFails.delete(ip);}
function sleepMs(n){return new Promise(r=>setTimeout(r,n));}
function secHeaders(res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'");
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Content-Type','text/html; charset=utf-8');
}
function portalDeny(res,ip){portalHit(ip);return res;}

// ===== نسخة الهاتف (تطبيق ويب/PWA يقدّمه نفس الخادم على /app) =====
const APP_ICON_PNG=path.join(__dirname,'build','icon.png');
const appIconCache={};
function appIcon(size){
  if(appIconCache[size])return appIconCache[size];
  try{
    const img=nativeImage.createFromPath(APP_ICON_PNG);
    if(img&&!img.isEmpty()){const b=img.resize({width:size,height:size,quality:'best'}).toPNG();appIconCache[size]=b;return b;}
  }catch(e){}
  return null;
}
function serveAppHtml(res){
  try{
    const html=fs.readFileSync(path.join(__dirname,'index.html'));
    res.writeHead(200,{
      'Content-Type':'text/html; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src *; media-src 'self' data: blob:; frame-src 'self' data: blob:; font-src 'self' data:"
    });
    res.end(html);
  }catch(e){
    res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('cannot load app');
  }
}
function manifestJson(){
  return JSON.stringify({
    name:'المواكبة التربوية الذكية',short_name:'المواكبة',description:'سجل التقويم والتشخيص والدعم التربوي',
    lang:'ar',dir:'rtl',start_url:'/app',scope:'/',display:'standalone',orientation:'any',
    background_color:'#0f172a',theme_color:'#0f172a',
    icons:[
      {src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
    ]
  });
}
const SW_JS=`const CACHE='sijil-app-v1';
const ASSETS=['/app','/manifest.webmanifest','/icon-192.png','/icon-512.png'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});}));});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put('/app',cp);});return r;}).catch(function(){return caches.match('/app');}));
    return;
  }
  if(url.pathname==='/app'||url.pathname==='/manifest.webmanifest'||url.pathname==='/icon-192.png'||url.pathname==='/icon-512.png'){
    e.respondWith(caches.match(req).then(function(r){return r||fetch(req);}));
  }
});`;

async function portalHandler(req,res){
  const u=(req.url||'/').split('?')[0];
  const ip=(req.socket&&req.socket.remoteAddress)||'?';
  if(u==='/'||u==='/index.html'||u==='/portal'){
    secHeaders(res);
    res.writeHead(200);
    res.end(PORTAL_HTML);
    return;
  }
  if(req.method==='OPTIONS'){
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'});res.end();return;
  }
  if(u==='/api/sync'){
    let data=null;try{data=await rendererSnapshot();}catch(e){}
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify({ok:true,time:new Date().toISOString(),data:data,lastPush:syncLastPush}));return;
  }
  if(u==='/api/sync/import'&&req.method==='POST'){
    let body='';req.on('data',c=>body+=c);req.on('end',async()=>{
      try{
        const j=JSON.parse(body);const data=(j&&j.data)?j.data:j;
        syncData=(j&&j.data)?j:data;syncLastPush=Date.now();
        try{if(data&&win&&win.webContents&&!win.webContents.isDestroyed()){await win.webContents.executeJavaScript('if(typeof window.handleSyncImport==="function")window.handleSyncImport('+JSON.stringify(data)+')').catch(()=>{});}}catch(e){}
        res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify({ok:true}));return;
      }catch(e){
        res.writeHead(400,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify({error:'invalid json'}));return;
      }
    });return;
  }
  if(u==='/api/view'){
    if(portalLocked(ip)){res.writeHead(429,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'محاولات كثيرة — حاول بعد قليل'}));return;}
    let code='',pin='';
    try{const sp=new URL(req.url,'http://x').searchParams;code=sp.get('code')||'';pin=sp.get('pin')||'';}catch(e){}
    const auth=(portalData&&portalData.auth)||{};
    if(auth.enabled&&auth.hash&&auth.salt){
      if(!ctEq(sha256HexNode(pin+auth.salt),String(auth.hash).toLowerCase())){
        portalDeny(res,ip);await sleepMs(THROT_MS);
        res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'الرمز غير صحيح'}));return;
      }
    }
    const list=(portalData&&portalData.studs)?(portalData.studs||[]):[];
    const st=list.find(x=>x.code&&String(x.code).toLowerCase()===String(code).toLowerCase());
    if(!st){
      portalDeny(res,ip);await sleepMs(THROT_MS);
      res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'الرمز غير صحيح'}));return;
    }
    portalClear(ip);
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({meta:portalData&&portalData.meta?portalData.meta:null,student:st}));
    return;
  }
  if(u==='/app'||u==='/app/'||u.indexOf('/app/')===0){serveAppHtml(res);return;}
  if(u==='/manifest.webmanifest'){res.writeHead(200,{'Content-Type':'application/manifest+json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(manifestJson());return;}
  if(u==='/sw.js'){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','Service-Worker-Allowed':'/'});res.end(SW_JS);return;}
  if(u==='/icon-192.png'||u==='/icon-512.png'){const size=u.indexOf('192')>=0?192:512;const b=appIcon(size);if(b){res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public, max-age=86400'});res.end(b);}else{res.writeHead(404,{'Content-Type':'text/plain'});res.end('no icon');}return;}
  if(u==='/logo.png'){try{const fp=path.join(__dirname,'build','icon.png');if(fs.existsSync(fp)){res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public, max-age=86400','Access-Control-Allow-Origin':'*'});res.end(fs.readFileSync(fp));return;}}catch(e){}res.writeHead(404,{'Content-Type':'text/plain'});res.end('no logo');return;}
  if(u.indexOf('/build/')===0){
    try{
      const base=path.join(__dirname,'build');
      const rel=decodeURIComponent(u.slice('/build/'.length)).replace(/\\/g,'/');
      const fp=path.join(base,rel);
      if(rel.indexOf('..')<0&&fp.startsWith(base)&&fs.existsSync(fp)&&fs.statSync(fp).isFile()){
        const ext=path.extname(fp).toLowerCase();
        const types={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.otf':'font/otf','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
        res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'public, max-age=86400','Access-Control-Allow-Origin':'*'});
        res.end(fs.readFileSync(fp));return;
      }
    }catch(e){}
    res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found');return;
  }
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('404');
}

async function portalRun(port){
  for(let p=port;p<port+10&&p<=65535;p++){
    await new Promise((res)=>{
      const srv=http.createServer(portalHandler);
      srv.on('error',()=>{srv.close();res(null);});
      srv.on('listening',()=>{portalSrv=srv;res(null);});
      try{srv.listen(p,'0.0.0.0');}catch(e){try{srv.close()}catch(e2){}res(null);}
    });
    if(portalSrv)return{ok:true,port:p,urls:portalUrls(p)};
  }
  return{ok:false,error:'تعذّر تشغيل الخدمة على المنافذ المتاحة'};
}
function portalStopSync(){if(portalSrv){try{portalSrv.close()}catch(e){}portalSrv=null;}}

function fwCheckNow(){return new Promise(res=>{
  if(process.platform!=='win32')return res({ok:true,present:true,detail:'n/a'});
  execFile('powershell.exe',['-NoProfile','-Command','if(Get-NetFirewallRule -DisplayName "Sijil Portal" -ErrorAction SilentlyContinue){"yes"}else{"no"}'],{timeout:10000,encoding:'utf8'},(err,stdout,stderr)=>{
    const yes=(String(stdout||'').indexOf('yes')>=0);
    res({ok:!err,present:yes,detail:String(stdout||stderr||'').slice(0,80)});
  });
});}
function fwAddElevated(){return new Promise(res=>{
  if(process.platform!=='win32')return res({ok:true,present:true,detail:'n/a'});
  const lo=Math.min(65535,Math.max(1024,parseInt(portalBasePort,10)||8050));
  const hi=Math.min(65535,lo+9);
  const portRange=lo===hi?String(lo):(lo+'-'+hi);
  const log=(os.tmpdir()+'\\sijil_fw_'+Date.now()+'.txt');
  const ps="Start-Process -FilePath cmd -ArgumentList @('/c','netsh advfirewall firewall add rule name=\"Sijil Portal\" dir=in action=allow protocol=TCP localport="+portRange+" enable=yes profile=any > \""+log+"\" 2>&1') -Verb RunAs -Wait -WindowStyle Hidden";
  execFile('powershell.exe',['-NoProfile','-Command',ps],{timeout:60000,encoding:'utf8'},async ()=>{
    const c=await fwCheckNow();
    let tail='';try{tail=fs.readFileSync(log,'utf8').split(/\r?\n/).filter(Boolean).slice(-3).join(' | ').slice(0,120);fs.unlinkSync(log);}catch(eo){}
    res({ok:c.ok,present:c.present,detail:tail});
  });
});}
ipcMain.handle('portal-fw-check',async()=>fwCheckNow());
ipcMain.handle('portal-fw-allow',async()=>fwAddElevated());
ipcMain.handle('portal-start',async(e,payload)=>{
  portalData=(payload&&payload.data)||portalData;
  const port=Math.min(65535,Math.max(1024,parseInt((payload&&payload.port)!=null?payload.port:8050,10)||8050));
  portalBasePort=port;
  portalStopSync();
  const r=await portalRun(port);
  if(r.ok){const fw=await fwCheckNow();return{ok:true,running:true,port:r.port,urls:portalUrls(r.port),fw};}
  return{ok:false,running:false,error:r.error};
});
ipcMain.handle('portal-stop',()=>{portalStopSync();return{ok:true,running:false};});
ipcMain.handle('portal-push',(e,payload)=>{try{portalData=payload||null}catch(eo){}return{ok:true,running:!!portalSrv};});
ipcMain.handle('portal-status',()=>{const port=portalSrv?(portalSrv.address()&&portalSrv.address().port):0;return{running:!!portalSrv,port:port||0,urls:portalSrv?portalUrls(port||8050):[]};});
ipcMain.handle('sha256',(e,txt)=>sha256HexNode(txt));


async function rendererSnapshot(){if(!win||!win.webContents||win.webContents.isDestroyed())return null;try{return await win.webContents.executeJavaScript('(typeof window.__syncSnapshot==="function")?window.__syncSnapshot():Promise.resolve(null)');}catch(e){return null;}}

// ===== دفعة 4: درج النظام + تشغيل تلقائي + نسخ احتياطي مجدوّل ومشفّر =====
let tray=null,quitRequested=false,backupTimer=null,lastBackupAt=0;
const BACKUP_INTERVAL_MS=6*3600*1000;   // فحص كل 6 ساعات
const BACKUP_MAX_AGE_H=20;              // نسخ إن مضى على الأحدث أكثر من 20 ساعة
const BACKUP_KEEP=14;

function pad2(n){return String(n).padStart(2,'0');}
function backupsDir(){return path.join(app.getPath('userData'),'backups');}
function getBackupKey(){
  const kp=path.join(app.getPath('userData'),'backup.key');
  try{ if(fs.existsSync(kp)){ const s=fs.readFileSync(kp,'utf8').trim(); if(s&&s.length>=44) return s; } }catch(e){}
  try{ const k=crypto.randomBytes(32).toString('base64'); fs.writeFileSync(kp,k,{mode:0o600}); return k; }catch(e){ return null; }
}
function encryptString(keyB64,plaintext){
  const key=Buffer.from(keyB64,'base64');
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  const enc=Buffer.concat([cipher.update(Buffer.from(plaintext,'utf8')),cipher.final()]);
  const tag=cipher.getAuthTag();
  return JSON.stringify({v:1,alg:'aes-256-gcm',iv:iv.toString('base64'),tag:tag.toString('base64'),data:enc.toString('base64')});
}
function pruneBackups(dir,keep){
  try{
    const files=fs.readdirSync(dir).filter(f=>/^sijil-backup_.*\.enc\.json$/.test(f))
      .map(f=>({f,m:fs.statSync(path.join(dir,f)).mtimeMs})).sort((a,b)=>b.m-a.m);
    for(let i=keep;i<files.length;i++){ try{ fs.unlinkSync(path.join(dir,files[i].f)); }catch(e){} }
  }catch(e){}
}
async function doEncryptedBackup(reason){
  try{
    const key=getBackupKey(); if(!key) return {ok:false,error:'no-key'};
    const data=await rendererSnapshot(); if(!data) return {ok:false,skipped:true};
    const dir=backupsDir(); try{ fs.mkdirSync(dir,{recursive:true}); }catch(e){}
    const ts=new Date();
    const stamp=ts.getFullYear()+'-'+pad2(ts.getMonth()+1)+'-'+pad2(ts.getDate())+'_'+pad2(ts.getHours())+'-'+pad2(ts.getMinutes());
    const payload=encryptString(key,JSON.stringify({createdAt:ts.toISOString(),reason:reason||'scheduled',app:'sijil-taqyim-pro',data}));
    const fp=path.join(dir,'sijil-backup_'+stamp+'.enc.json');
    fs.writeFileSync(fp,payload,{mode:0o600});
    pruneBackups(dir,BACKUP_KEEP);
    lastBackupAt=Date.now();
    return {ok:true,file:fp};
  }catch(e){ return {ok:false,error:String((e&&e.message)||e)}; }
}
function newestBackupAgeHours(){
  try{
    const dir=backupsDir(); if(!fs.existsSync(dir)) return 1e9;
    const ms=fs.readdirSync(dir).filter(f=>/\.enc\.json$/.test(f)).map(f=>{ try{return fs.statSync(path.join(dir,f)).mtimeMs;}catch(e){return 0;} });
    if(!ms.length) return 1e9;
    return (Date.now()-Math.max.apply(null,ms))/3600000;
  }catch(e){ return 1e9; }
}
function startBackupScheduler(){
  (async()=>{ try{ if(newestBackupAgeHours()>BACKUP_MAX_AGE_H){ const r=await doEncryptedBackup('startup'); if(r&&r.ok) notify('نسخة احتياطية مشفّرة','أُنشئت نسخة عند التشغيل'); } }catch(e){} })();
  if(backupTimer) clearInterval(backupTimer);
  backupTimer=setInterval(()=>{ doEncryptedBackup('scheduled'); },BACKUP_INTERVAL_MS);
}
function getAutoLaunch(){ try{ return !!app.getLoginItemSettings().openAtLogin; }catch(e){ return false; } }
function setAutoLaunch(v){ try{ app.setLoginItemSettings({openAtLogin:!!v,arguments:[]}); }catch(e){} }
function notify(title,body){ try{ if(Notification.isSupported()){ const n=new Notification({title:String(title||''),body:String(body||'')}); n.on('click',()=>showWindow()); n.show(); } }catch(e){} }
function trayIcon(){ try{ const i=nativeImage.createFromPath(APP_ICON_PNG); if(i&&!i.isEmpty()) return i.resize({width:16,height:16}); }catch(e){} return nativeImage.createEmpty(); }
function refreshTrayMenu(){ try{ if(tray) tray.setContextMenu(buildTrayMenu()); }catch(e){} }
function buildTrayMenu(){
  const running=!!portalSrv;
  return Menu.buildFromTemplate([
    {label:'فتح التطبيق',click:()=>showWindow()},
    {type:'separator'},
    {label:running?'إيقاف خادم المزامنة':'تشغيل خادم المزامنة',click:async()=>{ try{ if(portalSrv){portalStopSync();}else{await portalRun(portalBasePort);} }catch(e){} refreshTrayMenu(); }},
    {label:'نسخة احتياطية مشفّرة الآن',click:async()=>{ const r=await doEncryptedBackup('manual'); if(r&&r.ok){ notify('تم إنشاء نسخة احتياطية مشفّرة',path.basename(r.file)); } else if(r&&r.skipped){ notify('لا توجد بيانات للنسخ','افتح التطبيق أولًا'); } else { notify('تعذّر إنشاء النسخة الاحتياطية',''); } refreshTrayMenu(); }},
    {label:'البدء تلقائيًا مع النظام',type:'checkbox',checked:getAutoLaunch(),click:(it)=>{ setAutoLaunch(it.checked); }},
    {label:'فتح مجلد النسخ الاحتياطية',click:()=>{ try{ fs.mkdirSync(backupsDir(),{recursive:true}); shell.openPath(backupsDir()); }catch(e){} }},
    {label:'التحقق من التحديثات',click:async()=>{ try{ updSend({status:'checking'}); if(__upd){ await __upd.checkForUpdates(); } }catch(e){} }},
    {type:'separator'},
    {label:'خروج',click:()=>{ quitRequested=true; app.quit(); }}
  ]);
}
function createTray(){ try{ tray=new Tray(trayIcon()); tray.setToolTip('المواكبة التربوية الذكية'); tray.setContextMenu(buildTrayMenu()); tray.on('click',()=>showWindow()); tray.on('double-click',()=>showWindow()); }catch(e){ tray=null; } }
function showWindow(){ try{ if(!win) createWindow(); if(win){ if(win.isMinimized())win.restore(); win.show(); win.focus(); } }catch(e){} }

let __upd=null,__updState={status:'idle'};
function updSend(payload){ __updState=Object.assign({},__updState,payload||{}); try{ if(win&&win.webContents&&!win.webContents.isDestroyed()) win.webContents.send('updater:status',__updState); }catch(e){} }
function setupAutoUpdater(){
  if(!app.isPackaged) return;
  try{
    const {autoUpdater}=require('electron-updater'); __upd=autoUpdater;
    autoUpdater.logger=null;
    autoUpdater.autoDownload=true;
    autoUpdater.autoInstallOnAppQuit=true;
    autoUpdater.disableWebInstaller=true;
    autoUpdater.on('error',(e)=>{ updSend({status:'error',message:String((e&&e.message)||e)}); });
    autoUpdater.on('checking',()=>{ updSend({status:'checking'}); });
    autoUpdater.on('update-not-available',()=>{ updSend({status:'up-to-date'}); });
    autoUpdater.on('update-available',(info)=>{ const v=info&&info.version; updSend({status:'available',version:v}); notify('توفّر تحديث جديد','جارٍ تنزيل الإصدار '+(v||'')+' تلقائيًا…'); });
    autoUpdater.on('download-progress',(p)=>{ updSend({status:'downloading',percent:Math.round((p&&p.percent)||0)}); });
    autoUpdater.on('update-downloaded',(info)=>{
      const v=info&&info.version; updSend({status:'downloaded',version:v});
      notify('التحديث جاهز للتثبيت','الإصدار '+(v||'')+' — اضغط «إعادة التشغيل الآن» لتثبيته');
      try{
        const opts={type:'info',title:'تحديث جديد جاهز',message:'تم تنزيل التحديث'+((info&&info.version)?(' (الإصدار '+info.version+')'):'')+'. هل تريد إعادة تشغيل التطبيق الآن لتثبيته؟',buttons:['إعادة التشغيل الآن','لاحقًا']};
        dialog.showMessageBox(win&&!win.isDestroyed()?win:undefined,opts).then(r=>{ if(r&&r.response===0){ quitRequested=true; setImmediate(()=>{ try{ autoUpdater.quitAndInstall(false,true); }catch(e){ app.quit(); } }); } }).catch(()=>{});
      }catch(e){}
    });
    setTimeout(()=>{ try{ autoUpdater.checkForUpdates(); }catch(e){} },6000);
  }catch(e){}
}
ipcMain.handle('updater:check',async()=>{ try{ if(!__upd) return {ok:false,dev:true}; const r=await __upd.checkForUpdates(); return {ok:true,state:__updState,version:r&&r.updateInfo&&r.updateInfo.version}; }catch(e){ return {ok:false,error:String(e&&e.message||e)}; } });
ipcMain.handle('updater:install',async()=>{ try{ if(__upd){ quitRequested=true; setImmediate(()=>{ try{ __upd.quitAndInstall(false,true); }catch(e){ app.quit(); } }); } return {ok:true}; }catch(e){ return {ok:false,error:String(e&&e.message||e)}; } });
ipcMain.handle('updater:state',()=>__updState);

app.whenReady().then(async()=>{
  if(!gotTheLock) return;
  createWindow();
  createTray();
  try{ await portalRun(portalBasePort); }catch(e){}
  startBackupScheduler();
  setupAutoUpdater();
  app.on('second-instance',()=>{ showWindow(); });
  app.on('activate',()=>{ if(BrowserWindow.getAllWindows().length===0)createWindow(); });
});

app.on('window-all-closed',()=>{
  if(tray&&process.platform!=='darwin'){ return; }
  if(process.platform!=='darwin')app.quit();
});

app.on('will-quit',()=>{ try{ if(backupTimer)clearInterval(backupTimer); }catch(e){} portalStopSync(); });