import { createApp } from 'vue'
import './assets/styles/global.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router/index.js'
import {createPinia} from "pinia";
import * as ElementPlusIconsVue from '@element-plus/icons-vue'



const pinia = createPinia();

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(ElementPlus);
app.use(router);
app.use(pinia);
app.mount('#app')