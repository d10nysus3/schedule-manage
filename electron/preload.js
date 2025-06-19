// commonjs
const { contextBridge, ipcRenderer }= require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    initScheduleNotifications: (username) => ipcRenderer.invoke('init-schedule-notifications', { username }),
    showTestNotification: () => ipcRenderer.invoke('show-test-notification'),
    startRecording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording')
})