<template>
  <div class="header" @click="closePop">
    <div>
      <el-popover ref="popover" placement="bottom" width="160" trigger="manual" v-model="propVisible">
        <el-input ref="newNode" v-model="newNode" @keyup.enter.native="addTopNode" placeholder="回车键快速添加"></el-input>
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
          :data="dataTypeTree"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleClick"
          draggable
        >
          <span class="custom-tree-node" slot-scope="{ node }">
            <span>{{ node.label }}</span>
            <!-- <span>
              <el-button
                type="text"
                size="mini"
                @click.stop="() => remove(node, data)"
                icon="el-icon-delete"
              ></el-button>
            </span> -->
          </span>
        </el-tree>
      </el-col>
      <el-col :span="14" v-show="formVisible" class="node-form">
        <div class="node-name">
          <span>节点名称:</span>
          <el-input
            ref="nodeName"
            v-model="node.label"
            @input="editNode"
            @focus="inputFocus($event)"
          ></el-input>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import DataTypeModel from "@/api/model/DataTypeModel";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";

@Component({
  components: {}
})
export default class DataType extends Vue {
  private formVisible: boolean = false;
  private dataTypeTree: DataTypeModel[] = [];
  private node: DataTypeModel = { label: "" };
  private doneEdit: boolean = false; // 页面是否有修改
  private entityAPI = new EntityAPIImpl();
  private loading: boolean = true;
  private propVisible: boolean = false;
  private newNode: string = "";

  private mounted() {
    // 初始化
    this.getDataType();
  }

  private getDataType() {
    // 获取数据类型树
    this.entityAPI.getDataType().then(({ data }) => {
      if (data) {
        this.dataTypeTree = data;
      }
      this.loading = false;
    });
  }

  private handleClick(data: any) {
    // 点击节点
    this.node = data;
    this.formVisible = true;
    const input = this.$refs.nodeName as any;
    input.focus();
  }

  private inputFocus(e: any) {
    // input获取焦点自动选中
    e.currentTarget.select();
  }

  private remove(node: any, data: any) {
    // 删除当前节点
    const parent = node.parent;
    const children = parent.data.children || parent.data;
    const index = children.findIndex((d: any) => d.id === data.id);
    children.splice(index, 1);
    this.formVisible = false;
  }

  private showPop() {
    this.propVisible = true;
    const input = this.$refs.newNode as any;
    input.focus();
  }

  private closePop() {
    this.propVisible = false;
    this.newNode = "";
  }

  private addTopNode() {
    // 新增顶层节点
    const node = { label: this.newNode };
    this.dataTypeTree.unshift(node);
    this.doneEdit = true;
    this.propVisible = false;
    this.newNode = "";
  }

  private editNode(val: any) {
    // 编辑节点
    this.node.label = val;
    this.doneEdit = true;
  }

  private save() {
    // 保存数据类型树
    this.loading = true;
    this.entityAPI.creatOrUpdateDataType(this.dataTypeTree).then(({ data }) => {
      this.loading = false;
      this.doneEdit = false;
      this.formVisible = false;
      this.$message({
        type: "success",
        message: "保存成功!"
      });
      this.getDataType();
    });
  }

  private beforeRouteLeave(to: any, from: any, next: () => void) {
    // 离开页面前保存
    if (this.doneEdit) {
      this
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
</style>
