<template>
  <div v-loading="uploading" element-loading-text="导入中，请稍后">
    <div class="header">
      <div>
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
        <el-tooltip class="item" effect="dark" content="标注状态" placement="top-start">
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
              placeholder="输入文档内容后回车"
              @keyup.enter.native="getDocByParam"
            ></el-input>
          </el-tooltip>
        </div>
        <el-button size="medium" type="primary" @click="openUpload">导入文件</el-button>
        <div style="float: right;" v-if="moduleId !== ''">
          <el-select
            v-model="treeId"
            placeholder="请选择本体树"
            @change="selectTree"
            :disabled="loading"
            no-data-text="请先选择具体领域"
          >
            <el-option
              v-for="item in treeOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
          </el-select>
        </div>
      </div>
    </div>
    <el-row type="flex">
      <el-col :span="12">
        <el-table
          :data="tableData"
          border
          stripe
          style="width: 100%"
          v-loading="loading"
          @row-click="clickRow"
        >
          <el-table-column prop="content" label="文章内容" :formatter="docContent" align="center"></el-table-column>
          <el-table-column prop="moduleName" label="用途" align="center">
            <template slot-scope="scope">
              <el-tag close-transition>{{scope.row.purpose}}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop label="标注状态" :formatter="statusFmt" align="center">
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
            </template>
          </el-table-column>
          <el-table-column label="操作" class="icons" align="center">
            <template slot-scope="scope">
              <el-tooltip
                class="item"
                effect="dark"
                content="删除"
                placement="top-start"
                align="center"
              >
                <span>
                  <i @click.stop="deleteDoc(scope.row.id)" class="iconfont">&#xe602;</i>
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagenation">
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
        <div v-show="isEdit" class="edit-form">
          <annotate ref="annotator" :editDoc="editDoc" :treeId="treeId" @doneSave="doneSave"></annotate>
        </div>
        <div v-show="!isEdit" class="tips">
          <span>请点击一行进行编辑</span>
        </div>
      </el-col>
    </el-row>
    <el-dialog title="上传文件" :visible.sync="dialogVisible" width="30%" :before-close="handleClose">
      <el-form ref="form" label-width="100px">
        <el-form-item label="所属领域：">
          <el-select v-model="uploadForm.newModuleId" placeholder="请选择领域">
            <el-option v-for="item in modules" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="用途：">
          <el-input placeholder="请输入用途" v-model="uploadForm.newPurpose"></el-input>
        </el-form-item>
      </el-form>
      <el-upload
        action="/api/annotation/parseJson"
        ref="upload"
        :data="uploadForm"
        :on-success="uploadSuccess"
        :on-progress="uploadProcess"
        :before-upload="beforeUpload"
        :auto-upload="false"
      >
        <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
        <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload">上传</el-button>
      </el-upload>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import AnnotationAPIImpl from "@/api/impl/AnnotationAPIImpl";
import ModuleModel from "@/api/model/ModuleModel";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import Annotate from "./Annotate.vue";
import NLUEntity from "@/api/model/NLUEntity";
@Component({
  components: { Annotate }
})
export default class DocList extends Vue {
  private tableData: NLUEntity[] = [];
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
    }
  ];
  private moduleId: string = ""; // 领域Id，默认为道路交通
  private statusCode: string = ""; // 状态码
  private page: number = 1; // 当前页
  private size: number = 10; // 每页多少条
  private total: number = 100; // 总条数
  private loading = false; // 表格loading
  private isEdit = false; // 是否在编辑状态
  private editDoc = new NLUEntity(); // 编辑中文档对象
  // private dialogVisible: boolean = false; // 对话框
  // private textarea: string = ""; // 新增文档内容
  private annotationAPI = new AnnotationAPIImpl();
  private entityAPI = new EntityAPIImpl();
  private videoUploadPercent: number = 0; // 文件上传进度
  private dialogVisible: boolean = false; // 文件上传框
  private uploadForm: any = { newModuleId: "", newPurpose: "" }; // 上传表单对象
  private newModuleId: string = ""; // 新增文档领域id
  private newPurpose: string = ""; // 新增文档的用途
  private uploading: boolean = false; // 导入文件loading
  private treeOptions: any[] = []; // 树下拉选项
  private treeId: string = ""; // 选中的树id
  private queryDocContent: string = ""; // 模糊查询文档内容

  private docContent(val: any) {
    if (val.content.length > 20) {
      return val.content.substr(0, 20).concat("...");
    }
    return val.content;
  }
  private statusFmt(val: any) {
    switch (val.status) {
      case "0":
        return "未标注";
      case "1":
        return "已标注";
    }
  }

  private mounted() {
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

  private getDocByParam() {
    this.loading = true;
    // 根据条件查询文档
    this.annotationAPI
      .getDocByParam(
        this.moduleId,
        this.statusCode,
        this.queryDocContent,
        this.page - 1,
        this.size
      )
      .then(({ data }) => {
        this.total = data.totalElements;
        this.tableData = data.content;
        this.loading = false;
        this.editDoc = data.content[0];
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
  }

  private selectModule(val: any) {
    // 选择模块，获取文档和树
    this.page = 1;
    this.getDocByParam();
    this.getTrees(val);
  }

  private getTrees(moduleId: string) {
    // 获取树下拉框选项
    this.entityAPI.getTree(moduleId).then(({ data }) => {
      this.treeOptions = data;
    });
  }

  private selectTree(val: any) {
    // 选中树，获取本体
  }

  private selectStatus(val: any) {
    // 选择状态
    this.page = 1;
    this.getDocByParam();
  }

  private clickRow(row: any) {
    // 选中一行
    const ref = this.$refs.annotator as any;
    if (ref.doneEdit) {
      this.$confirm("检测到未保存的内容，是否在离开前保存修改？", "确认信息", {
        distinguishCancelAndClose: true,
        confirmButtonText: "保存",
        cancelButtonText: "放弃修改"
      })
        .then(() => {
          ref.saveAll();
          this.getDocByParam();
          this.editDoc = row;
          this.isEdit = true;
        })
        .catch((action: any) => {
          if (action === "cancel") {
            this.editDoc = row;
            this.isEdit = true;
          }
        });
    } else {
      this.editDoc = row;
      this.isEdit = true;
    }
  }

  private doneSave() {
    // 组件内保存
    this.getDocByParam();
  }

  private submitUpload() {
    // 手动上传文件
    const upload = this.$refs.upload as any;
    upload.submit();
  }

  private handleClose() {
    // 关闭新增对话框
    this.newPurpose = "";
    this.newModuleId = "";
    this.dialogVisible = false;
  }

  private openUpload() {
    // 打开文件上传对话框
    this.dialogVisible = true;
  }

  private uploadSuccess() {
    // 上传成功钩子
    this.$message({
      type: "success",
      message: "导入成功"
    });
    this.page = 1;
    this.uploading = false;
    this.getDocByParam();
  }

  private uploadProcess(event: any) {
    // 上传进度
    if (event.percent === 100) {
      this.dialogVisible = false;
      this.uploading = true;
    }
  }

  private deleteDoc(id: string) {
    // 删除文档
    this.$confirm("此操作将永久删除该条数据, 是否继续?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        this.annotationAPI.deleteNLUDoc(id).then(({ data }) => {
          this.getDocByParam();
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

  private beforeUpload() {
    // 上传前钩子
    if (
      this.uploadForm.newModuleId !== "" &&
      this.uploadForm.newPurpose !== ""
    ) {
      return true;
    } else {
      this.$message.error("请填写完整！");
      return false;
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
.doc-list {
  display: flex;
  .doc-list-left {
    flex-grow: 1;
  }
  .doc-list-right {
    width: 100%;
  }
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
</style>
