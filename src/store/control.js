import {defineStore} from "pinia";


export const useKeepAliveStore = defineStore("keepAlive",{
    state() {
        return {
            keepAlive: false
        }
    }
});