import { Vue, Component } from "vue-property-decorator";

@Component
export default class EntityFormMixin extends Vue {
    private propVisible: boolean = false; // prop是否出现
    private newNode: string = "";

    private showPop() {
        this.propVisible = true;
        const input = this.$refs.newNode as any;
        input.focus();
    }

    private closePop() {
        this.propVisible = false;
        this.newNode = "";
    }
}
