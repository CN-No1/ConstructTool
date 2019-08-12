import EntityClassModel from "./model/EntityClassModel";
import DataPropModel from "./model/DataPropModel";
import ObjectPropModel from "./model/ObjectPropModel";
import DataTypeModel from "./model/DataTypeModel";
import ModuleModel from "./model/ModuleModel";

interface EntityAPI {
    getClass(moduleId: string): Promise<any>;

    getModule(): Promise<any>;

    getTree(moduleId: string): Promise<any>;

    getDataProp(treeId: string): Promise<any>;

    getObjectProp(treeId: string): Promise<any>;

    getDataType(): Promise<any>;

    createOrUpdateModule(module: ModuleModel): Promise<any>;

    deleteModule(id: string): Promise<any>;

    createOrUpdateTree(module: ModuleModel): Promise<any>;

    deleteTree(id: string): Promise<any>;

    creatOrUpdateClass(entityClass: EntityClassModel[]): Promise<any>;

    deleteClass(id: string): Promise<any>;

    creatOrUpdateDataProp(dataPropModel: DataPropModel): Promise<any>;

    creatOrUpdateObjectProp(objectPropModel: ObjectPropModel): Promise<any>;

    creatOrUpdateDataType(dataTypeModel: DataTypeModel[]): Promise<any>;

}

export default EntityAPI;
