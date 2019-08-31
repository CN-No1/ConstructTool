class NLUEntity {
    public id?: string;
    public moduleId?: string;
    public status?: string;
    public content?: string;
    public hashCode?: number;
    public annotationList!: Annotation[];
    public intention?: any[];
}

export interface Annotation {
    value?: string;
    entityId?: string;
    startOffset?: number;
    endOffset?: number;
    entity?: string;
}

export default NLUEntity;
