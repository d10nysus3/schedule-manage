import { watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'

export function useTaskReminder() {
    const taskStore = useTaskStore()

    // 安排新任务的提醒
    const scheduleReminder = (task) => {
        if (task.startTime && !task.completed) {
            if (window.electronAPI) {
                window.electronAPI.scheduleTaskReminder(task)
            } else {
                // 浏览器环境备用方案
                scheduleBrowserNotification(task)
            }
        }
    }

    // 取消任务提醒
    const cancelReminder = (taskId) => {
        if (window.electronAPI) {
            window.electronAPI.cancelTaskReminder(taskId)
        }
    }

    // 浏览器环境通知
    const scheduleBrowserNotification = (task) => {
        if (!('Notification' in window)) return

        const timeLeft = new Date(task.startTime) - Date.now()
        if (timeLeft <= 0) return

        setTimeout(() => {
            if (Notification.permission === 'granted') {
                new Notification(`任务提醒: ${task.title}`, {
                    body: `计划时间: ${new Date(task.startTime).toLocaleString()}`
                })
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(`任务提醒: ${task.title}`, {
                            body: `计划时间: ${new Date(task.startTime).toLocaleString()}`
                        })
                    }
                })
            }
        }, timeLeft)
    }

    // 初始化监听任务变化
    const initTaskWatcher = () => {
        watch(
            () => taskStore.tasks,
            (newTasks, oldTasks) => {
                // 处理新增或修改的任务
                newTasks.forEach(task => {
                    if (!task.completed && task.startTime) {
                        scheduleReminder(task)
                    }
                })

                // 处理删除或完成的任务
                oldTasks.forEach(oldTask => {
                    if (!newTasks.some(t => t.id === oldTask.id) ||
                        newTasks.find(t => t.id === oldTask.id)?.completed) {
                        cancelReminder(oldTask.id)
                    }
                })
            },
            { deep: true }
        )
    }

    // 初始化点击通知跳转
    const initNotificationNavigation = () => {
        if (window.electronAPI) {
            window.electronAPI.onNavigateToTask((event, taskId) => {
                // 这里需要根据你的路由实现跳转到对应任务
                router.push(`/tasks/${taskId}`)
            })
        }
    }

    return {
        scheduleReminder,
        cancelReminder,
        initTaskWatcher,
        initNotificationNavigation
    }
}