"use strict";
const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const path = require("path");
const axios = require("axios");
const { scheduleJob } = require("node-schedule");
const fs = require("fs");
const recorder = require("node-record-lpcm16");
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  timeout: 5e3
});
let mainWindow;
const scheduledJobs = /* @__PURE__ */ new Map();
let currentUsername = null;
let recordingProcess = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "GALING",
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    },
    width: 1280,
    height: 1e3,
    backgroundColor: "#1a1a1a"
  });
  mainWindow.setMenu(null);
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }
}
function showNotification(title, body) {
  const notification = new Notification({
    title: title || "日程提醒",
    body: body || "您有一个日程即将开始"
  });
  notification.show();
  notification.on("click", () => {
    if (mainWindow) {
      mainWindow.focus();
    }
  });
}
function scheduleReminder(schedule) {
  const utcStartTime = new Date(schedule.startTime);
  const reminderTime = new Date(utcStartTime.getTime() - 3 * 60 * 1e3);
  const now = /* @__PURE__ */ new Date();
  const beijingTime = new Date(now.getTime() + 8 * 3600 * 1e3);
  const job = scheduleJob(reminderTime, () => {
    const formatTime = (utcString) => {
      if (!utcString) return "未设置";
      try {
        return utcString.replace("T", " ").replace("Z", "");
      } catch (e) {
        return utcString;
      }
    };
    console.log(reminderTime);
    showNotification(
      `日程即将开始: ${schedule.content}`,
      `开始时间: ${formatTime(schedule.startTime)}
结束时间: ${formatTime(schedule.endTime)}
资源: ${schedule.resource}
优先级: ${["低", "中", "高"][schedule.priority - 1]}`
    );
  });
  if (beijingTime >= reminderTime) {
    const formatTime = (utcString) => {
      if (!utcString) return "未设置";
      try {
        return utcString.replace("T", " ").replace("Z", "");
      } catch (e) {
        return utcString;
      }
    };
    console.log(reminderTime);
    showNotification(
      `日程即将开始: ${schedule.content}`,
      `开始时间: ${formatTime(schedule.startTime)}
结束时间: ${formatTime(schedule.endTime)}
资源: ${schedule.resource}
优先级: ${["低", "中", "高"][schedule.priority - 1]}`
    );
  }
  scheduledJobs.set(`schedule_${schedule.id}_${schedule.startTime}`, job);
}
function clearAllReminders() {
  scheduledJobs.forEach((job) => job.cancel());
  scheduledJobs.clear();
}
async function initUserSchedules(username) {
  var _a, _b;
  clearAllReminders();
  currentUsername = username;
  try {
    const response = await api.post("getSchedule/", {
      username
    });
    const schedules = response.data.events;
    const now = /* @__PURE__ */ new Date();
    const beijingTime = new Date(now.getTime() + 8 * 3600 * 1e3);
    let scheduledCount = 0;
    schedules.forEach((schedule) => {
      if (new Date(schedule.startTime) > beijingTime) {
        scheduleReminder(schedule);
        scheduledCount++;
      }
    });
    console.log(`已为 ${username} 设置 ${scheduledCount} 个有效日程提醒`);
    return { success: true, count: scheduledCount };
  } catch (error) {
    console.error("初始化日程提醒失败:", error);
    return {
      success: false,
      error: ((_b = (_a = error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || error.message
    };
  }
}
function showTestNotification() {
  showNotification(
    "日程提醒服务已激活",
    "您将在每个日程开始前3分钟收到通知"
  );
}
app.whenReady().then(() => {
  createWindow();
  ipcMain.handle("init-schedule-notifications", (event, { username }) => {
    console.log(username);
    return initUserSchedules(username);
  });
  ipcMain.handle("show-test-notification", showTestNotification);
  ipcMain.handle("start-recording", () => {
    const recordingsDir = path.join("/Users/dionysus/Documents/myWeb/sm2", "recordings");
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const audioFilePath2 = path.join(recordingsDir, `recording-${timestamp}.wav`);
    console.log("开始录音，文件路径：", audioFilePath2);
    const writeStream = fs.createWriteStream(audioFilePath2);
    console.log("User Data Path:", app.getPath("userData"));
    recordingProcess = recorder.record({
      sampleRate: 16e3,
      channels: 1,
      audioType: "wav",
      recorder: "sox",
      silence: "0"
    });
    recordingProcess.stream().pipe(writeStream);
    writeStream.on("error", (err) => {
      console.error("写入录音文件出错:", err);
    });
    writeStream.on("finish", () => {
      console.log("录音写入完成");
    });
    return audioFilePath2;
  });
  ipcMain.handle("stop-recording", () => {
    return new Promise((resolve) => {
      if (recordingProcess) {
        recordingProcess.stop();
        recordingProcess = null;
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
  setInterval(() => {
    if (currentUsername) {
      console.log("自动刷新日程提醒...");
      initUserSchedules(currentUsername).catch((err) => {
        console.error("自动刷新失败:", err);
      });
    }
  }, 0.5 * 60 * 1e3);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    clearAllReminders();
    app.quit();
  }
});
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的Promise拒绝:", reason);
});
