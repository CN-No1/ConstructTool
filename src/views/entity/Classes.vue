<template>
  <div class="header" @click="closePop">
    <div>
      <el-popover
        ref="popover"
        placement="bottom"
        width="160"
        trigger="manual"
        v-model="propVisible"
      >
        <el-input ref="newNode" v-model="newNode" @keyup.enter.native="addTopNode"></el-input>
        <div style="text-align: right; margin: 0;padding-top:5px;">
          <el-button size="mini" type="danger" @click="closePop">取消</el-button>
          <el-button type="primary" size="mini" @click="addTopNode">确定</el-button>
        </div>
        <el-button slot="reference" @click.stop="showPop" type="primary">新增顶层节点</el-button>
      </el-popover>
      <el-button type="success" @click="save">保存</el-button>
      <el-button type="info" @click="goBack">返回</el-button>
      <!-- <el-button type="text" @click="output" style="float:right;">导出数据</el-button> -->
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
      <el-col :span="16" v-show="formVisible" class="node-form">
        <!-- <el-col :span="16" v-show="formVisible" class="node-form"> -->
        <div class="node-name">
          <span>节点名称:</span>
          <el-input
            ref="nodeName"
            v-model="node.label"
            @input="editNodeName"
            @focus="inputFocus($event)"
          ></el-input>
        </div>
        <div class="prop-tabel">
          <el-table :data="node.propList" style="width: 100%" empty-text="请添加属性">
            <el-table-column label="属性名">
              <template slot-scope="{row}">
                <el-input v-model="row.propName"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="属性值">
              <template slot-scope="{row}">
                <!-- 文本类型 -->
                <el-input v-if="row.propType==='5d50d8210b5f5a20f86a86ec'" v-model="row.propVal"></el-input>
                <!-- 数字类型 -->
                <el-input v-if="row.propType==='5d50d8210b5f5a20f86a86eb'" v-model="row.propVal"></el-input>
                <!-- 枚举类型 -->
                <div class="tags" v-if="row.propType==='5d50d8210b5f5a20f86a86ea'" :key="mainKey">
                  <div>
                    <el-tag
                      v-for="tag in row.tags"
                      :key="tag"
                      closable
                      @close="handleTagClose(row,tag)"
                    >{{tag}}</el-tag>
                  </div>
                  <div>
                    <el-input v-model="tagVal" @keyup.enter.native="addTag(row)"></el-input>
                  </div>
                </div>
                <!-- 日期类型 -->
                <span v-if="row.propType==='5d50d8210b5f5a20f86a86e9'">不需要输入</span>
              </template>
            </el-table-column>
            <el-table-column label="数据类型">
              <template slot-scope="{row}">
                <el-select v-model="row.propType" @change="selectType(row)">
                  <el-option
                    v-for="item in dataTypeOption"
                    :key="item.id"
                    :label="item.label"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template slot-scope="{$index}">
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  circle
                  size="mini"
                  @click="deleteOneRow($index)"
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div style="text-align:center;margin-top:10px;">
          <el-button type="success" icon="el-icon-plus" circle size="mini" @click="addOneRow"></el-button>
        </div>
        <div class="text-area">
          <span>备注:</span>
          <el-input
            type="textarea"
            placeholder="对节点的备注"
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
import EntityClassNode, { PropRow } from "@/api/model/EntityClassModel";
import { NestedToFlat, FlatToNested } from "@/util/tranformTreeData";
import InputTag from "vue-input-tag";

@Component({ components: { InputTag } })
export default class Entity extends Vue {
  private treeId: string = "";
  private formVisible: boolean = false; // 右侧表单是否显示
  private entityClass: EntityClassNode[] = [];
  private node: EntityClassNode = new EntityClassNode(); // 节点临时对象，用于动态修改树节点展示
  private doneEdit: boolean = false; // 页面是否有修改
  private entityAPI = new EntityAPIImpl();
  private loading: boolean = true;
  private propVisible: boolean = false; // 弹出框是否显示
  private newNode: string = ""; // 新增节点名
  private dataTypeOption: any[] = []; // 数据类型列表
  private tagVal: string = ""; // 枚举型输入框
  private mainKey: number = 0; // 强制刷新组件

  private propValFmt(val: string) {
    if (val === "") {
      return [];
    }
    return val.split(",");
  }

  private mounted() {
    // 初始化
    this.treeId = this.$route.params.treeId;
    this.getTreeData();
    this.getDataType();
  }

  private getTreeData() {
    // 获取本体图数据
    this.loading = true;
    this.entityAPI.getClass(this.treeId).then(({ data }) => {
      this.entityClass = data;
      this.loading = false;
    });
  }

  private getDataType() {
    // 获取数据类型下拉框
    this.entityAPI.getDataType().then(({ data }) => {
      this.dataTypeOption = data;
    });
  }

  private handleClick(data: any) {
    // 点击节点编辑
    this.node = data;
    this.formVisible = true;
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
    // 动态修改树节点备注
    this.node.description = val;
    this.doneEdit = true;
  }

  private append(node: any, data: any) {
    // 新增子节点
    const newChild: EntityClassNode = {
      id: getUUID(),
      label: "空节点",
      description: "",
      bandFlag: "0",
      propList: []
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
        this.entityAPI.deleteClass(data.id).then(() => {
          const parent = node.parent;
          const children = parent.data.children || parent.data;
          const index = children.findIndex((d: any) => d.id === data.id);
          children.splice(index, 1);
          this.formVisible = false;
          this.$message({
            type: "success",
            message: "删除成功!"
          });
        });
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
    const node: EntityClassNode = {
      id: getUUID(),
      label: this.newNode,
      description: "",
      propList: [],
      bandFlag: "0"
    };
    this.entityClass.unshift(node);
    this.doneEdit = true;
    this.propVisible = false;
    this.newNode = "";
  }

  private addOneRow() {
    // 新增一行属性
    const len = this.node.propList.length;
    if (len > 0 && this.node.propList[len - 1].propName === "") {
      this.$message.error("请先填写完整上一行！");
      return;
    }
    const prop: PropRow = {
      propName: "",
      propVal: "",
      propType: "5d50d8210b5f5a20f86a86ec"
    };
    this.node.propList.push(prop);
    this.doneEdit = true;
  }

  private deleteOneRow(idx: any) {
    // 删除一行属性
    this.$confirm("确认删除吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        this.node.propList.splice(idx, 1);
        this.doneEdit = true;
        this.$message({
          type: "success",
          message: "删除成功!"
        });
      })
      .catch(() => {
        this.$message({
          type: "info",
          message: "已取消删除"
        });
      });
  }

  private selectType(item: any) {
    // 选择数据类型(枚举型需要array)
    if (item.propType === "5d50d8210b5f5a20f86a86ea") {
      item.tags = [];
    }
  }

  private addTag(row: any) {
    // 添加枚举
    if (this.tagVal === "") {
      this.$message.error("请不要添加空值！");
      return;
    }
    if (row.tags.includes(this.tagVal)) {
      this.$message.error("请不要添加重复的值！");
      return;
    }
    if (row.propVal !== "") {
      row.propVal = row.propVal.concat("," + this.tagVal);
    } else {
      row.propVal = this.tagVal;
    }
    this.tagVal = "";
    row.tags = row.propVal.split(",");
  }

  private handleTagClose(row: any, tag: any) {
    // 删除一个标签
    row.tags.splice(row.tags.indexOf(tag), 1);
    row.propVal = row.tags.join(",");
    ++this.mainKey;
  }

  private save() {
    // 保存实体树
    this.loading = true;
    const flatData = NestedToFlat(this.entityClass, this.treeId);
    this.entityAPI.creatOrUpdateClass(flatData).then(({ data }) => {
      this.loading = false;
      this.doneEdit = false;
      this.formVisible = false;
      this.$message({
        type: "success",
        message: "保存成功!"
      });
    });
  }

  private goBack() {
    // 返回列表页
    this.$router.push({
      name: "moduleList",
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
.tags {
  border: 1px solid #f9f9f9;
  border-radius: 5px;
}
</style>
