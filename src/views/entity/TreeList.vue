<template>
  <div>
    <div>
      <span>当前领域：</span>
      <el-tag style="margin-right: 10px;">{{moduleChecked.name}}</el-tag>
      <span>树类型：</span>
      <el-tag
        :key="tag"
        v-for="tag in treeTypeList"
        closable
        :disable-transitions="false"
        @close="deleteTreeType(tag)"
      >{{tag.label}}</el-tag>
      <el-input
        class="input-new-tag"
        v-if="inputVisible"
        v-model="newTreeType"
        ref="saveTagInput"
        size="small"
        @keyup.enter.native="addTreeType"
        @blur="addTreeType"
      ></el-input>
      <el-button v-else class="button-new-tag" size="small" @click="showTreeTypeInput">+ 新增类型</el-button>
    </div>
    <div style="margin:20px 0 20px 0;">
      <el-button type="success" @click="newTree">新增树</el-button>
      <el-button type="info" @click="goBack">返回</el-button>
    </div>
    <div class="tree-table">
      <el-table :data="treeList" style="width: 100%" :key="mainKey" v-loading="loading">
        <el-table-column prop="name" label="名称">
          <template slot-scope="scope">
            <div @dblclick="editCell(scope.$index)">
              <el-tooltip class="item" effect="dark" content="点击其他地方完成修改" placement="top">
                <el-input
                  v-if="editable[scope.$index]"
                  v-model="scope.row.name"
                  style="width:20%;"
                  @blur="saveTreeChange(scope)"
                ></el-input>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="双击来修改树的名字" placement="top">
                <span v-if="!editable[scope.$index]">{{scope.row.name}}</span>
              </el-tooltip>
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
              <i class="iconfont" @click="editRel(scope.row)">&#xe752;</i>
            </el-tooltip>
            <el-tooltip
              class="item"
              effect="dark"
              content="编辑本体"
              placement="top-start"
              align="center"
            >
              <i class="iconfont" @click="editEntity(scope.row)">&#xe7a5;</i>
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
    <el-dialog title="新增树" :visible.sync="dialogVisible" width="30%" :before-close="handleClose">
      <el-form label-width="80px" @submit.native.prevent>
        <el-form-item label="名称">
          <el-input v-model="newName"></el-input>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="treeType" placeholder="请选择">
            <el-option
              v-for="item in treeTypeList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="createTree">确 定</el-button>
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
export default class TreeList extends Vue {
  private treeList: any[] = []; // 树列表
  private moduleChecked: any = { id: "", name: "" };
  private api = new EntityAPIImpl(); // api接口
  private editable: any[] = []; // 单行是否可编辑
  private mainKey: number = 0; // 强制重新渲染组件
  private dialogVisible: boolean = false; // 对话框是否展示
  private newName: string = ""; // 新增的名字
  private treeType: string = ""; // 新增的树类型
  private loading: boolean = true;
  private treeTypeList: any[] = []; // 树类型列表
  private inputVisible: boolean = false; // 新增树类型输入框
  private newTreeType: string = ""; // 新增树类型名字

  private mounted() {
    // 初始化
    if (this.$route.params.moduleChecked) {
      this.moduleChecked = this.$route.params.moduleChecked;
      this.getTree();
    }
  }

  private getTree() {
    // 获取树列表
    this.loading = true;
    this.api.getTree(this.moduleChecked.id).then(({ data }) => {
      this.treeList = data;
      this.loading = false;
    });
  }

  private createTree() {
    // 新增领域或树
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

  private newTree() {
    // 新增树框打开
    this.dialogVisible = true;
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

  private editRel(row: any) {
    // 编辑关系
    this.$router.push({
      name: "objectProp",
      params: {
        treeId: row.id,
        moduleChecked: this.moduleChecked,
        treeName: row.name
      }
    });
  }

  private editEntity(row: any) {
    // 编辑实体
    this.$router.push({
      name: "classes",
      params: {
        treeId: row.id,
        moduleChecked: this.moduleChecked,
        treeName: row.name
      }
    });
  }

  private goBack() {
    // 返回列表页
    this.$router.push({ name: "moduleList" });
  }

  private deleteTreeType(treeType: any) {
    // 删除树类型
  }

  private addTreeType() {
    // 新增树类型
    this.inputVisible = false;
  }

  private showTreeTypeInput() {
    // 显示树类型新增框
    this.inputVisible = true;
  }
}
</script>

<style lang="less" scoped>
.el-tag + .el-tag {
  margin-left: 10px;
}
.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}
</style>
