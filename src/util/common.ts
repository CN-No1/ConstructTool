export const getNowFormatDate = () => {
    const date = new Date();
    const seperator1 = "-";
    const year = date.getFullYear();
    let month: string|number = date.getMonth() + 1;
    let strDate: string|number = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    const currentdate = year + seperator1 + month + seperator1 + strDate;
    return currentdate;
};
