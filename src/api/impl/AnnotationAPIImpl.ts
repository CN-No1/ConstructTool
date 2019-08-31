import BaseAPI from "../api";
import AnnotationAPI from "../AnnotationAPI";
import NLUEntity from "@/api/model/NLUEntity";

class AnnotationAPIImpl extends BaseAPI implements AnnotationAPI {

    constructor() {
        super();
        this.instance.defaults.baseURL = "/api/annotation";
    }

    public async getAnnotation(id?: string) {
        return await this.instance.get("getAnnotation?id=" + id);
    }

    public async createOrUpdateAnnotation(doc: NLUEntity) {
        return await this.instance.post("createOrUpdateAnnotation", JSON.stringify(doc));
    }

    public async getDocById(id: string): Promise<any> {
        return await this.instance.get("getDocById?id=" + id);
    }

    public async getDocByParam(
        moduleId: string, status: string, purpose: string,
        docContent: string, page: number, size: number): Promise<any> {
        return await this.instance.get(
            "getDocByParam?moduleId=" + moduleId + "&status=" + status + "&purpose=" + purpose
            + "&docContent=" + docContent + "&page=" + page + "&size=" + size);
    }

    public async createNLUDoc(doc: NLUEntity): Promise<any> {
        return await this.instance.post("createNLUDoc", JSON.stringify(doc));
    }

    public async deleteNLUDoc(id: string): Promise<any> {
        return await this.instance.delete("deleteNLUDoc?id=" + id);
    }

    public async getPurpose(): Promise<any> {
        return await this.instance.get("getPurpose");
    }
}

export default AnnotationAPIImpl;
