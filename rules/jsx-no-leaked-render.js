const COERCE_STRATEGY = "coerce";
const TERNARY_STRATEGY = "ternary";
const DEFAULT_VALID_STRATEGIES = [TERNARY_STRATEGY, COERCE_STRATEGY];
const COERCE_VALID_LEFT_SIDE_EXPRESSIONS = new Set(["UnaryExpression", "BinaryExpression", "CallExpression"]);
const TERNARY_INVALID_LITERAL_ALTERNATE_VALUES = new Set([null, false]);

function isJsxExpressionContainerChild(node) {
  return node?.parent?.type === "JSXExpressionContainer";
}

function isCoerceValidNestedLogicalExpression(node) {
  if (node.type === "LogicalExpression") {
    return isCoerceValidNestedLogicalExpression(node.left) && isCoerceValidNestedLogicalExpression(node.right);
  }

  return COERCE_VALID_LEFT_SIDE_EXPRESSIONS.has(node.type);
}

function findVariable(scope, variableName) {
  let currentScope = scope;

  while (currentScope) {
    const variable = currentScope.variables?.find((candidate) => candidate.name === variableName);
    if (variable) {
      return variable;
    }

    currentScope = currentScope.upper ?? null;
  }

  return null;
}

function getScope(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode?.();
  return sourceCode?.getScope?.(node) ?? context.getScope?.() ?? null;
}

function isBooleanLiteralVariable(context, node, variableName) {
  const variable = findVariable(getScope(context, node), variableName);
  const initialValue = variable?.defs?.[0]?.node?.init?.value;
  return typeof initialValue === "boolean";
}

function isInvalidTernaryAlternate(node) {
  if ("value" in node) {
    return TERNARY_INVALID_LITERAL_ALTERNATE_VALUES.has(node.value);
  }

  return node.type === "Identifier" && node.name === "undefined";
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow potentially leaked non-boolean values in JSX render paths"
    },
    schema: [
      {
        type: "object",
        properties: {
          validStrategies: {
            type: "array",
            items: {
              enum: [TERNARY_STRATEGY, COERCE_STRATEGY]
            },
            uniqueItems: true,
            default: DEFAULT_VALID_STRATEGIES
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noPotentialLeakedRender:
        "Potential leaked value that might cause unintentionally rendered values or rendering crashes."
    }
  },

  create(context) {
    const options = context.options[0] ?? {};
    const validStrategies = new Set(options.validStrategies ?? DEFAULT_VALID_STRATEGIES);

    return {
      LogicalExpression(node) {
        if (node.operator !== "&&" || !isJsxExpressionContainerChild(node)) {
          return;
        }

        const leftSide = node.left;

        if (validStrategies.has(COERCE_STRATEGY)) {
          if (
            COERCE_VALID_LEFT_SIDE_EXPRESSIONS.has(leftSide.type) ||
            isCoerceValidNestedLogicalExpression(leftSide)
          ) {
            return;
          }

          if (leftSide.type === "Identifier" && isBooleanLiteralVariable(context, node, leftSide.name)) {
            return;
          }
        }

        if (leftSide.type === "Literal" && leftSide.value === "") {
          return;
        }

        context.report({
          node,
          messageId: "noPotentialLeakedRender"
        });
      },

      ConditionalExpression(node) {
        if (!isJsxExpressionContainerChild(node) || validStrategies.has(TERNARY_STRATEGY)) {
          return;
        }

        if (node.alternate.type === "JSXElement" || !isInvalidTernaryAlternate(node.alternate)) {
          return;
        }

        context.report({
          node,
          messageId: "noPotentialLeakedRender"
        });
      }
    };
  }
};
