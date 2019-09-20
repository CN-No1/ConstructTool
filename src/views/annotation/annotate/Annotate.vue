<template>
  <el-form ref="form" label-width="100px" v-loading="loading">
    <el-form-item label="语料内容">
      <div style="float:right;">
        <el-tooltip
          class="item"
          effect="dark"
          content="跳转到实例创建"
          placement="top-start"
          align="center"
        >
          <el-button
            size="mini"
            type="warning"
            circle
            icon="el-icon-s-promotion"
            @click="gotoInstance"
          ></el-button>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="刷新本体树" placement="top-start" align="center">
          <el-button
            size="mini"
            circle
            icon="el-icon-refresh-left"
            @click="getEntityList(treeId)"
          ></el-button>
        </el-tooltip>
      </div>
      <annotator
        ref="annotator"
        :doc="doc.content"
        :entityPosition="doc.annotationList"
        @getRangeData="getRangeData"
        @addLabel="addLabel"
        @showDetail="showDetail"
      ></annotator>
    </el-form-item>
    <el-form-item label="实体标注">
      <div class="annotator" v-if="seletedWord" style="padding-left:30px;">
        <b style="color:red;">{{text}}</b>
        <treeselect
          v-model="entityArr"
          valueFormat="object"
          :multiple="true"
          :options="entityList"
          :searchable="true"
          :sort-value-by="sortValueBy"
          :flat="true"
          noOptionsText="本体树未选择或本体树中无数据"
          placeholder="请选择文本所属实体"
        />
        <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="save">确 定</el-button>
        </span>
      </div>
    </el-form-item>
    <el-form-item label="已标注">
      <div style="padding-left:30px;">
        <el-table
          :data="doc.annotationList"
          style="width: 100%"
          :header-cell-style="rowStyle"
          :row-style="rowStyle"
        >
          <el-table-column prop="value" label="文本" width="180"></el-table-column>
          <el-table-column prop="entity" label="关联实体" width="180"></el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button type="danger" icon="el-icon-delete" circle @click="deleteRow(scope.row)"></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form-item>
    <el-form-item label="意图">
      <div style="line-height: 25px;padding-left:30px;">
        <treeselect
          v-model="doc.intention"
          valueFormat="object"
          :multiple="true"
          :options="intentionList"
          :searchable="true"
          :sort-value-by="sortValueBy"
          :flat="true"
          placeholder="请选择意图"
          noOptionsText="模块未选择或模块下无意图树"
        />
      </div>
    </el-form-item>
    <el-form-item>
      <el-button type="success" @click="saveAll()" style="margin-left:30px;">保存</el-button>
      <!-- <el-button @click="prev()">上一个</el-button>
      <el-button @click="next()">下一个</el-button>-->
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import Annotator from "@/components/Annotator.vue";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import AnnotationModel, { Position } from "@/api/model/AnnotationModel";
import AnnotationAPIImpl from "@/api/impl/AnnotationAPIImpl";
import EntityAPIImpl from "@/api/impl/EntityAPIImpl";
import NLUEntity from "@/api/model/NLUEntity";
import { Annotation } from "@/api/model/NLUEntity";
import { FlatToNested } from "@/util/tranformTreeData";

@Component({
  components: { Annotator, Treeselect }
})
export default class Annotate extends Vue {
  @Prop()
  private editDoc!: NLUEntity;

  @Prop()
  private treeId!: string;

  private doc: any = { content: "", annotationList: [], intention: [] }; //  文档对象
  private annotation = new AnnotationModel();
  private dialogVisible: boolean = false; // 对话框显示
  private text: string = ""; // 选中文本
  private entityList: any[] = []; // 实体类树
  private entityArr: any[] = []; // 选中实体类
  private sortValueBy: string = "LEVEL"; // 选项排序方式（"ORDER_SELECTED"，"LEVEL"，"INDEX"）
  private annotationAPI = new AnnotationAPIImpl();
  private entityAPI = new EntityAPIImpl();
  private doneEdit: boolean = false; // 页面是否有修改
  private seletedWord: boolean = false; // 是否选中一个单词
  private loading: boolean = true;
  private intentionList: any[] = []; // 意图树

  @Watch("editDoc", { immediate: true })
  private docChange(newVal: any, oldVal: any) {
    this.doc = Object.assign(this.doc, newVal);
    this.init();
    this.loading = false;
    // this.getEntityList();
    this.entityAPI.getTree(newVal.moduleId, "1").then((res: any) => {
      // 获取意图树
      if (res.data.length !== 0) {
        this.entityAPI.getClass(res.data[0].id).then(({ data }) => {
          this.intentionList = FlatToNested(data);
        });
      }
    });
  }

  @Watch("treeId", { immediate: true, deep: true })
  private treeIdChange(newVal: any, oldVal: any) {
    this.getEntityList(newVal);
  }

  private rowStyle() {
    return "background-color: aliceblue;";
  }

  private init() {
    // 初始化
    this.loading = true;
    this.doneEdit = false;
    this.seletedWord = false;
    this.text = "";
    this.entityArr = [];
  }

  private getEntityList(treeId: string) {
    // 获取实体类树
    this.entityAPI.getClass(treeId).then(({ data }) => {
      if (data) {
        this.entityList = FlatToNested(data);
      }
      this.loading = false;
    });
  }

  private getRangeData(text: string) {
    // 选中文本
    if (text === "") {
      return;
    }
    this.seletedWord = true;
    this.text = text;
    this.entityArr = [];
  }

  private save() {
    // 暂存到页面
    const ref = this.$refs.annotator as any;
    ref.addLabel();
    this.doneEdit = true;
  }

  private addLabel(offset: any) {
    // 添加标注点
    // this.doc.annotationList = [];
    this.entityArr.forEach((item: any) => {
      let flag: boolean = false; // 判断是否已存在相同本体
      const newLabel: Annotation = {
        startOffset: offset.startOffset,
        endOffset: offset.endOffset,
        value: this.text,
        entityId: item.id,
        entity: item.label
      };
      this.doc.annotationList.forEach((i: any) => {
        if (i.value === newLabel.value) {
          if (i.entityId === newLabel.entityId) {
            flag = true;
          }
        }
      });
      if (!flag) {
        this.doc.annotationList.push(newLabel);
      }
    });
  }

  private showDetail(value: string) {
    // 编辑标注点
    this.seletedWord = true;
    this.entityArr = [];
    const innerTableData = this.doc.annotationList.filter(
      (item: any) => item.value === value
    );
    this.text = value;
    innerTableData.forEach((item: any) => {
      const obj = {
        id: item.entityId,
        label: item.entity
      };
      this.entityArr.push(obj);
    });
  }

  private deleteRow(row: any) {
    // 删除一行
    const result: any[] = [];
    // 为了防止影响原数组，object.assign仅为一层深拷贝，故不能直接操作数组或对象
    this.doc.annotationList.forEach((item: any) => {
      if (item.entityId !== row.entityId || item.value !== row.value) {
        result.push(item);
      }
    });
    this.doc.annotationList = result;
    this.entityArr = this.entityArr.filter(
      (item: any) => item.id !== row.entityId
    );
    this.doneEdit = true;
  }

  private saveAll() {
    // 保存标注信息
    this.annotationAPI.createOrUpdateAnnotation(this.doc).then((res: any) => {
      if (res.code === 0) {
        this.$emit("doneSave");
        this.doneEdit = false;
        this.$message({
          message: "保存成功！",
          type: "success"
        });
      }
    });
  }

  private gotoInstance() {
    // 跳转到实例创建页面
    this.$emit("gotoInstance");
  }

  private next() {
    // 下一条
  }

  private prev() {
    // 上一条
  }
}
</script>

<style lang="less" scoped>
.content {
  padding: 20px;
  line-height: 34px;
}
.annotator {
  display: flex;
  align-items: center;
  justify-content: space-around;
  line-height: 25px;
}
.vue-treeselect {
  width: 350px;
}
</style>
