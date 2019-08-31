import EntityAPI from "../EntityAPI";
import BaseAPI from "../api";
import EntityClassModel from "../model/EntityClassModel";
import DataPropModel from "../model/DataPropModel";
import ObjectPropModel from "../model/ObjectPropModel";
import DataTypeModel from "../model/DataTypeModel";
import ModuleModel from "../model/ModuleModel";
import TreeType from "../model/TreeType";

class EntityAPIImpl extends BaseAPI implements EntityAPI {

    constructor() {
        super();
        this.instance.defaults.baseURL = "/api/entity";
    }

    public async getClass(treeId?: string): Promise<any> {
        return await this.instance.get("getClasses?id=" + treeId);
    }

    public async getModule(): Promise<any> {
        return await this.instance.get("getModule");
    }

    public async getTree(moduleId: string, treeType?: string): Promise<any> {
        let request = "getTree?moduleId=" + moduleId;
        if (treeType) { request = request.concat("&treeType=" + treeType); }
        return await this.instance.get(request);
    }

    public async getDataProp(treeId: string): Promise<any> {
        return await this.instance.get("getDataProp?id=" + treeId);
    }

    public async getObjectProp(treeId: string): Promise<any> {
        return await this.instance.get("getObjectProp?id=" + treeId);
    }

    public async getDataType(): Promise<any> {
        return await this.instance.get("getDataType");
    }

    public async createModule(module: ModuleModel): Promise<any> {
        return await this.instance.post("createModule", JSON.stringify(module));
    }

    public async creatOrUpdateClass(entityClass: EntityClassModel[]): Promise<any> {
        return await this.instance.post("creatOrUpdateClass", JSON.stringify(entityClass));
    }

    public async deleteClass(id: string): Promise<any> {
        return await this.instance.delete("deleteClass?id=" + id);
    }

    public async creatOrUpdateDataProp(dataPropModel: DataPropModel): Promise<any> {
        return await this.instance.post("creatOrUpdateDataProp", JSON.stringify(dataPropModel));
    }

    public async creatOrUpdateObjectProp(objectPropModel: ObjectPropModel): Promise<any> {
        return await this.instance.post("creatOrUpdateObjectProp", JSON.stringify(objectPropModel));
    }

    public async creatOrUpdateDataType(dataTypeModel: DataTypeModel[]): Promise<any> {
        return await this.instance.post("creatOrUpdateDataType", JSON.stringify(dataTypeModel));
    }

    public async createOrUpdateModule(module: ModuleModel): Promise<any> {
        return await this.instance.post("createOrUpdateModule", JSON.stringify(module));
    }
    public async deleteModule(id: string): Promise<any> {
        return await this.instance.delete("deleteModule?id=" + id);
    }
    public async createOrUpdateTree(module: ModuleModel): Promise<any> {
        return await this.instance.post("createOrUpdateTree", JSON.stringify(module));
    }
    public async deleteTree(id: string): Promise<any> {
        return await this.instance.delete("deleteTree?id=" + id);
    }

    public async getTreeType(): Promise<any> {
        return await this.instance.get("getTreeType");
    }

    public async createTreeType(treeType: TreeType): Promise<any> {
        return await this.instance.post("createTreeType", JSON.stringify(treeType));
    }

    public async deleteTreeType(id: string): Promise<any> {
        return await this.instance.delete("deleteTreeType?id=" + id);
    }

}

export default EntityAPIImpl;
