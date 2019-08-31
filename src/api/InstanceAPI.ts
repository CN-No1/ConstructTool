import InstanceObject from "./model/InstanceObject";

interface InstanceAPI {

    updateInstance(instance: InstanceObject): Promise<any>;

    getDocByParam(
        moduleId: string, status: string,
        docContent: string, page: number, size: number): Promise<any>;

}

export default InstanceAPI;
