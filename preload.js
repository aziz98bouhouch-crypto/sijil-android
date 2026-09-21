const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sijilAPI',{
  printPdf:(html,name)=>ipcRenderer.invoke('print-pdf',html,name||'نموذج_امتحان.pdf'),
  pickBackupDir:()=>ipcRenderer.invoke('pick-backup-dir'),
  writeBackupFile:(dir,payload)=>ipcRenderer.invoke('write-backup-file',dir,payload),
  portalStart:(payload)=>ipcRenderer.invoke('portal-start',payload),
  portalStop:()=>ipcRenderer.invoke('portal-stop'),
  portalPush:(payload)=>ipcRenderer.invoke('portal-push',payload),
  portalStatus:()=>ipcRenderer.invoke('portal-status'),
  sha256:(txt)=>ipcRenderer.invoke('sha256',txt),
  portalFirewallCheck:()=>ipcRenderer.invoke('portal-fw-check'),
  portalFirewallAllow:()=>ipcRenderer.invoke('portal-fw-allow'),
  updaterCheck:()=>ipcRenderer.invoke('updater:check'),
  updaterInstall:()=>ipcRenderer.invoke('updater:install'),
  updaterState:()=>ipcRenderer.invoke('updater:state'),
  onUpdaterStatus:(cb)=>{ ipcRenderer.on('updater:status',(e,s)=>{ try{ cb(s); }catch(_){} }); }
});