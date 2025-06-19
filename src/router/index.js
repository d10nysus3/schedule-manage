import {createRouter, createWebHashHistory} from 'vue-router'
import home from '../views/home/homeView.vue'
import teamSchedule from '../views/home/teamSchedule.vue'
import carouselView from "../views/home/CarouselView.vue";
import {useKeepAliveStore} from "../store/control.js";
import groupView from "../views/home/GroupList.vue";
import personalView from "../views/personal/personalCenter.vue";
import scheduleList from "../views/home/scheduleList.vue";
import memorandum from "../views/home/Memorandum.vue";
import teamMemorandum from "../views/home/teamMemorandum.vue";
import announcementBoard from "../views/home/AnnouncementBoard.vue";
import memberList from "../views/home/MemberList.vue";

const routes = [
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        name: 'userLogin',
        component: () => import('../views/login/loginView.vue'),
        meta: {
            keepAlive: false
        }
    },
    {
        path: '/register',
        name: 'userRegister',
        component: () => import('../views/register/registerView.vue'),
        meta: {
            keepAlive: false
        }
    },
    {
        path: '/home',
        name: 'home',
        component: home,
        meta: {
            keepAlive: true
        }

    }, {
        path: '/calendarView',
        name: 'calendarView',
        component: home,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/carouselView',
        name: 'carouselView',
        component: carouselView,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/groupView',
        name: 'groupView',
        component: groupView,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/teamSchedule',
        name: 'teamSchedule',
        component: teamSchedule,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/personalView',
        name: 'personalView',
        component: personalView,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/scheduleList',
        name: 'scheduleList',
        component: scheduleList,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/memorandum',
        name: 'memorandum',
        component: memorandum,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/teamMemorandum',
        name: 'teamMemorandum',
        component: teamMemorandum,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/announcementBoard',
        name: 'announcementBoard',
        component: announcementBoard,
        meta: {
            keepAlive: true
        }
    },
    {
        path: '/memberList',
        name: 'memberList',
        component: memberList,
        meta: {
            keepAlive: true
        }
    },
]


const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    useKeepAliveStore().keepAlive = to.meta.keepAlive;
    next();
});

export default router