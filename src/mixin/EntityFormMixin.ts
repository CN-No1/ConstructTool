import { Vue, Component } from "vue-property-decorator";

@Component
export default class EntityFormMixin extends Vue {
    private visible: boolean = false; // prop是否出现
    private newNode: string = "";

    private showPop() {
        this.visible = true;
        const input = this.$refs.newNode as any;
        input.focus();
    }

    private closePop() {
        this.visible = false;
        this.newNode = "";
    }
}
