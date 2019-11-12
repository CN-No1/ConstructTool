<template>
  <div>
    <div>
      <div style="margin-bottom: 20px;">
        <el-tooltip class="item" effect="dark" content="所属领域" placement="top-start">
          <el-select
            v-model="moduleId"
            placeholder="请选择领域"
            @change="selectModule"
            :disabled="loading"
          >
            <el-option v-for="item in modules" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="状态" placement="top-start">
          <el-select
            v-model="statusCode"
            placeholder="请选择状态"
            @change="selectStatus"
            :disabled="loading"
          >
            <el-option v-for="item in status" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-tooltip>
        <div style="display: inline-block;">
          <el-tooltip class="item" effect="dark" content="模糊查询" placement="top-start">
            <el-input
              v-model="queryDocContent"
              placeholder="输入语料内容后回车"
              clearable
              @keyup.enter.native="getDocByParam"
            ></el-input>
          </el-tooltip>
        </div>
        <el-tooltip class="item" effect="dark" content="查询类型" placement="top-start">
          <el-select
            v-model="queryType"
            placeholder="请选择查询类型"
            @change="getDocByParam"
            :disabled="loading"
          >
            <el-option
              v-for="item in queryTypeOption"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-tooltip>
        <el-button size="medium" type="primary" @click="locate">定位</el-button>
      </div>
    </div>
    <el-row type="flex" style="min-height: 768px;" class="doc-list">
      <el-col :span="12">
        <el-table
          :data="tableData"
          border
          stripe
          style="width: 100%"
          v-loading="loading"
          highlight-current-row
          @row-click="clickRow"
        >
          <el-table-column label="语料内容" :formatter="docContent" align="center"></el-table-column>
          <el-table-column prop label="标注状态" align="center">
            <template slot-scope="scope">
              <el-tooltip
                class="item"
                effect="dark"
                content="未标注"
                placement="top-start"
                align="center"
              >
                <i v-if="scope.row.status === '0'" class="iconfont">&#xe600;</i>
              </el-tooltip>
              <el-tooltip
                class="item"
                effect="dark"
                content="已标注"
                placement="top-start"
                align="center"
              >
                <i v-if="scope.row.status === '1'" class="iconfont">&#xe68c;</i>
              </el-tooltip>
              <el-tooltip
                class="item"
                effect="dark"
                content="无法标注"
                placement="top-start"
                align="center"
              >
                <i v-if="scope.row.status === '2'" class="iconfont">&#xe6bc;</i>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagenation" :key="mainKey">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="page"
            :page-sizes="[10, 20, 30, 40]"
            :page-size="size"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
          ></el-pagination>
        </div>
      </el-col>
      <el-col :span="12" class="edit-area">
        <div v-if="isEdit" class="edit-form" v-loading="formLoading">
          <el-form ref="form" label-width="100px">
            <el-form-item label="语料内容">
              <div style="float:right;">
                <el-tooltip effect="dark" content="新建实例" placement="top-start" align="center">
                  <el-button
                    size="mini"
                    type="primary"
                    circle
                    icon="el-icon-plus"
                    @click="createInstance"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="editDoc.status!='2'"
                  effect="dark"
                  content="将此条数据设为无法标注"
                  placement="top-start"
                  align="center"
                >
                  <el-button
                    size="mini"
                    type="danger"
                    circle
                    icon="el-icon-minus"
                    @click="disableInstance()"
                    style="transform: rotate(45deg);"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="editDoc.status==='2'"
                  effect="dark"
                  content="将此条数据恢复为可标注"
                  placement="top-start"
                  align="center"
                >
                  <el-button
                    size="mini"
                    type="success"
                    circle
                    icon="el-icon-check"
                    @click="enableInstance()"
                  ></el-button>
                </el-tooltip>
                <el-tooltip effect="dark" content="跳转到NLU标注" placement="top-start" align="center">
                  <el-button
                    size="mini"
                    type="warning"
                    circle
                    icon="el-icon-s-promotion"
                    @click="gotoNLU"
                  ></el-button>
                </el-tooltip>
                <el-tooltip effect="dark" content="刷新关系树" placement="top-start" align="center">
                  <el-button
                    size="mini"
                    circle
                    icon="el-icon-refresh-left"
                    @click="getTreeByType(editDoc.moduleId,'3')"
                  ></el-button>
                </el-tooltip>
              </div>
              <annotator
                ref="annotator"
                :doc="editDoc.text"
                :entityPosition="editDoc.annotationList"
              ></annotator>
            </el-form-item>
            <el-form-item label="编辑实例">
              <template>
                <el-form ref="form" label-width="100px">
                  <el-form-item label="实例图名" class="coreThing">
                    <div style="width: 350px;margin-right: auto;">
                      <el-input v-model="instance.instanceName" @change="setEdit" readonly></el-input>
                    </div>
                  </el-form-item>
                  <el-form-item label="中心名称" class="coreThing">
                    <treeselect
                      v-model="instance.domain"
                      :multiple="false"
                      :open-on-focus="true"
                      :clear-on-select="true"
                      :close-on-select="true"
                      :options="domainList"
                      :searchable="true"
                      placeholder="请选择事件中心"
                      noOptionsText="具体模块未选择或此模块下未设置中心树"
                      @input="setEdit"
                    />
                  </el-form-item>
                  <el-form-item label="角色标注" class="relTreeCell">
                    <el-table
                      :data="instance.rangeList"
                      style="width: 100%"
                      max-height="450"
                      cell-class-name="intanceCell"
                    >
                      <el-table-column label="词汇" align="center">
                        <template slot-scope="{row}">
                          <span>{{row.content}}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="角色" align="center" width="250">
                        <template slot-scope="{row}">
                          <treeselect
                            v-model="row.relation"
                            :multiple="false"
                            :open-on-focus="true"
                            :clear-on-select="true"
                            :close-on-select="true"
                            :appendToBody="true"
                            :options="relList"
                            :searchable="true"
                            placeholder="请选择对应关系"
                            noOptionsText="具体模块未选择或此模块下未设置关系树"
                            @input="selectRelation(row)"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="实体" align="center">
                        <template slot-scope="{row}">
                          <span>{{row.role}}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="是否有效" align="center">
                        <template slot-scope="{row}">
                          <el-switch
                            v-model="row.status"
                            active-color="#13ce66"
                            inactive-color="#ff4949"
                            disabled
                          ></el-switch>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      style="float:right; margin-top:10px;"
                      type="primary"
                      @click="saveInstance"
                    >保存</el-button>
                    <el-button
                      style="float:right; margin-top:10px;"
                      plain
                      @click="previewGraph"
                    >实例图预览</el-button>
                  </el-form-item>
                </el-form>
              </template>
            </el-form-item>
            <el-form-item label="已创建实例">
              <template>
                <div style="padding-left:30px;">
                  <el-tag
                    v-for="(item,index) in editDoc.instanceList"
                    :key="item.domain"
                    @click="showInstanceDetail(item)"
                    style="cursor: pointer;margin-right:10px;"
                    closable
                    @close="deleteInstance(index)"
                  >{{item.instanceName}}</el-tag>
                </div>
              </template>
            </el-form-item>
          </el-form>
          <div class="dialog-wrapper">
            <el-dialog
              title="实例图"
              :visible.sync="instanceGraphVisible"
              width="30%"
              :before-close="handleClose"
              fullscreen
            >
              <div
                id="instanceGraph"
                ref="instanceGraph"
                style="width: 1280px;height: 760px;margin: auto;"
              ></div>
            </el-dialog>
          </div>
        </div>
        <div v-if="!isEdit" class="tips">
          <span>请点击一行进行编辑</span>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import ModuleModel from "@/api/model/ModuleModel";
import InstanceObject from "../../../api/model/InstanceObject";
import InstanceAPIImpl from "../../../api/impl/InstanceAPIImpl";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import Annotator from "@/components/Annotator.vue";
import { FlatToNested } from "@/util/tranformTreeData";
import RelationChart from "relation-chart";

@Component({ components: { Annotator, Treeselect } })
export default class Instance extends Vue {
  private tableData: InstanceObject[] = [];
  private modules: ModuleModel[] = [];
  private status: any[] = [
    {
      id: "",
      name: "全部"
    },
    {
      id: "0",
      name: "未标注"
    },
    {
      id: "1",
      name: "已标注"
    },
    {
      id: "2",
      name: "无法标注"
    }
  ];
  private queryTypeOption: any[] = [
    {
      id: "1",
      name: "语料查询"
    },
    {
      id: "2",
      name: "实体查询"
    }
  ];
  private queryType: string = "1";
  private moduleId: string = ""; // 领域Id
  private statusCode: string = ""; // 状态码
  private page: number = 1; // 当前页
  private size: number = 10; // 每页多少条
  private total: number = 100; // 总条数
  private loading = false; // 表格loading
  private formLoading = false; // 表单loading
  private isEdit = false; // 是否在编辑状态
  private editDoc: any = new InstanceObject(); // 编辑中文档对象
  private instanceAPI = new InstanceAPIImpl();
  private entityAPI = new EntityAPIImpl();
  private queryDocContent: string = ""; // 模糊查询文档内容
  private doneEdit: boolean = false; // 是否有修改
  private popoverVisible: boolean = false; // 确认框是否出现
  private domainList: any[] = []; // 中心树
  private relList: any[] = []; // 关系树
  private instance: any = { instanceName: "", domain: null, rangeList: [] }; // 编辑对象
  private instanceEdit: boolean = false; // 实例是否有修改
  private hashCode: number = 0; // 用于精确查询
  private mainKey: number = 0; // 强制重新渲染组件
  private instanceGraphData: any = { nodes: [], links: [] };
  private instanceGraphVisible: boolean = false; // 实例图预览

  private docContent(val: any) {
    if (val.text.length > 20) {
      return val.text.substr(0, 20).concat("...");
    }
    return val.text;
  }

  private mounted() {
    if (this.$route.params.hashCode) {
      this.hashCode = this.$route.params.hashCode as any;
    }
    this.getModule();
    this.getDocByParam();
  }

  private getModule() {
    // 获取module
    this.entityAPI.getModule().then(({ data }: any) => {
      this.modules = data;
      this.modules.unshift({ id: "", name: "全部" });
    });
  }

  private locate() {
    // 定位到上次编辑的位置
    // 获取localStroage值
    this.hashCode = 0;
    this.page = Number(localStorage.getItem("instancePageNum"));
    ++this.mainKey;
    this.getDocByParam();
  }

  private getDocByParam() {
    this.loading = true;
    // 根据条件查询文档
    this.instanceAPI
      .getDocByParam(
        this.moduleId,
        this.statusCode,
        this.queryDocContent,
        this.queryType,
        this.hashCode,
        this.page - 1,
        this.size
      )
      .then(({ data }) => {
        this.isEdit = data.content.length !== 0;
        this.total = data.totalElements;
        this.tableData = data.content;
        this.loading = false;
        if (this.isEdit) {
          this.clickRow(data.content[0]);
        }
      });
  }

  private handleSizeChange(val: any) {
    // 改变一页显示条数
    this.size = val;
    this.getDocByParam();
  }

  private handleCurrentChange(val: any) {
    // 翻页
    this.page = val;
    this.getDocByParam();
    // 设置localStroage值
    localStorage.setItem("instancePageNum", this.page.toString());
    this.getDocByParam();
  }

  private selectModule(val: any) {
    // 选择模块，获取文档和树
    this.page = 1;
    this.getDocByParam();
  }

  private getTreeByType(moduleId: string, type: string) {
    // 获取中心树,关系树数据
    this.formLoading = true;
    this.entityAPI.getTree(moduleId, type).then((res: any) => {
      if (res.data.length !== 0) {
        this.entityAPI.getClass(res.data[0].id).then(({ data }) => {
          switch (type) {
            case "2":
              this.domainList = FlatToNested(data);
              break;
            case "3":
              this.relList = FlatToNested(data);
              break;
          }
        });
      }
      this.formLoading = false;
    });
  }

  private selectStatus(val: any) {
    // 选择状态
    this.page = 1;
    this.getDocByParam();
  }

  private clickRow(row: any) {
    // 选中一行
    if (this.doneEdit) {
      this.$confirm("检测到未保存的内容，是否在离开前保存修改？", "确认信息", {
        distinguishCancelAndClose: true,
        confirmButtonText: "保存",
        cancelButtonText: "放弃修改"
      })
        .then(() => {
          this.getDocByParam();
          this.saveInstance();
        })
        .catch((action: any) => {
          if (action === "cancel") {
            return;
          }
        });
    }
    this.isEdit = true;
    this.editDoc = row;
    this.getTreeByType(row.moduleId, "2"); // 中心树
    this.getTreeByType(row.moduleId, "3"); // 关系树
    if (row.instanceList.length === 0) {
      this.instance.instanceName = "实例1";
      this.instance.domain = null;
      this.instance.rangeList = [];
      row.annotationList.forEach((item: any) => {
        const range = {
          content: item.value,
          relation: null,
          role: item.entity,
          status: false
        };
        this.instance.rangeList.push(range);
      });
    } else {
      this.instance = Object.assign(this.instance, row.instanceList[0]);
      this.instance.rangeList.sort((a: any, b: any) => {
        return b.status - a.status;
      });
    }
    this.instanceEdit = false;
  }

  private selectRelation(row: any) {
    // 选择关系
    if (row.relation) {
      row.status = true;
    } else {
      row.status = false;
    }
    this.instanceEdit = true;
  }

  private showInstanceDetail(instance: any) {
    // 编辑实例
    this.instance = Object.assign(this.instance, instance);
    this.instanceEdit = false;
  }

  private previewGraph() {
    // 预览实例图
    this.instanceGraphVisible = true;
    this.createInstanceGraph(this.instance);
  }

  private handleClose() {
    // 关闭对话框前清空svg
    const dom = document.getElementById("instanceGraph") as any;
    dom.innerText = "";
    this.instanceGraphVisible = false;
  }

  private createInstance() {
    // 新增实例
    if (this.instanceEdit) {
      this.$confirm("是否保存当前实例？", "确认信息", {
        distinguishCancelAndClose: true,
        confirmButtonText: "保存",
        cancelButtonText: "不保存"
      })
        .then(() => {
          this.saveInstance();
        })
        .catch(() => {
          // 不保存
          this.initInstance();
        });
    } else {
      this.initInstance();
    }
  }

  private setEdit() {
    // 实例内容有变化
    this.instanceEdit = true;
  }

  private initInstance() {
    // 初始化实例对象
    const index = this.editDoc.instanceList.length + 1;
    this.instance.instanceName = "实例" + index.toString();
    this.instance.domain = null;
    this.instance.rangeList = [];
    this.editDoc.annotationList.forEach((item: any) => {
      const range = {
        content: item.value,
        relation: null,
        role: item.entity,
        status: false
      };
      this.instance.rangeList.push(range);
    });
  }

  private saveInstance() {
    // 保存实例
    let flag = true; // 是否为新的实例
    if (!this.instance.domain) {
      this.$message.error("未选择事件中心！");
      return;
    }
    this.editDoc.instanceList.forEach((item: any) => {
      if (item.domain === this.instance.domain) {
        flag = false;
        item.rangeList = this.instance.rangeList;
      }
    });
    if (flag) {
      let temp: any = {};
      temp = Object.assign(temp, this.instance);
      this.editDoc.instanceList.push(temp);
    }
    this.instanceAPI.updateInstance(this.editDoc).then((res: any) => {
      this.$message({
        type: "success",
        message: "保存成功"
      });
      this.instanceAPI
        .getDocByParam(
          this.moduleId,
          this.statusCode,
          this.queryDocContent,
          this.queryType,
          this.hashCode,
          this.page - 1,
          this.size
        )
        .then(({ data }) => {
          this.tableData = data.content;
        });
      this.initInstance();
      this.instanceEdit = false;
    });
  }

  private deleteInstance(index: any) {
    // 删除实例
    this.$confirm("是否删除当前实例？", "确认信息", {
      distinguishCancelAndClose: true,
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    })
      .then(() => {
        this.editDoc.instanceList.splice(index, 1);
        this.instanceAPI.updateInstance(this.editDoc).then((res: any) => {
          this.$message({
            type: "success",
            message: "删除成功"
          });
          this.initInstance();
          this.getDocByParam();
          this.clickRow(this.editDoc);
        });
      })
      .catch(() => {
        // 不保存
      });
  }

  private gotoNLU() {
    // 跳转到NLU页面
    this.$router.push({
      name: "docList",
      params: { hashCode: this.editDoc.hashCode }
    });
  }

  private disableInstance() {
    // 设置失效状态
    this.editDoc.status = "2";
    this.instanceAPI.updateInstance(this.editDoc).then((res: any) => {
      this.$message({
        type: "success",
        message: "设置成功"
      });
      this.getDocByParam();
      this.clickRow(this.editDoc);
    });
  }

  private enableInstance() {
    // 设置生效状态
    this.editDoc.status = "0";
    this.instanceAPI.updateInstance(this.editDoc).then((res: any) => {
      this.$message({
        type: "success",
        message: "设置成功"
      });
      this.getDocByParam();
      this.clickRow(this.editDoc);
    });
  }

  private createInstanceGraph(instance: any) {
    // 创建实例图
    this.instanceGraphData.nodes = [];
    this.instanceGraphData.links = [];
    this.entityAPI.getClassesById(instance.domain).then(({ data }) => {
      this.instanceGraphData.nodes.push({ role_id: data.id, name: data.label });
      instance.rangeList.forEach((item: any, index: any) => {
        this.instanceGraphData.nodes.push({
          role_id: index,
          name: item.content
        });
        this.entityAPI.getClassesById(item.relation).then((res: any) => {
    debugger
          if (res.data) {
            const link = {
              source: 0,
              target: index + 1,
              relation: res.data.label,
              color: "734646"
            };
            this.instanceGraphData.links.push(link);
          }
        });
      });
    });
    setTimeout(() => {
      new RelationChart(this.$refs.instanceGraph, this.instanceGraphData);
    }, 1000);
  }

  private beforeRouteLeave(to: any, from: any, next: () => void) {
    // 离开页面前保存
    const ref = this.$refs.annotator as any;
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
          // save
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
.pagenation {
  text-align: center;
  padding-top: 30px;
}
.edit-area {
  padding: 20px;
  background-color: aliceblue;
  .tips {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: gray;
    font-size: 28px;
  }
}
.coreThing {
  padding-bottom: 20px;
  .vue-treeselect {
    width: 350px;
  }
}
.intanceCell {
  & > div {
    overflow: inherit !important;
  }
}
.dialog-wrapper {
  .el-dialog__headerbtn {
    transform: scale(3.5);
  }
}
@media screen and (max-width: 1600px) {
  .item {
    width: 120px;
  }
  .doc-list {
    width: 1280px;
  }
}
</style>
