function containsJsxValue(node) {
  if (!node) return false;

  switch (node.type) {
    case "JSXElement":
    case "JSXFragment": {
      return true;
    }

    case "ChainExpression":
    case "ParenthesizedExpression":
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion": {
      return containsJsxValue(node.expression);
    }

    case "ConditionalExpression": {
      return containsJsxValue(node.consequent) || containsJsxValue(node.alternate);
    }

    case "LogicalExpression": {
      return containsJsxValue(node.left) || containsJsxValue(node.right);
    }

    case "SequenceExpression": {
      return node.expressions.some((expression) => containsJsxValue(expression));
    }

    default: {
      return false;
    }
  }
}

function typeNameMatches(typeName, expectedNames) {
  if (!typeName) return false;

  if (typeName.type === "Identifier") {
    return expectedNames.includes(typeName.name);
  }

  if (typeName.type === "TSQualifiedName") {
    return (
      typeName.left.type === "Identifier" &&
      typeName.right.type === "Identifier" &&
      expectedNames.includes(`${typeName.left.name}.${typeName.right.name}`)
    );
  }

  return false;
}

function isNullishType(typeAnnotation) {
  return (
    typeAnnotation?.type === "TSNullKeyword" ||
    typeAnnotation?.type === "TSUndefinedKeyword"
  );
}

function isExplicitJsxReturnType(typeAnnotation) {
  if (!typeAnnotation) return false;

  if (typeAnnotation.type === "TSTypeReference") {
    return typeNameMatches(typeAnnotation.typeName, [
      "JSX.Element",
      "ReactElement",
      "React.ReactElement",
    ]);
  }

  if (typeAnnotation.type === "TSUnionType") {
    const nonNullishTypes = typeAnnotation.types.filter(
      (entry) => !isNullishType(entry),
    );
    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((entry) => isExplicitJsxReturnType(entry))
    );
  }

  return false;
}

function hasExplicitJsxReturnAnnotation(node) {
  return isExplicitJsxReturnType(node.returnType?.typeAnnotation ?? null);
}

function functionReturnsJsx(node) {
  if (!node) return false;

  if (
    node.type === "ArrowFunctionExpression" &&
    node.body.type !== "BlockStatement"
  ) {
    return containsJsxValue(node.body);
  }

  const statements = node.body?.body ?? [];
  return statements.some(
    (statement) =>
      statement.type === "ReturnStatement" &&
      containsJsxValue(statement.argument),
  );
}

function getFunctionNodeFromVariable(variable) {
  for (const definition of variable?.defs ?? []) {
    if (
      definition.type === "FunctionName" &&
      definition.node?.type === "FunctionDeclaration"
    ) {
      return definition.node;
    }

    if (
      definition.type !== "Variable" ||
      definition.node?.type !== "VariableDeclarator"
    ) {
      continue;
    }

    const init = definition.node.init;
    if (
      init?.type === "ArrowFunctionExpression" ||
      init?.type === "FunctionExpression"
    ) {
      return init;
    }
  }

  return null;
}

function findVariable(scope, name) {
  let currentScope = scope;

  while (currentScope) {
    const variable = currentScope.set?.get(name);
    if (variable) {
      return variable;
    }

    currentScope = currentScope.upper;
  }

  return null;
}

function callExpressionReturnsLocalJsx(node, scope) {
  if (node?.type !== "CallExpression" || node.callee.type !== "Identifier") {
    return false;
  }

  const variable = findVariable(scope, node.callee.name);
  const functionNode = getFunctionNodeFromVariable(variable);
  return (
    !!functionNode &&
    functionReturnsJsx(functionNode) &&
    hasExplicitJsxReturnAnnotation(functionNode)
  );
}

function getLocalJsxHelperCallName(node, scope) {
  if (!node) return null;

  if (node.type === "CallExpression" && node.callee.type === "Identifier") {
    return callExpressionReturnsLocalJsx(node, scope) ? node.callee.name : null;
  }

  switch (node.type) {
    case "ChainExpression":
    case "ParenthesizedExpression":
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion": {
      return getLocalJsxHelperCallName(node.expression, scope);
    }

    case "ConditionalExpression": {
      return (
        getLocalJsxHelperCallName(node.consequent, scope) ||
        getLocalJsxHelperCallName(node.alternate, scope)
      );
    }

    case "LogicalExpression": {
      return (
        getLocalJsxHelperCallName(node.left, scope) ||
        getLocalJsxHelperCallName(node.right, scope)
      );
    }

    case "SequenceExpression": {
      for (const expression of node.expressions) {
        const callName = getLocalJsxHelperCallName(expression, scope);
        if (callName) return callName;
      }

      return null;
    }

    default: {
      return null;
    }
  }
}

function objectStoresDirectJsxValues(node, scope) {
  if (!node || node.type !== "ObjectExpression") return false;

  const properties = node.properties.filter((property) => property?.type === "Property");
  if (properties.length === 0 || properties.length !== node.properties.length) return false;

  return properties.every((property) => storesJsxValue(property.value, scope));
}

function arrayStoresDirectJsxValues(node, scope) {
  if (!node || node.type !== "ArrayExpression") return false;

  const elements = node.elements.filter(Boolean);
  if (elements.length === 0 || elements.length !== node.elements.length) return false;

  return elements.every((element) => storesJsxValue(element, scope));
}

function storesJsxValue(node, scope) {
  if (!node) return false;

  if (containsJsxValue(node) || callExpressionReturnsLocalJsx(node, scope)) {
    return true;
  }

  switch (node.type) {
    case "ChainExpression":
    case "ParenthesizedExpression":
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion": {
      return storesJsxValue(node.expression, scope);
    }

    case "ConditionalExpression": {
      return (
        storesJsxValue(node.consequent, scope) ||
        storesJsxValue(node.alternate, scope)
      );
    }

    case "LogicalExpression": {
      return (
        storesJsxValue(node.left, scope) || storesJsxValue(node.right, scope)
      );
    }

    case "SequenceExpression": {
      return node.expressions.some((expression) => storesJsxValue(expression, scope));
    }

    default: {
      return (
        objectStoresDirectJsxValues(node, scope) ||
        arrayStoresDirectJsxValues(node, scope)
      );
    }
  }
}

function reportStoredJsxValue(context, {
  targetName,
  valueNode,
  scope,
}) {
  const helperName = getLocalJsxHelperCallName(valueNode, scope);

  context.report({
    node: valueNode,
    messageId: helperName
      ? "noStoredJsxHelperResult"
      : "noJsxVariable",
    data: {
      name: targetName,
      helperName,
    }
  });
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow assigning JSX to variables"
    },
    schema: [
      {
        type: "object",
        properties: {
          allowNamePattern: { type: "string" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noJsxVariable:
        "Do not assign JSX to variable {{name}}. Extract a component or keep the JSX where it is rendered.",
      noStoredJsxHelperResult:
        "Do not assign local JSX helper result {{helperName}}(...) to variable {{name}}. Convert it into a component and render it with JSX instead.",
    }
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const options = {
      allowNamePattern: null,
      ...(context.options[0] || {})
    };

    const allowRegex = options.allowNamePattern ? new RegExp(options.allowNamePattern) : null;

    return {
      VariableDeclarator(node) {
        const scope = sourceCode.getScope(node);
        if (!storesJsxValue(node.init, scope)) return;
        if (node.id?.type !== "Identifier") return;

        if (allowRegex && allowRegex.test(node.id.name)) return;
        reportStoredJsxValue(context, {
          targetName: node.id.name,
          valueNode: node.init,
          scope,
        });
      },

      AssignmentExpression(node) {
        if (node.left?.type !== "Identifier") return;

        const scope = sourceCode.getScope(node);
        if (!storesJsxValue(node.right, scope)) return;
        if (allowRegex && allowRegex.test(node.left.name)) return;

        reportStoredJsxValue(context, {
          targetName: node.left.name,
          valueNode: node.right,
          scope,
        });
      }
    };
  }
};
