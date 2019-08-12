export const NestedToFlat = (data: any, treeId: string, pid?: string) => {
    // 嵌套转平铺
    let res: any[] = [];
    for (const item of data) {
        res.push({
            id: item.id,
            label: item.label,
            description: item.description,
            bandFlag: item.bandFlag,
            treeId,
            pid: pid || "0",
            propList: item.propList
        });
        if (item.children) {
            res = res.concat(NestedToFlat(item.children, treeId, item.id));
        }
    }
    return res;
};

export const FlatToNested = (arr: any[]) => {
    // 平铺转嵌套
    for (const item of arr) {
        const temp = arr.filter((i) => i.id === item.pid)[0];
        if (temp) {
            if (!temp.children) {
                temp.children = [];
            }
            temp.children.push(item);
        }
    }
    return arr.filter((item) => item.pid === "0");
};
