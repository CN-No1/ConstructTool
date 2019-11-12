import InstanceAPI from "../InstanceAPI";
import BaseAPI from "../api";
import InstanceObject from "../model/InstanceObject";

class InstanceAPIImpl extends BaseAPI implements InstanceAPI {

    constructor() {
        super();
        this.instance.defaults.baseURL = "/api/instance";
    }

    public async updateInstance(instance: InstanceObject): Promise<any> {
        return await this.instance.post("updateInstance", JSON.stringify(instance));
    }

    public async getDocByParam(
        moduleId: string, status: string,
        docContent: string, queryType: string, hashCode: number, page: number, size: number): Promise<any> {
        return await this.instance.get(
            "getDocByParam?moduleId=" + moduleId + "&status=" + status
            + "&docContent=" + docContent + "&queryType=" + queryType + "&hashCode=" + hashCode + "&page=" + page + "&size=" + size);
    }

}

export default InstanceAPIImpl;
