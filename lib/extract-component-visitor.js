const invariant = require('invariant');
const CodeFrameError = require('./code-frame-error');

const doIdsMatch = (astNode, name) => {
  return astNode.type === 'JSXIdentifier' && astNode.name === name;
};

const doComponentNamesMatch = (astName, nameToMatch) => {
  invariant(nameToMatch.length > 0, 'name length must be greater than 0');

  if (nameToMatch.length === 1) {
    return doIdsMatch(astName, nameToMatch[0]);
  }

  if (astName.type === 'JSXMemberExpression') {
    const { object, property } = astName;

    const remaining = nameToMatch.slice(0, -1);
    const lastPart = nameToMatch[nameToMatch.length - 1];
    if (doIdsMatch(property, lastPart)) {
      return doComponentNamesMatch(object, remaining);
    }
  }

  return false;
};

const extractJSXExpression = (expression, rawCode) => {
  if (
    expression.type !== 'ObjectExpression' ||
    expression.properties.length !== 1
  ) {
    throw new CodeFrameError(
      rawCode,
      child,
      'Only single-propertly expressions are allowed in translated components!'
    );
  }

  const property = expression.properties[0];
  if (property.key.type !== 'Identifier') {
    throw new CodeFrameError(
      rawCode,
      child,
      'Only static identifiers are allowed as properties in interpolated parts of translated components!'
    );
  }

  return `{{${property.key.name}}}`;
};

const extractFromChildren = (children, rawCode) => {
  return children
    .map(child => {
      switch (child.type) {
        case 'JSXText':
          return child.value;
        case 'JSXExpressionContainer':
          return extractJSXExpression(child.expression, rawCode);
        default:
          console.log(child);
          throw new CodeFrameError(
            rawCode,
            child,
            `unknown jsx child type: ${child.type}`
          );
      }
    })
    .join('');
};

module.exports = (extractedKeys, componentNames, code) => ({
  JSXElement(path) {
    const name = path.node.openingElement.name;

    if (
      componentNames.some(componentName =>
        doComponentNamesMatch(name, componentName)
      )
    ) {
      const key = extractFromChildren(path.node.children, code);
      if (!extractedKeys.includes(key)) {
        extractedKeys.push(key);
      }
    }
  },
});
