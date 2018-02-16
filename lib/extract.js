const babylon = require('babylon');
const { default: traverse } = require('@babel/traverse');
const extractFnVisitor = require('./extract-fn-visitor');

const defaultOptions = {
  func: ['t', 'i18n.t'],
  component: 'Trans',
};

module.exports = (code, options) => {
  const config = Object.assign({}, defaultOptions, options);
  const funcCallees = config.func.map(name => name.split('.'));

  const ast = babylon.parse(code);
  const extractedKeys = [];

  traverse(ast, extractFnVisitor(extractedKeys, funcCallees, code));

  return extractedKeys;
};
