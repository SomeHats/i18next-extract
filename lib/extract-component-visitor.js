const invariant = require('invariant');
const t = require('@babel/types');
const codeFrameError = require('./code-frame-error');

const doIdsMatch = (astNode, name) => {
  return t.isJSXIdentifier(astNode) && astNode.name === name;
};

const doComponentNamesMatch = (astName, nameToMatch) => {
  invariant(nameToMatch.length > 0, 'name length must be greater than 0');

  if (nameToMatch.length === 1) {
    return doIdsMatch(astName, nameToMatch[0]);
  }

  if (t.isJSXMemberExpression(astName)) {
    const { object, property } = astName;

    const remaining = nameToMatch.slice(0, -1);
    const lastPart = nameToMatch[nameToMatch.length - 1];
    if (doIdsMatch(property, lastPart)) {
      return doComponentNamesMatch(object, remaining);
    }
  }

  return false;
};

const extractJSXInterpolation = (expression, rawCode) => {
  if (expression.properties.length !== 1) {
    throw codeFrameError(
      rawCode,
      expression,
      'Only single-property objects allowed as interpolated sections in translated JSX'
    );
  }

  const property = expression.properties[0];
  if (!t.isIdentifier(property.key)) {
    throw codeFrameError(
      rawCode,
      expression,
      'Only static identifiers are allowed as properties in interpolated parts of translated JSX!'
    );
  }

  return `{{${property.key.name}}}`;
};
const extractJSXExpression = (expression, rawCode) => {
  if (t.isStringLiteral(expression)) {
    return expression.value;
  } else if (t.isNumericLiteral(expression)) {
    return String(expression.value);
  } else if (t.isObjectExpression(expression)) {
    return extractJSXInterpolation(expression, rawCode);
  } else {
    throw codeFrameError(
      rawCode,
      expression,
      `Invalid JSX expression. Only static values or {{interpolation}} blocks allowed. Got ${
        expression.type
      }`
    );
  }
};

const extractFromChildren = (children, rawCode) => {
  return children
    .map((child, i) => {
      if (t.isStringLiteral(child)) {
        return child.value;
      } else if (t.isNumericLiteral(child)) {
        return String(child.value);
      } else if (t.isObjectExpression(child)) {
        return extractJSXInterpolation(child, rawCode);
      } else if (t.isJSXElement(child)) {
        const childChildren = t.react.buildChildren(child);
        const childString = extractFromChildren(childChildren);
        return `<${i}>${childString}</${i}>`;
      } else {
        throw codeFrameError(
          rawCode,
          child,
          `unknown child type in translated JSX: ${child.type}`
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
      const children = t.react.buildChildren(path.node);
      const key = extractFromChildren(children, code);
      if (!extractedKeys.includes(key)) {
        extractedKeys.push(key);
      }
    }
  },
});
