<template>
  <div>
    <div style="margin-bottom: 30px;" v-if="!showTable">
      <el-button type="success" @click="newModule">新增领域</el-button>
    </div>
    <div v-if="moduleChecked.name!=''">
      <span>当前领域：</span>
      <el-tag closable @close="handleTagClose()">{{moduleChecked.name}}</el-tag>
    </div>
    <div class="module-list" v-if="!showTable" v-loading="loading">
      <el-row type="flex">
        <el-col :span="6" v-for="(item, index) in moduleList" :key="index">
          <el-card
            :body-style="{ padding: '15px', textAlign: 'center' }"
            shadow="hover"
            :key="mainKey"
          >
            <img src="../../assets/module.png" class="image" @click="showTreeList(item)" />
            <div style="padding: 14px;">
              <span
                style="line-height: 45px;"
                @dblclick="showInput(item)"
                v-if="!item.editMode"
              >{{item.name}}</span>
              <el-input v-model="item.name" @blur="saveModuleChange(item)" v-if="item.editMode"></el-input>
              <div class="bottom clearfix">
                <el-collapse v-model="activeNames">
                  <el-collapse-item title="更多操作" :name="item.name">
                    <el-button
                      type="danger"
                      icon="el-icon-delete"
                      circle
                      @click="deleteModule(item.id)"
                    ></el-button>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    <div v-if="showTable" style="margin:20px 0 20px 0;">
      <el-button type="success" @click="newTree">新增树</el-button>
    </div>
    <div class="tree-table" v-if="showTable">
      <el-table :data="treeList" style="width: 100%" :key="mainKey" v-loading="loading">
        <el-table-column prop="name" label="名称">
          <template slot-scope="scope">
            <div @dblclick="editCell(scope.$index)">
              <el-input
                v-if="editable[scope.$index]"
                v-model="scope.row.name"
                style="width:20%;"
                @blur="saveTreeChange(scope)"
              ></el-input>
              <span v-else>{{scope.row.name}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-tooltip
              class="item"
              effect="dark"
              content="编辑关系"
              placement="top-start"
              align="center"
            >
              <i class="iconfont" @click="editRel(scope.row.id)">&#xe752;</i>
            </el-tooltip>
            <el-tooltip
              class="item"
              effect="dark"
              content="编辑本体"
              placement="top-start"
              align="center"
            >
              <i class="iconfont" @click="editEntity(scope.row.id)">&#xe7a5;</i>
            </el-tooltip>
            <el-tooltip
              class="item"
              effect="dark"
              content="删除"
              placement="top-start"
              align="center"
            >
              <i class="iconfont" @click="deleteTree(scope.row.id)">&#xe602;</i>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose"
    >
      <el-form label-width="80px" @submit.native.prevent>
        <el-form-item label="名称">
          <el-input v-model="newName"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="createModuleOrTree">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import EntityAPIImpl from "../../api/impl/EntityAPIImpl";
import ModuleModel from "../../api/model/ModuleModel";
import TreeModel from "../../api/model/TreeModel";

@Component({
  components: {}
})
export default class DataType extends Vue {
  private moduleList: any[] = []; // 领域列表
  private treeList: any[] = []; // 树列表
  private showTable: boolean = false; // 表格是否展示
  private moduleChecked: any = { id: "", name: "" };
  private api = new EntityAPIImpl(); // api接口
  private editable: any[] = []; // 单行是否可编辑
  private mainKey: number = 0; // 强制重新渲染组件
  private dialogVisible: boolean = false; // 对话框是否展示
  private dialogTitle: string = ""; // 对话框标题
  private newName: string = ""; // 新增的名字
  private flag: number = 0; // 区分新增的是树还是领域，0：领域 1：树
  private loading: boolean = true;
  private activeNames: any[] = [];

  private mounted() {
    // 初始化
    this.getModule();
    if (this.$route.params.moduleChecked) {
      this.moduleChecked = this.$route.params.moduleChecked;
      this.getTree();
    }
  }

  private getModule() {
    // 获取领域列表
    this.loading = true;
    this.api.getModule().then(({ data }) => {
      this.moduleList = data;
      this.moduleList.map((item) => {
        item.editMode = false;
      });
      this.loading = false;
    });
  }

  private getTree() {
    // 获取树列表
    this.showTable = true;
    this.loading = true;
    this.api.getTree(this.moduleChecked.id).then(({ data }) => {
      this.treeList = data;
      this.loading = false;
    });
  }

  private newModule() {
    // 新增领域框打开
    this.dialogVisible = true;
    this.dialogTitle = "新增领域";
    this.flag = 0;
  }

  private createModuleOrTree() {
    // 新增领域或树
    if (this.flag) {
      const treeModel: TreeModel = {
        name: this.newName,
        moduleId: this.moduleChecked.id
      };
      this.handleClose();
      this.api.createOrUpdateTree(treeModel).then(({ data }) => {
        this.$message({
          type: "success",
          message: "新增成功!"
        });
        this.getTree();
      });
    } else {
      const moduleModel: ModuleModel = {
        name: this.newName
      };
      this.handleClose();
      this.api.createOrUpdateModule(moduleModel).then(({ code }) => {
        if (code === 0) {
          this.$message({
            type: "success",
            message: "新增成功!"
          });
        }
        this.getModule();
      });
    }
  }

  private deleteModule(id: string) {
    // 删除领域
    this.$confirm("确认删除吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        this.api.deleteModule(id).then(({ code }) => {
          if (code === 0) {
            this.$message({
              type: "success",
              message: "删除成功!"
            });
          }
          this.getModule();
        });
      })
      .catch(() => {
        this.$message({
          type: "info",
          message: "已取消删除"
        });
      });
  }

  private showInput(i: any) {
    // 开启编辑
    ++this.mainKey;
    i.editMode = true;
  }

  private saveModuleChange(i: any) {
    // 保存领域修改
    ++this.mainKey;
    i.editMode = false;
    this.api.createOrUpdateModule(i).then(({ code }) => {
      this.$message({
        type: "success",
        message: "修改成功!"
      });
    });
  }

  private showTreeList(i: any) {
    // 查看领域树列表
    this.moduleChecked = Object.assign(this.moduleChecked, i);
    this.getTree();
  }

  private handleTagClose() {
    // 重新选择领域
    this.showTable = false;
    this.moduleChecked.name = "";
  }

  private newTree() {
    // 新增树框打开
    this.dialogVisible = true;
    this.dialogTitle = "新增树";
    this.flag = 1;
  }

  private saveTreeChange(scope: any) {
    // 保存对树的修改
    ++this.mainKey;
    this.editable[scope.$index] = false;
    this.api.createOrUpdateTree(scope.row).then(({ code }) => {
      this.$message({
        type: "success",
        message: "修改成功!"
      });
    });
  }

  private editCell(index: number) {
    // 编辑树的名字
    ++this.mainKey;
    this.editable[index] = true;
  }

  private deleteTree(id: string) {
    // 删除树
    this.$confirm("确认删除吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        this.api.deleteTree(id).then(({ code }) => {
          if (code === 0) {
            this.$message({
              type: "success",
              message: "删除成功!"
            });
          }
        });
        this.getTree();
      })
      .catch(() => {
        this.$message({
          type: "info",
          message: "已取消删除"
        });
      });
  }

  private handleClose() {
    // 关闭对话框
    this.newName = "";
    this.dialogVisible = false;
  }

  private editRel(id: string) {
    // 编辑关系
    this.$router.push({
      name: "objectProp",
      params: { treeId: id, moduleChecked: this.moduleChecked }
    });
  }

  private editEntity(id: string) {
    // 编辑实体
    this.$router.push({
      name: "classes",
      params: { treeId: id, moduleChecked: this.moduleChecked }
    });
  }

}
</script>

<style lang="less" scoped>
.el-tag {
  height: 40px;
  line-height: 40px;
  font-size: 16px;
}
.image {
  cursor: pointer;
}
.el-row--flex {
  flex-wrap: wrap;
}
.el-card {
  margin: 14px;
}
</style>
