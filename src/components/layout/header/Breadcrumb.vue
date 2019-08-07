<template>
  <el-breadcrumb separator-class="el-icon-arrow-right">
    <el-breadcrumb-item :to="{ name: 'home' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-for="(item,index) in menuList" :key="index">{{item}}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script lang="ts">
import { Vue, Prop, Watch, Inject, Component } from "vue-property-decorator";

@Component({ components: {} })
export default class Breadcrumb extends Vue {
  private menuList: any[] = [];

  @Watch("$route.path", { immediate: true, deep: true })
  private router(newVal: object, oldVal: object) {
    // 实现路由导航
    this.menuList = [];
    this.$route.matched.forEach((item) => {
      if (item.name !== "home") {
        this.menuList.push(item.meta.menuName);
      }
    });
  }
}
</script>

<style lang="less" scoped>
</style>
