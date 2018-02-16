const babylon = require('babylon');
const { default: traverse } = require('@babel/traverse');
const extractFnVisitor = require('./extract-fn-visitor');

const defaultOptions = {
  func: ['t', 'i18n.t', 'props.t', 'this.props.t'],
  component: 'Trans',
};

module.exports = (code, options = {}) => {
  const config = Object.assign({}, defaultOptions, options);
  const funcCallees = config.func.map(name => name.split('.'));

  const ast = babylon.parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
      'objectRestSpread',
      'dynamicImport',
      'classProperties',
    ],
  });
  const extractedKeys = [];

  traverse(ast, extractFnVisitor(extractedKeys, funcCallees, code));

  return extractedKeys;
};
