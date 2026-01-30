/**
 * Sort object keys alphabetically
 * Required by VNPAY for generating secure hash
 */
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
        sorted[key] = obj[key];
    });

    return sorted;
}

export { sortObject };
