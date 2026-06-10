const DOC_HINT = " See docs/rules/no-local-jsx-helper-calls.md.";

function walkWithoutNestedFunctions(node, visitor, rootNode = node) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);

  if (
    node !== rootNode &&
    (node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration")
  ) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      for (const child of value)
        walkWithoutNestedFunctions(child, visitor, rootNode);
    } else if (value && typeof value === "object") {
      walkWithoutNestedFunctions(value, visitor, rootNode);
    }
  }
}

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
      return (
        containsJsxValue(node.consequent) || containsJsxValue(node.alternate)
      );
    }

    case "LogicalExpression": {
      return containsJsxValue(node.left) || containsJsxValue(node.right);
    }

    case "SequenceExpression": {
      return node.expressions.some((expression) =>
        containsJsxValue(expression),
      );
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

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow invoking local JSX-returning helpers as plain function calls inside JSX",
    },
    schema: [],
    messages: {
      localJsxHelperCall:
        "Do not call local JSX helper {{name}} inside JSX. Render a JSX element instead or inline the branch.{{docHint}}",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const reportedNodes = new Set();

    return {
      JSXExpressionContainer(node) {
        if (
          node.expression.type === "ArrowFunctionExpression" ||
          node.expression.type === "FunctionExpression"
        ) {
          return;
        }

        walkWithoutNestedFunctions(node.expression, (child) => {
          if (child.type !== "CallExpression") return;
          if (child.callee.type !== "Identifier") return;
          const reportKey =
            child.range?.join(":") ??
            `${child.loc?.start.line}:${child.loc?.start.column}`;
          if (reportedNodes.has(reportKey)) return;

          const variable = findVariable(
            sourceCode.getScope(child),
            child.callee.name,
          );
          const functionNode = getFunctionNodeFromVariable(variable);
          if (!functionNode || !functionReturnsJsx(functionNode)) return;
          if (!hasExplicitJsxReturnAnnotation(functionNode)) return;

          reportedNodes.add(reportKey);

          context.report({
            node: child,
            messageId: "localJsxHelperCall",
            data: {
              name: child.callee.name,
              docHint: DOC_HINT,
            },
          });
        });
      },
    };
  },
};
