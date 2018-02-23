const babylon = require('babylon');
const { default: traverse } = require('@babel/traverse');
const extractFnVisitor = require('./extract-fn-visitor');
const extractComponentVisitor = require('./extract-component-visitor');

const defaultOptions = {
  func: ['t', 'i18n.t', 'props.t', 'this.props.t'],
  component: ['Trans', 'I18n.T'],
};

module.exports = (code, options = {}) => {
  const config = Object.assign({}, defaultOptions, options);
  const funcCallees = config.func.map(name => name.split('.'));
  const componentNames = config.component.map(name => name.split('.'));

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

  const visitor = traverse.visitors.merge([
    extractFnVisitor(extractedKeys, funcCallees, code),
    extractComponentVisitor(extractedKeys, componentNames, code),
  ]);

  traverse(ast, visitor);

  return extractedKeys;
};
