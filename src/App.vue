<template>
  <div>
    <el-container v-if="keepAlive">
      <el-container style="height: 100vh; width: 100vw;background-color: #FAFAFB;">
        <el-aside style="width: 250px; height: 100%">
          <!-- 侧边栏 -->
          <keep-alive>
            <Left></Left>
          </keep-alive>
        </el-aside>
        <el-container style="height: 100%">
          <el-header
              style="background-color: #fafafb; border-bottom: 1px solid #ddd;display: flex; align-items: center; justify-content: space-between;">
            <div>
            </div>
            <div>
              <UserDropdown/>
            </div>
          </el-header>
          <el-main style="padding: 0; height: calc(100vh - 60px);">
            <router-view ></router-view>
          </el-main>
        </el-container>
      </el-container>
      <FloatingAddButton v-if="keepAlive" />
      <FoucTimer v-if="keepAlive" />
    </el-container>

    <!-- 登录页 -->
    <router-view v-if="!keepAlive"></router-view>
  </div>
</template>

<script setup>

import Left from "./components/Left.vue";
import UserDropdown from './components/UserDropdown.vue';
import FloatingAddButton from './components/FloatingAddButton.vue';
import {ref, watch} from "vue";
import {useKeepAliveStore} from "./store/control.js";
import FoucTimer from "./components/FocusTimer.vue";

const keepAliveStore = useKeepAliveStore();

const keepAlive = ref(false);

watch(() => keepAliveStore.keepAlive ,(newValue) => {
  console.log(newValue);
  keepAlive.value = newValue;
},{immediate:true});

</script>