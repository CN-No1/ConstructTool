<template>
  <div>
    <div style="margin-bottom: 30px;">
      <el-button type="success" @click="newModule">新增领域</el-button>
    </div>
    <div class="module-list" v-loading="loading">
      <el-row type="flex">
        <el-col :span="6" v-for="(item, index) in moduleList" :key="index">
          <el-card
            :body-style="{ padding: '15px', textAlign: 'center' }"
            shadow="hover"
            :key="mainKey"
          >
            <img src="../../assets/module.png" class="image" @click="showTreeList(item)" />
            <div style="padding: 14px;">
              <el-tooltip class="item" effect="dark" content="双击来修改模块名字" placement="top">
                <span
                  style="line-height: 45px;"
                  @dblclick="showInput(item)"
                  v-if="!item.editMode"
                >{{item.name}}</span>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="点击其他地方完成修改" placement="top">
                <el-input v-model="item.name" @blur="saveModuleChange(item)" v-if="item.editMode"></el-input>
              </el-tooltip>
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
    <el-dialog
      title="新增模块"
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
        <el-button type="primary" @click="createModule">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import EntityAPIImpl from "../../api/impl/EntityAPIImpl";
import ModuleModel from "../../api/model/ModuleModel";
import TreeModel from "../../api/model/TreeModel";

@Component({
  components: {}
})
export default class ModuleList extends Vue {
  private moduleList: any[] = []; // 领域列表
  private treeList: any[] = []; // 树列表
  private showTable: boolean = false; // 表格是否展示
  private api = new EntityAPIImpl(); // api接口
  private editable: any[] = []; // 单行是否可编辑
  private mainKey: number = 0; // 强制重新渲染组件
  private dialogVisible: boolean = false; // 对话框是否展示
  private newName: string = ""; // 新增的名字
  private loading: boolean = true;
  private activeNames: any[] = []; // 折叠展开

  private mounted() {
    // 初始化
    this.getModule();
  }

  private getModule() {
    // 获取领域列表
    this.loading = true;
    this.api.getModule().then(({ data }) => {
      this.moduleList = data;
      this.moduleList.map((item: any) => {
        item.editMode = false;
      });
      this.loading = false;
    });
  }

  private newModule() {
    // 新增领域框打开
    this.dialogVisible = true;
  }

  private createModule() {
    // 新增领域
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
    this.showTable = true;
    this.$router.push({ name: "treeList", params: { moduleChecked: i } });
  }

  private handleClose() {
    // 关闭对话框
    this.newName = "";
    this.dialogVisible = false;
  }

}
</script>

<style lang="less" scoped>
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
