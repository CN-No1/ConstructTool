<template>
  <div class="header" @click="closePop">
    <div>
      <div style="padding: 10px;">
        当前本体树：
        <el-tag>{{treeName}}</el-tag>
      </div>
      <div style="display:flex;">
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
        <el-button type="text" @click="output" style="margin-right: 10px;">导出数据</el-button>
        <el-upload
          action="/api/entity/parseJson"
          ref="upload"
          :show-file-list="false"
          :data="{treeId:treeId}"
          :on-error="uploadError"
          :on-success="uploadSuccess"
          :on-progress="uploadProcess"
        >
          <el-button slot="trigger" type="text">导入数据</el-button>
        </el-upload>
      </div>
    </div>
    <el-row v-loading="uploading" element-loading-text="导入中，请稍后">
      <el-col :span="8" v-loading="loading">
        <el-tree
          :key="mainKey"
          :data="entityClass"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleClick"
          @node-drop="nodeDrop"
          draggable
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>{{ node.label }}({{ data.useTimes }})</span>
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
      <el-col :span="14" v-show="formVisible" class="node-form">
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
            <el-table-column label="数据类型">
              <template slot-scope="{ row, column, $index }">
                <el-select v-model="row.propType" @change="selectType(row, $index)">
                  <el-option
                    v-for="item in dataTypeOption"
                    :key="item.id"
                    :label="item.label"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="属性值" width="450px;">
              <template slot-scope="{ row, column, $index }">
                <!-- 文本类型 -->
                <el-input v-if="row.propType==='5d50d8210b5f5a20f86a86ec'" v-model="row.propVal"></el-input>
                <!-- 数字类型 -->
                <div v-if="row.propType==='5d50d8210b5f5a20f86a86eb'" :key="mainKey">
                  <div style="display: flex; align-items: center;">
                    <el-input v-model="block[$index]" @blur="NumberValidate(row,$index)"></el-input>
                    <el-tooltip
                      class="item"
                      effect="dark"
                      content="开头结尾必须为英文()或英文[]，最大值最小值用英文,隔开，约定--代表负无穷，++代表正无穷。"
                      placement="top-end"
                    >
                      <i class="iconfont">&#xe60a;</i>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="单位" placement="top-end">
                      <el-input
                        v-model="unit[$index]"
                        style="width:200px;"
                        @blur="NumberValidate(row,$index)"
                      ></el-input>
                    </el-tooltip>
                  </div>
                  <div v-if="row.regTest" style="color:red;">填写有误，请根据规则填写！</div>
                </div>
                <!-- 枚举类型 -->
                <div class="tags" v-if="row.propType==='5d50d8210b5f5a20f86a86ea'">
                  <div :key="mainKey">
                    <el-tag
                      v-for="tag in row.tags"
                      :key="tag"
                      closable
                      @close="handleTagClose(row,tag)"
                    >{{tag}}</el-tag>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <el-input
                      :ref="'input'+$index"
                      v-model="tagVal[$index]"
                      @keyup.enter.native="addTag(row,$index)"
                    ></el-input>
                    <el-tooltip
                      class="item"
                      effect="dark"
                      content="键入后回车生成一个枚举标签"
                      placement="right"
                    >
                      <i class="iconfont">&#xe60a;</i>
                    </el-tooltip>
                  </div>
                </div>
                <!-- 日期类型 -->
                <span v-if="row.propType==='5d50d8210b5f5a20f86a86e9'">不需要输入</span>
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
        <el-button type="success" @click="save" style="margin-top: 30px;">保存</el-button>
      </el-col>
    </el-row>
    <el-dialog
      title="绑定信息"
      :visible.sync="bandingTableVisible"
      width="30%"
      border
      stripe
      :before-close="handleBandingTableClose"
    >
      <div>
        <el-table :data="bandingList" style="width: 100%" v-loading="bandingTableLoading">
          <el-table-column prop="text" label="绑定文本" align="center"></el-table-column>
          <el-table-column label="操作" align="center">
            <template slot-scope="{row}">
              <el-tooltip
                class="item"
                effect="dark"
                content="跳转到标注处"
                placement="top-start"
                align="center"
              >
                <el-button
                  size="mini"
                  type="warning"
                  circle
                  icon="el-icon-s-promotion"
                  @click="gotoAnnotation(row)"
                ></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import { getUUID } from "@/util/uuid";
import EntityClassNode, { PropRow } from "@/api/model/EntityClassModel";
import { NestedToFlat, FlatToNested } from "@/util/tranformTreeData";
import { getNowFormatDate } from "@/util/common";
import { saveAs } from "file-saver";

@Component({})
export default class Entity extends Vue {
  private treeId: string = ""; // 本体树id
  private treeName: string = ""; // 本体树名字
  private treeType: string = ""; // 本体树类型
  private formVisible: boolean = false; // 右侧表单是否显示
  private entityClass: EntityClassNode[] = [];
  private node: EntityClassNode = new EntityClassNode(); // 节点临时对象，用于动态修改树节点展示
  private doneEdit: boolean = false; // 页面是否有修改
  private entityAPI = new EntityAPIImpl();
  private loading: boolean = true;
  private propVisible: boolean = false; // 弹出框是否显示
  private newNode: string = ""; // 新增节点名
  private dataTypeOption: any[] = []; // 数据类型列表
  private tagVal: any[] = []; // 枚举型输入框
  private block: any[] = []; // 数字型区间输入框
  private unit: any[] = []; // 数字型单位输入框
  private mainKey: number = 0; // 强制刷新组件
  private uploading: boolean = false; // 导入文件loading
  private bandingList: any[] = []; // 绑定信息
  private bandingTableVisible: boolean = false; // 绑定信息对话框
  private bandingTableLoading: boolean = false; // 绑定信息加载

  private NumberValidate(row: any, index: any) {
    // 验证数字类型区间输入是否合法
    // 替换所有中文括号
    this.block[index] = this.block[index]
      .replace(/（/g, "(")
      .replace(/）/g, ")")
      .replace(/【/g, "[")
      .replace(/】/g, "]")
      .replace(/，/g, ",");
    // 开头结尾必须为英文()或英文[]，最大值最小值用英文,隔开，约定--代表负无穷，++代表正无穷。
    const reg = /^(\(|\[)(\-|\+)*\d*%?,(\-|\+)*\d*%?(\)|\])$/;
    row.regTest = !reg.test(this.block[index]);
    ++this.mainKey;
    row.propVal = this.block[index] + "&" + this.unit[index];
  }

  private mounted() {
    // 初始化
    this.treeId = this.$route.query.treeId as string;
    this.treeName = this.$route.query.treeName as string;
    this.treeType = this.$route.query.treeType as string;
    this.getTreeData();
    this.getDataType();
  }

  private getTreeData() {
    // 获取本体图数据
    this.loading = true;
    this.entityAPI.getClass(this.treeId).then(({ data }) => {
      this.entityClass = FlatToNested(data);
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
    let index = 0;
    data.propList.map((item: any) => {
      if (item.propType === "5d50d8210b5f5a20f86a86ea") {
        // 枚举型需转换为数组
        item.tags = item.propVal.split(",");
        this.tagVal[index] = "";
      } else if (item.propType === "5d50d8210b5f5a20f86a86eb") {
        // 数值型需拼接单位
        const tempArr = item.propVal.split("&");
        this.block[index] = tempArr[0];
        this.unit[index] = tempArr[1];
      }
      index++;
    });
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
        this.entityAPI.deleteClass(data.id).then((res: any) => {
          if (res.code !== 0) {
            this.$confirm("该实体已被绑定，请问要查看绑定的数据吗?", "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning"
            }).then(() => {
              this.bandingTableVisible = true;
              this.bandingTableLoading = true;
              this.entityAPI.getBandingList(data.id).then((res2: any) => {
                this.bandingTableLoading = false;
                this.bandingList = res2.data;
              });
            });
            return;
          } else {
            const parent = node.parent;
            const children = parent.data.children || parent.data;
            const index = children.findIndex((d: any) => d.id === data.id);
            children.splice(index, 1);
            this.formVisible = false;
            this.$message({
              type: "success",
              message: "删除成功!"
            });
          }
        });
      })
      .catch(() => {
        this.$message({
          type: "info",
          message: "已取消删除"
        });
      });
  }

  private handleBandingTableClose() {
    // 绑定信息对话框关闭
    this.bandingTableVisible = false;
    this.bandingList = [];
  }

  private gotoAnnotation(row: any) {
    // 跳转到标注处
    if (this.treeType === "0" || this.treeType === "1") {
      this.$router.push({
        name: "docList",
        params: { hashCode: row.hashCode }
      });
    } else {
      this.$router.push({
        name: "instance",
        params: { hashCode: row.hashCode }
      });
    }
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
    if (this.newNode === "") {
      this.$message.error("禁止添加空节点!");
      return;
    }
    const node: EntityClassNode = {
      id: getUUID(),
      label: this.newNode,
      description: "",
      propList: [],
      bandFlag: "0"
    };
    this.entityClass.unshift(node);
    this.doneEdit = true;
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

  private selectType(item: any, index: any) {
    // 选择数据类型(枚举型需要array)
    if (item.propType === "5d50d8210b5f5a20f86a86ea") {
      item.tags = [];
      this.tagVal[index] = "";
    } else if (item.propType === "5d50d8210b5f5a20f86a86eb") {
      // 数值类型需要单位
      this.block[index] = "";
      this.unit[index] = "";
    }
    item.propVal = "";
  }

  private addTag(row: any, index: any) {
    // 添加枚举
    if (this.tagVal[index] === "") {
      this.$message.error("请不要添加空值！");
      return;
    }
    if (row.tags.includes(this.tagVal[index])) {
      this.$message.error("请不要添加重复的值！");
      return;
    }
    if (row.propVal !== "") {
      row.propVal = row.propVal.concat("," + this.tagVal[index]);
    } else {
      row.propVal = this.tagVal[index];
    }
    this.tagVal[index] = "";
    row.tags = row.propVal.split(",");
    const inputRef = "input" + index;
    const input = this.$refs[inputRef] as any;
    input.focus();
    ++this.mainKey;
  }

  private handleTagClose(row: any, tag: any) {
    // 删除一个标签
    row.tags.splice(row.tags.indexOf(tag), 1);
    row.propVal = row.tags.join(",");
    ++this.mainKey;
  }

  private save() {
    // 保存实体树
    const flatData = NestedToFlat(this.entityClass, this.treeId);
    let dupLabel: any;
    let dupFlag = false; // 检查是否有重复的实体
    flatData.forEach((item: any) => {
      flatData.forEach((i: any) => {
        if (i.label === item.label && i.id !== item.id) {
          dupFlag = true;
          dupLabel = i;
        }
      });
    });
    if (dupFlag) {
      this.$message.error("存在多个实体(" + dupLabel.label + ")请删除后保存！");
      this.handleClick(dupLabel);
      return;
    }
    let flag = false; // 检查是否有填写错误的地方
    flatData.forEach((item: any) => {
      item.propList.forEach((element: any) => {
        if (element.regTest) {
          flag = true;
          this.$message.error("还有填写错误的地方！");
          this.handleClick(item);
          return;
        }
      });
    });
    if (flag) {
      return;
    }
    this.loading = true;
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
    // this.$router.push({
    //   name: "treeList",
    //   query: { moduleChecked: this.$route.query.moduleChecked }
    // });
    this.$router.go(-1);
  }

  private output() {
    // 导出数据
    this.$confirm("确认将当前数据导出为文件吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        const data = this.entityClass;
        const blob = new Blob([JSON.stringify(data)], { type: "" });
        saveAs(blob, "data" + getNowFormatDate() + ".json");
        this.$message({
          type: "success",
          message: "导出成功!"
        });
      })
      .catch(() => {
        this.$message({
          type: "info",
          message: "已取消"
        });
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

  private uploadSuccess() {
    // 上传成功钩子
    this.$message({
      type: "success",
      message: "导入成功"
    });
    this.uploading = false;
    this.getTreeData();
  }

  private uploadError() {
    // 文件上传失败
    this.$message({
      type: "error",
      message: "服务器异常"
    });
    this.uploading = false;
  }

  private uploadProcess(event: any) {
    // 上传进度
    if (event.percent === 100) {
      this.uploading = true;
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
