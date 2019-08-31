class InstanceObject {
    public id?: string;
    public moduleId?: string;
    public status?: string;
    public content?: string;
    public hashCode?: number;
    public instanceList!: Instance[];
    public intention?: any[];
}

export interface Instance {
    domain?: string;
    rangeList?: Range[];
}

export interface Range {
    content?: string;
    relation?: string;
    role?: string;
    status?: boolean;
}

export default InstanceObject;
