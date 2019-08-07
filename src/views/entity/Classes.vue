<template>
  <div class="header" @click="closePop">
    <div>
      <el-select v-model="moduleId" placeholder="请选择模块" @change="selectmodule" :disabled="loading">
        <el-option v-for="item in modules" :key="item.id" :label="item.name" :value="item.id"></el-option>
      </el-select>
      <el-popover ref="popover" placement="bottom" width="160" trigger="manual" v-model="visible">
        <el-input ref="newNode" v-model="newNode"></el-input>
        <div style="text-align: right; margin: 0;padding-top:5px;">
          <el-button size="mini" type="danger" @click="closePop">取消</el-button>
          <el-button type="primary" size="mini" @click="addTopNode">确定</el-button>
        </div>
        <el-button slot="reference" @click.stop="showPop" type="primary">新增顶层节点</el-button>
      </el-popover>
      <el-button type="success" @click="save">保存</el-button>
    </div>
    <el-row>
      <el-col :span="8" v-loading="loading">
        <el-tree
          :data="entityClass"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleClick"
          draggable
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span v-if="!node.flag">{{ node.label }}</span>
            <!-- <el-input class="tree-input" v-model="node.label" v-if="node.flag"></el-input>
            <el-button size="mini" type="primary" v-if="node.flag" @click="node.flag = false">确认</el-button>-->
            <span>
              <el-button
                type="text"
                size="mini"
                @click.stop="() => append(node, data)"
                icon="el-icon-plus"
              ></el-button>
              <el-button
                type="text"
                size="mini"
                @click.stop="() => remove(node, data)"
                icon="el-icon-delete"
              ></el-button>
            </span>
          </span>
        </el-tree>
      </el-col>
      <el-col :span="16" v-show="formVisiable" class="node-form">
        <div class="node-name">
          <span>节点名称:</span>
          <el-input
            ref="nodeName"
            v-model="node.label"
            @input="editNodeName"
            @focus="inputFocus($event)"
          ></el-input>
        </div>
        <div class="text-area">
          <span>描述:</span>
          <el-input
            type="textarea"
            placeholder="对节点的描述"
            :rows="5"
            v-model="node.description"
            @input="editNodeDesc"
            @focus="inputFocus($event)"
          ></el-input>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import { getUUID } from "@/util/uuid";
import EntityClassNode from "@/api/model/EntityClassModel";
import { NestedToFlat, FlatToNested } from "@/util/tranformTreeData";

@Component({})
export default class Entity extends Vue {
  private formVisiable: boolean = false;
  private entityClass: EntityClassNode[] = [];
  private node: EntityClassNode = { label: "", description: "" }; // 节点临时对象，用于动态修改树节点展示
  private moduleId: string = "5d2fe2f28eb1330dcc8f46bd"; // 选中moduleId
  private modules: any[] = []; // module下拉数据
  private doneEdit: boolean = false; // 页面是否有修改
  private entityAPI = new EntityAPIImpl();
  private loading: boolean = true;
  private visible: boolean = false;
  private newNode: string = "";
  private myThis: any = this;

  private mounted() {
    // 初始化
    this.getModule();
    this.getClass();
  }

  private selectmodule(val: string) {
    // 选择module查找class
    this.getClass();
  }

  private getModule() {
    // 获取module
    this.entityAPI.getModule().then(({ data }: any) => {
      this.modules = data;
    });
  }

  private getClass() {
    // 获取实体类
    this.entityAPI.getClass(this.moduleId).then(({ data }) => {
      if (data) {
        this.entityClass = FlatToNested(data);
      }
      this.loading = false;
    });
  }

  private handleClick(data: any) {
    // 点击节点编辑
    this.node = data;
    this.formVisiable = true;
    const input = this.$refs.nodeName as any;
    input.focus();
  }

  private inputFocus(e: any) {
    // input获取焦点自动选中
    e.currentTarget.select();
  }

  private editNodeName(val: any) {
    // 动态修改树节点显示
    this.node.label = val;
    this.doneEdit = true;
  }

  private editNodeDesc(val: any) {
    // 动态修改树节点描述
    this.node.description = val;
    this.doneEdit = true;
  }

  private append(node: any, data: any) {
    // 新增子节点
    const newChild: any = {
      id: getUUID(),
      label: "空节点",
      description: "",
      bandFlag: "0",
      flag: true
    };
    if (!data.children) {
      this.$set(data, "children", []);
    }
    data.children.unshift(newChild);
    this.formVisiable = true;
    this.node = newChild;
    const input = this.$refs.nodeName as any;
    input.focus();
    this.doneEdit = true;
  }

  private remove(node: any, data: any) {
    // 删除当前节点

    if (data.children) {
      this.myThis.$message({
        type: "error",
        message: "该节点有子节点，不可删除！"
      });
      return;
    }
    this.myThis
      .$confirm("确认删除吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
      .then(() => {
        const parent = node.parent;
        const children = parent.data.children || parent.data;
        const index = children.findIndex((d: any) => d.id === data.id);
        children.splice(index, 1);
        this.formVisiable = false;
        this.myThis.$message({
          type: "success",
          message: "删除成功!"
        });
        this.doneEdit = true;
      })
      .catch(() => {
        this.myThis.$message({
          type: "info",
          message: "已取消删除"
        });
      });
  }

  private showPop() {
    this.visible = true;
    const input = this.$refs.newNode as any;
    input.focus();
  }

  private closePop() {
    this.visible = false;
    this.newNode = "";
  }

  private addTopNode() {
    // 新增顶层节点
    const node: EntityClassNode = {
      id: getUUID(),
      label: this.newNode,
      description: "",
      bandFlag: "0"
    };
    this.entityClass.unshift(node);
    this.doneEdit = true;
    this.visible = false;
    this.newNode = "";
  }

  private save() {
    // 保存实体树
    this.loading = true;
    const flatData = NestedToFlat(this.entityClass, this.moduleId);
    this.entityAPI.creatOrUpdateClass(flatData).then(({ data }) => {
      this.loading = false;
      this.doneEdit = false;
      this.formVisiable = false;
      this.myThis.$message({
        type: "success",
        message: "保存成功!"
      });
      this.getClass();
    });
  }

  private beforeRouteLeave(to: any, from: any, next: () => void) {
    // 离开页面前保存
    if (this.doneEdit) {
      this.myThis
        .$confirm(
          "检测到未保存的内容，是否在离开页面前保存修改？",
          "确认信息",
          {
            distinguishCancelAndClose: true,
            confirmButtonText: "保存",
            cancelButtonText: "放弃修改"
          }
        )
        .then(() => {
          this.save();
          next();
        })
        .catch((action: any) => {
          if (action === "cancel") {
            next();
          }
        });
    } else {
      next();
    }
  }
}
</script>

<style lang="less" scoped>
@import "~less/tree-form";
.text-area {
  width: 300px;
  & > span:first-child {
    display: block;
    margin-block-end: 15px;
  }
}
</style>
