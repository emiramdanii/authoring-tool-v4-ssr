/* Helper: extract pageIdx from composite key "pageIdx-gameIdx" or plain "pageIdx" */
export const gPageIdxHelper: string = `function gPageIdx(key){return parseInt(String(key).split('-')[0])}`;
