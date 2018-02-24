const { codeFrameColumns } = require('@babel/code-frame');

class CodeFrameError extends Error {
  constructor(rawCode, node, message) {
    const codeFrame = codeFrameColumns(rawCode, node.loc);
    const errMessage = `${message}\n${codeFrame}`;
    super(errMessage);
  }
}

module.exports = (rawCode, node, message) => {
  if (node.loc) {
    return new CodeFrameError(rawCode, node, message);
  }
  return new Error(message);
};
