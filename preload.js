const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sijilAPI',{
  printPdf:(html,name)=>ipcRenderer.invoke('print-pdf',html,name||'نموذج_امتحان.pdf'),
  pickBackupDir:()=>ipcRenderer.invoke('pick-backup-dir'),
  writeBackupFile:(dir,payload)=>ipcRenderer.invoke('write-backup-file',dir,payload),
  portalStart:(payload)=>ipcRenderer.invoke('portal-start',payload),
  portalStop:()=>ipcRenderer.invoke('portal-stop'),
  portalPush:(payload)=>ipcRenderer.invoke('portal-push',payload),
  portalStatus:()=>ipcRenderer.invoke('portal-status'),
  portalFirewallCheck:()=>ipcRenderer.invoke('portal-fw-check'),
  portalFirewallAllow:()=>ipcRenderer.invoke('portal-fw-allow'),
  syncExport:()=>ipcRenderer.invoke('sync:export'),
  syncImport:(data)=>ipcRenderer.invoke('sync:import',data)
});