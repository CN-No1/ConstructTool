<template>
  <div @click="getSelection" style="padding-left: 20px;">
    <span
      v-for="(i,index) in docLableList"
      :key="index"
      :style="i.entityId!=-1?markStyle:''"
      @click="showDetail(i)"
    >{{ docContent.slice(i.startOffset, i.endOffset) }}</span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
@Component({
  components: {}
})
export default class Annotator extends Vue {
  @Prop()
  private doc!: string;
  @Prop()
  private entityPosition!: any[];

  private startOffset!: number; // 头偏移值
  private endOffset!: number; // 尾偏移值
  private docContent: string = "";

  @Watch("doc", { immediate: true, deep: true })
  private docChange(newVal: any, oldVal: any) {
    this.docContent = newVal;
  }

  get sortPositionList() {
    // 对标注位置进行升序排序,并且去重
    const sorted: any = {};
    let sort = this.entityPosition.sort(
      (a, b) => a.startOffset - b.startOffset
    );
    sort = sort.reduce((item, next) => {
      if (!sorted[next.startOffset]) {
        sorted[next.startOffset] = true && item.push(next);
      }
      return item;
    }, []);
    return sort;
  }

  get docLableList() {
    // 生成标注与未标注的文字对象数组，按文档开头至结尾升序排列
    const sortDoc = [];
    let flag = 0;
    for (const i of this.sortPositionList) {
      const marked = i; // 标注点
      const notMarked = this.creatPosition(flag, marked.startOffset); // 未标注点
      sortDoc.push(notMarked);
      sortDoc.push(marked);
      flag = marked.endOffset;
    }
    const end = this.creatPosition(flag, this.docContent.length); // 补全
    sortDoc.push(end);
    return sortDoc;
    // console.log(sortDoc);
  }

  get markStyle() {
    // 标志样式
    return "color:red;cursor:pointer;text-decoration:underline;padding:0 2px;";
  }

  private creatPosition(start: any, end: any) {
    // 创建新的定位对象
    const position = {
      startOffset: start,
      endOffset: end,
      value: "",
      entity: "",
      entityId: -1
    };
    return position;
  }

  private getSelection() {
    const sel = window.getSelection && window.getSelection(); // 得到selection对象
    let start: number;
    let end: number;
    // console.log(sel);
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0); // 返回range对象
      const preSelectionRange = range.cloneRange(); // 复制一份range
      // 将祖先节点变为整个文档,this.$el指向组件的dom，即将开始点重置为文档开头位置，因为range对象会忽略已被标注的文本，从而会产生偏移值误差
      preSelectionRange.selectNodeContents(this.$el);
      preSelectionRange.setEnd(range.startContainer, range.startOffset); // 将原本range对象的开始点作为文档开头到开始点的结束位置，从而找出开始点的真正偏移值
      start = preSelectionRange.toString().length;
      end = start + range.toString().length;
      if (start === end) {
        return;
      }
      if (this.validRange(start, end)) {
        this.$emit("getRangeData", range.toString());
        this.startOffset = start;
        this.endOffset = end;
      } else {
        const vm: any = this;
        vm.$message({
          type: "error",
          message: "选择区域不合法！",
          duration: 1000
        });
      }
    }
  }

  private validRange(startOffset: number, endOffset: number) {
    // 判断选择区域是否合法
    if (startOffset > this.doc.length || endOffset > this.docContent.length) {
      return false;
    }
    if (startOffset < 0 || endOffset < 0) {
      return false;
    }
    for (const i of this.entityPosition) {
      // 判断选中区域是否被包含在已标记词汇中
      if (i.startOffset < startOffset && startOffset < i.endOffset) {
        return false;
      }
      if (i.startOffset > startOffset && i.startOffset < endOffset) {
        return false;
      }
    }
    return true;
  }

  private addLabel() {
    // 新增标注点
    const offset = {
      startOffset: this.startOffset,
      endOffset: this.endOffset
    };
    this.$emit("addLabel", offset);
  }

  private showDetail(i: any) {
    // 查看标注文本详情
    if (i.entityId === -1) {
      return false;
    }
    this.startOffset = i.startOffset;
    this.endOffset = i.endOffset;
    this.$emit("showDetail", i.value);
  }
}
</script>