<template>
  <div>
    <div>
      <span>当前领域：</span>
      <el-tag style="margin-right: 10px;">{{moduleChecked.name}}</el-tag>
      <span>树类型：</span>
      <el-tag
        :key="tag.id"
        v-for="tag in treeTypeList"
        :closable="tag.id!=='0'&&tag.id!=='1'&&tag.id!=='2'&&tag.id!=='3'"
        :disable-transitions="false"
        @close="deleteTreeType(tag.id)"
      >{{tag.label}}</el-tag>
      <el-input
        class="input-new-tag"
        v-if="inputVisible"
        v-model="newTreeType"
        ref="saveTagInput"
        size="small"
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
            <div @dblclick="showCellInput(scope.$index)">
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
        <el-table-column prop="name" label="类型">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.treeType"
              placeholder="请选择"
              @change="saveTreeChange(scope)"
            >
              <el-option
                v-for="item in treeTypeList"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              ></el-option>
            </el-select>
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
import TreeType from "../../api/model/TreeType";

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
  private treeType: string = "0"; // 新增的树类型
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
    this.getTreeType();
  }

  private getTree() {
    // 获取树列表
    this.loading = true;
    this.api.getTree(this.moduleChecked.id).then(({ data }) => {
      this.treeList = data;
      this.loading = false;
    });
  }

  private getTreeType() {
    // 获取树列表
    this.api.getTreeType().then(({ data }) => {
      this.treeTypeList = data;
    });
  }

  private createTree() {
    // 新增树
    const treeModel: TreeModel = {
      name: this.newName,
      moduleId: this.moduleChecked.id,
      treeType: this.treeType
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

  private newTree() {
    // 新增树框打开
    this.dialogVisible = true;
  }

  private saveTreeChange(scope: any) {
    // 保存对树的修改
    ++this.mainKey;
    this.editable[scope.$index] = false;
    const temp = scope.row;
    if (
      temp.treeType === "1" ||
      temp.treeType === "2" ||
      temp.treeType === "3"
    ) {
      this.treeList.forEach((item: any) => {
        if (item.id !== temp.id && item.treeType === temp.treeType) {
          let type;
          switch (temp.treeType) {
            case "1":
              type = "意图";
            case "2":
              type = "中心";
            case "3":
              type = "关系";
          }
          this.$confirm(
            "已有" + type + "树，确认把当前树作为新的" + type + "树吗？",
            "提示",
            {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning"
            }
          )
            .then(() => {
              item.treeType = "0";
              this.api.createOrUpdateTree(item).then(({ code }) => {
                // todo
              });
              this.api.createOrUpdateTree(temp).then(({ code }) => {
                this.$message({
                  type: "success",
                  message: "修改成功!"
                });
              });
            })
            .catch(() => {
              this.getTree();
              return;
            });
        }
      });
    } else {
      this.api.createOrUpdateTree(scope.row).then(({ code }) => {
        this.$message({
          type: "success",
          message: "修改成功!"
        });
      });
    }
  }

  private showCellInput(index: number) {
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
            this.getTree();
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

  private deleteTreeType(id: string) {
    // 删除树类型
    this.api.deleteTreeType(id).then((res: any) => {
      this.$message({
        type: "success",
        message: "已删除"
      });
      this.getTreeType();
    });
  }

  private addTreeType() {
    // 新增树类型
    this.treeTypeList.forEach((item: any) => {
      if (item.label === this.newTreeType) {
        this.$message.error("请勿添加重复的类型！");
        this.newTreeType = "";
        return;
      }
    });
    if (this.newTreeType) {
      const treeType: TreeType = {
        label: this.newTreeType
      };
      this.api.createTreeType(treeType).then((res: any) => {
        this.$message({
          type: "success",
          message: "新增成功"
        });
        this.getTreeType();
        this.newTreeType = "";
      });
    }
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
