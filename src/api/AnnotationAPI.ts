import NLUEntity from "@/api/model/NLUEntity";

interface AnnotationAPI {

    getAnnotation(id: string): Promise<any>;

    createOrUpdateAnnotation(doc: NLUEntity): Promise<any>;

    getDocByParam(
        moduleId: string, status: string, purpose: string,
        docContent: string, hashCode: number, page: number, size: number): Promise<any>;

    createNLUDoc(doc: NLUEntity): Promise<any>;

    deleteNLUDoc(id: string): Promise<any>;

    getPurpose(): Promise<any>;

}

export default AnnotationAPI;
