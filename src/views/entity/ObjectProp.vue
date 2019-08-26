<template>
  <div class="header" @click="closePop">
    <div>
      <div style="padding: 10px;">
        当前本体树：
        <el-tag>{{treeName}}</el-tag>
      </div>
      <el-popover
        ref="popover"
        placement="bottom"
        width="160"
        trigger="manual"
        v-model="propVisible"
      >
        <el-input
          ref="newNode"
          v-model="newNode"
          @keyup.enter.native="addTopNode"
          placeholder="回车键快速添加"
        ></el-input>
        <div style="text-align: right; margin: 0;padding-top:5px;">
          <el-button size="mini" type="danger" @click="closePop">取消</el-button>
          <el-button type="primary" size="mini" @click="addTopNode">确定</el-button>
        </div>
        <el-button slot="reference" @click.stop="showPop" type="primary">新增顶层节点</el-button>
      </el-popover>
      <el-button type="success" @click="save">保存</el-button>
      <el-button type="info" @click="goBack">返回</el-button>
    </div>
    <el-row>
      <el-col :span="8" v-loading="loading">
        <el-tree
          :data="objectProp.objectPropList"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleClick"
          @node-drop="nodeDrop"
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
        <div class="add-rel">
          <span>关系:</span>
          <el-button size="mini" type="success" @click="addOneRelationship" icon="el-icon-plus"></el-button>
        </div>
        <div class="treeselect" v-for="(item,index) in node.relation" :key="index">
          <treeselect
            v-model="item.domain"
            :multiple="false"
            :open-on-focus="true"
            :clear-on-select="true"
            :close-on-select="true"
            :options="entityList"
            :searchable="true"
            placeholder="请选择Domain"
          />
          <treeselect
            v-model="item.range"
            :multiple="false"
            :open-on-focus="true"
            :clear-on-select="true"
            :close-on-select="true"
            :options="entityList"
            :searchable="true"
            placeholder="请选择Range"
          />
          <el-button
            size="mini"
            type="danger"
            @click="removeOneRelationship(index)"
            icon="el-icon-delete"
          ></el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import ObjectPropModel, {
  ObjectPropNode,
  Relation
} from "@/api/model/ObjectPropModel";
import { getUUID } from "@/util/uuid";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import { FlatToNested } from "@/util/tranformTreeData";

@Component({ components: { Treeselect } })
export default class ObjectProp extends Vue {
  private treeName: string = ""; // 本体树名字
  private formVisible: boolean = false; // 右侧表单是否显示
  private objectProp: ObjectPropModel = new ObjectPropModel();
  private entityList: any[] = []; // 实体类树
  private node: ObjectPropNode = {
    label: "",
    relation: [{ domain: "", range: "" }]
  }; // 被选中的节点
  private moduleId: string = ""; // 选中moduleId
  private modules: any[] = []; // module下拉数据
  private sortValueBy: string = "LEVEL"; // 选项排序方式（"ORDER_SELECTED"，"LEVEL"，"INDEX"）
  private doneEdit: boolean = false; // 页面是否有修改
  private entityAPI = new EntityAPIImpl();
  private loading: boolean = true;
  private propVisible: boolean = false; // prop是否出现
  private newNode: string = ""; // 新增节点名

  private mounted() {
    // 初始化
    this.objectProp.treeId = this.$route.params.treeId;
    this.treeName = this.$route.params.treeName;
    this.getObjectProp();
    this.getEntityList();
  }

  private getObjectProp() {
    // 获取数据属性
    this.entityAPI.getObjectProp(this.objectProp.treeId).then(({ data }) => {
      if (data) {
        this.objectProp = data;
      }
      this.loading = false;
    });
  }

  private getEntityList() {
    // 获取实体类树
    this.entityAPI.getClass(this.objectProp.treeId).then(({ data }) => {
      if (data) {
        this.entityList = FlatToNested(data);
      }
    });
  }

  private handleClick(data: ObjectPropNode) {
    // 点击树节点
    this.node = data;
    this.formVisible = true;
    const input = this.$refs.nodeName as any;
    input.focus();
  }

  private inputFocus(e: any) {
    // input获取焦点自动选中
    e.currentTarget.select();
  }

  private append(data: any) {
    // 添加子节点
    const newChild: ObjectPropNode = {
      id: getUUID(),
      label: "空节点",
      relation: []
    };
    if (!data.children) {
      this.$set(data, "children", []);
    }
    data.children.unshift(newChild);
    this.formVisible = true;
    this.node = newChild;
    const input = this.$refs.nodeName as any;
    input.focus();
    this.doneEdit = true;
  }

  private remove(node: any, data: any) {
    // 删除当前节点
    if (data.children && data.children.length > 0) {
      this.$message({
        type: "error",
        message: "该节点有子节点，不可删除！"
      });
      return;
    }
    this.$confirm("确认删除吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        const parent = node.parent;
        const children = parent.data.children || parent.data;
        const index = children.findIndex((d: any) => d.id === data.id);
        children.splice(index, 1);
        this.formVisible = false;
        this.$message({
          type: "success",
          message: "删除成功!"
        });
        this.doneEdit = true;
      })
      .catch(() => {
        this.$message({
          type: "info",
          message: "已取消删除"
        });
      });
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
    const node: ObjectPropNode = {
      id: getUUID(),
      label: this.newNode,
      relation: []
    };
    this.objectProp.objectPropList.unshift(node);
    this.doneEdit = true;
    this.propVisible = false;
    this.newNode = "";
  }

  private editNode(val: any) {
    // 动态修改节点名称
    this.node.label = val;
    this.doneEdit = true;
  }

  private addOneRelationship() {
    // 新增一条关系
    const rel: Relation = { domain: "", range: "" };
    this.node.relation.push(rel);
  }

  private removeOneRelationship(index: number) {
    // 删除当前关系
    this.node.relation.splice(index, 1);
  }

  private save() {
    // 保存关系属性树
    this.loading = true;
    this.entityAPI.creatOrUpdateObjectProp(this.objectProp).then(({ data }) => {
      this.loading = false;
      this.doneEdit = false;
      this.formVisible = false;
      this.$message({
        type: "success",
        message: "保存成功!"
      });
      this.getObjectProp();
    });
  }

  private goBack() {
    // 返回列表页
    this.$router.push({
      name: "treeList",
      params: { moduleChecked: this.$route.params.moduleChecked }
    });
  }

  private beforeRouteLeave(to: any, from: any, next: () => void) {
    // 离开页面前保存
    if (this.doneEdit) {
      this.$confirm(
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

  private nodeDrop() {
    // 拖动节点
    this.doneEdit = true;
  }
}
</script>

<style lang="less" scoped>
@import "~less/tree-form";
.add-rel {
  span {
    padding-right: 20px;
  }
}
.treeselect {
  display: flex;
  justify-content: space-around;
  width: 500px;
  padding: 15px;
}
</style>
