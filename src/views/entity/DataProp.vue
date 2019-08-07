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
          :data="dataProp.dataPropList"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleClick"
          draggable
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>{{ node.label }}</span>
            <span>
              <el-button
                type="text"
                size="mini"
                @click.stop="() => append(data)"
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
          <p>节点名称:</p>
          <el-input
            ref="nodeName"
            v-model="node.label"
            @input="editNode"
            @focus="inputFocus($event)"
          ></el-input>
        </div>
        <div class="treeselect">
          <treeselect
            v-model="node.entityClass"
            valueFormat="object"
            :multiple="true"
            :options="entityList"
            :searchable="true"
            :sort-value-by="sortValueBy"
            :flat="true"
            placeholder="请选择实体类"
          />
        </div>
        <div class="data-type">
          <el-select v-model="node.dataType" placeholder="请选择数据类型">
            <el-option
              v-for="(item,index) in dataTypeList"
              :key="index"
              :label="item.label"
              :value="item.label"
            ></el-option>
          </el-select>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import Treeselect from "@riophae/vue-treeselect";
import DataPropModel, { DataPropNode } from "@/api/model/DataPropModel";
import { getUUID } from "@/util/uuid";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import { FlatToNested } from "@/util/tranformTreeData";

@Component({ components: { Treeselect } })
export default class DataProp extends Vue {
  private formVisiable: boolean = false;
  private dataProp: DataPropModel = new DataPropModel(); // 数据属性对象
  private dataTypeList: any[] = []; // 数据类型列表
  private node: DataPropNode = { label: "", entityClass: [], dataType: "" }; // 被选中的节点
  private moduleId: string = "5d2fe2f28eb1330dcc8f46bd"; // 选中moduleId
  private modules: any[] = []; // module下拉数据
  private entityList: any[] = []; // 实体类树
  private sortValueBy: string = "LEVEL"; // 选项排序方式（"ORDER_SELECTED"，"LEVEL"，"INDEX"）
  private entityAPI = new EntityAPIImpl();
  private doneEdit: boolean = false; // 页面是否有修改
  private loading: boolean = true;
  private visible: boolean = false;
  private newNode: string = "";
  private myThis: any = this;

  private mounted() {
    // 初始化
    this.getModule();
    this.getDataProp();
    this.getEntityList();
    this.getDataTypeList();
    this.dataProp.moduleId = this.moduleId;
  }

  private getModule() {
    // 获取module
    this.entityAPI.getModule().then(({ data }) => {
      this.modules = data;
    });
  }

  private selectmodule(val: string) {
    this.dataProp.moduleId = val;
    // 选择module查找class
    this.getDataProp();
    this.getEntityList();
    this.getDataTypeList();
  }

  private getDataProp() {
    // 获取对象属性
    this.entityAPI.getDataProp(this.moduleId).then(({ data }) => {
      if (data) {
        this.dataProp = data;
      }
    });
  }

  private getEntityList() {
    // 获取实体类树
    this.entityAPI.getClass(this.moduleId).then(({ data }) => {
      if (data) {
        this.entityList = FlatToNested(data);
      }
    });
  }

  private getDataTypeList() {
    // 获取数据类型list
    this.entityAPI.getDataType().then(({ data }) => {
      if (data) {
        this.dataTypeList = data;
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

  private append(data: any) {
    // 新增子节点
    const newChild: DataPropNode = {
      id: getUUID(),
      label: "空节点",
      entityClass: [],
      dataType: ""
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
    const node: DataPropNode = {
      id: getUUID(),
      label: this.newNode,
      entityClass: [],
      dataType: ""
    };
    this.dataProp.dataPropList.unshift(node);
    this.doneEdit = true;
    this.visible = false;
    this.newNode = "";
  }

  private editNode(val: any) {
    // 编辑节点名字
    this.node.label = val;
    this.doneEdit = true;
  }

  private save() {
    // 保存数据属性树
    this.loading = true;
    this.entityAPI.creatOrUpdateDataProp(this.dataProp).then(({ data }) => {
      this.loading = false;
      this.doneEdit = false;
      this.formVisiable = false;
      this.myThis.$message({
        type: "success",
        message: "保存成功!"
      });
      this.getDataProp();
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
.treeselect {
  width: 217px;
  padding-bottom: 20px;
}
.data-type {
  width: 217px;
}
</style>
