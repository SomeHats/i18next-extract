const invariant = require('invariant');
const codeFrameError = require('./code-frame-error');

const doIdsMatch = (astNode, name) => {
  if (name === 'this') {
    return astNode.type === 'ThisExpression';
  }

  return astNode.type === 'Identifier' && astNode.name === name;
};

const doCalleesMatch = (astCallee, calleeToMatch) => {
  invariant(calleeToMatch.length > 0, 'callee length must be greater than 0');

  if (calleeToMatch.length === 1) {
    return doIdsMatch(astCallee, calleeToMatch[0]);
  }

  if (astCallee.type === 'MemberExpression') {
    const { object, property } = astCallee;

    const remaining = calleeToMatch.slice(0, -1);
    const lastPart = calleeToMatch[calleeToMatch.length - 1];
    if (doIdsMatch(property, lastPart)) {
      return doCalleesMatch(object, remaining);
    }
  }

  return false;
};

const extractFromFunction = (node, rawCode) => {
  const args = node.arguments;
  const firstArg = args[0];

  if (args.length < 1) {
    throw codeFrameError(rawCode, node, 'No arguments to translation function');
  }

  if (firstArg.type === 'StringLiteral') {
    return firstArg.value;
  }

  if (firstArg.type === 'TemplateLiteral') {
    if (firstArg.quasis.length !== 1) {
      throw codeFrameError(
        rawCode,
        firstArg,
        'Template strings with dynamic parts are not allowed in translation function. Use a static string with {{ }} interpolated values'
      );
    }

    return firstArg.quasis[0].value.cooked;
  }

  throw codeFrameError(
    rawCode,
    firstArg,
    'First argument to translation function must be a string literal. Dynamic literals are not allowed'
  );
};

module.exports = (extractedKeys, funcCallees, code) => ({
  CallExpression(path) {
    const callee = path.node.callee;

    if (funcCallees.some(funcCallee => doCalleesMatch(callee, funcCallee))) {
      const key = extractFromFunction(path.node, code);
      if (!extractedKeys.includes(key)) {
        extractedKeys.push(key);
      }
    }
  },
});
