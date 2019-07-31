import Vue from "vue";
import Router from "vue-router";
import InnerLayout from "./components/layout/InnerLayout.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "home",
      meta: { menuName: "首页", iconClass: "&#xe604;" },
      component: () => import("./views/Home.vue"),
    },
    {
      path: "/entity",
      name: "entity",
      meta: { menuName: "实体", iconClass: "&#xe75d;" },
      component: InnerLayout,
      redirect: "/entity/classes",
      children: [
        {
          path: "classes",
          name: "classes",
          meta: { menuName: "实体类", iconClass: "" },
          component: () => import("./views/entity/Classes.vue"),
        },
        {
          path: "objectProp",
          name: "objectProp",
          meta: { menuName: "对象属性", iconClass: "" },
          component: () => import("./views/entity/ObjectProp.vue"),
        },
        {
          path: "dataProp",
          name: "dataProp",
          meta: { menuName: "数据属性", iconClass: "" },
          component: () => import("./views/entity/DataProp.vue"),
        },
        {
          path: "dataType",
          name: "dataType",
          meta: { menuName: "数据类型", iconClass: "" },
          component: () => import("./views/entity/DataType.vue"),
        },
      ],
    },
    {
      path: "/annotation",
      name: "annotation",
      meta: { menuName: "标注", iconClass: "&#xe673;" },
      component: InnerLayout,
      redirect: "/annotation/uploadFile",
      children: [
        {
          path: "docList",
          name: "docList",
          meta: { menuName: "NLU", iconClass: "" },
          component: () => import("./views/annotation/annotate/DocList.vue"),
        },
        {
          path: "docList-admin",
          name: "docList-admin",
          meta: { menuName: "管理员界面", iconClass: "", style: "display:none" },
          component: () => import("./views/annotation/annotate/DocListAdmin.vue"),
        },
      ],
    },
  ],
});
