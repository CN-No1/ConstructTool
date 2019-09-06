<template>
  <section style="height:100%;">
    <el-menu
      :default-active="defaultActive"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      style="height:100%;"
    >
      <side-bar-item v-for="(item, index) in sideMenu" :key="index" :item="item"></side-bar-item>
      <div style="position: absolute; bottom: 0;" v-if="!isCollapse">
        <a
          target="_blank"
          href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=32011402010504"
          style="display: inline-block; text-decoration: none; height: 20px;
          line-height: 20px; color: white; font-size: 10px; text-align: center;"
        >
          <p>苏公网安备 32011402010504号</p>
        </a>
      </div>
    </el-menu>
  </section>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject, Watch } from "vue-property-decorator";
import SideBarItem from "./SideBarItem.vue";
@Component({
  components: { SideBarItem }
})
export default class SideBar extends Vue {
  @Prop(Boolean)
  private isCollapse: boolean = false;
  private defaultActive: string = "home";
  private sideMenu: any[] = [];
  private mounted() {
    this.getSideMenu();
  }
  private getSideMenu() {
    // console.log(this.$router);
    const router = this.$router as any;
    this.sideMenu = router.options.routes;
  }
  @Watch("$route.path", { immediate: true, deep: true })
  private router(newVal: object, oldVal: object) {
    // 实现默认选中
    const ro = this.$route as any;
    this.defaultActive = ro.name;
  }
}
</script>
