class EntityClassNode {
    public id?: string;
    public label?: string;
    public description?: string;
    public bandFlag?: string;
    public propList!: PropRow[];
    public children?: EntityClassNode[];

    constructor() {
        this.label = "";
        this.description = "";
        this.propList = [];
    }
}

export interface FlatEntityClassModel {
    id?: string;
    label?: string;
    treeId?: string;
    pid?: string;
}

export interface PropRow {
    propName?: string;
    propVal?: string;
    propType?: string;
}

export default EntityClassNode;
