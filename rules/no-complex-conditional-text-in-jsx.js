function unwrapExpression(node) {
  if (!node) return null;

  if (
    node.type === "ChainExpression" ||
    node.type === "ParenthesizedExpression" ||
    node.type === "TSAsExpression" ||
    node.type === "TSNonNullExpression" ||
    node.type === "TSSatisfiesExpression" ||
    node.type === "TSTypeAssertion"
  ) {
    return unwrapExpression(node.expression);
  }

  return node;
}

function walkExpression(node, visitor) {
  const expression = unwrapExpression(node);
  if (!expression || typeof expression !== "object") return;

  visitor(expression);

  for (const [key, value] of Object.entries(expression)) {
    if (key === "parent" || key === "type") continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && typeof child.type === "string") {
          walkExpression(child, visitor);
        }
      }

      continue;
    }

    if (value && typeof value === "object" && typeof value.type === "string") {
      walkExpression(value, visitor);
    }
  }
}

function hasLogicalTest(node) {
  let found = false;

  walkExpression(node, (child) => {
    if (
      child.type === "LogicalExpression" &&
      (child.operator === "&&" || child.operator === "||")
    ) {
      found = true;
    }
  });

  return found;
}

function isStringLiteral(node) {
  return node?.type === "Literal" && typeof node.value === "string";
}

function isTemplateLiteral(node) {
  return node?.type === "TemplateLiteral";
}

function isStringConcatenation(node) {
  const expression = unwrapExpression(node);
  return expression?.type === "BinaryExpression" && expression.operator === "+";
}

function isInlineTextExpression(node) {
  const expression = unwrapExpression(node);
  return (
    isStringLiteral(expression) ||
    isTemplateLiteral(expression) ||
    isStringConcatenation(expression)
  );
}

function getTemplateExpressionCount(node) {
  const expression = unwrapExpression(node);
  if (!expression) return 0;

  if (expression.type === "TemplateLiteral") {
    return expression.expressions.length;
  }

  if (expression.type === "BinaryExpression" && expression.operator === "+") {
    return getTemplateExpressionCount(expression.left) + getTemplateExpressionCount(expression.right) + 1;
  }

  return 0;
}

function isJsxChildTextContainer(node) {
  return (
    node?.type === "JSXExpressionContainer" &&
    node.parent?.type === "JSXElement"
  );
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow complex conditional text assembly directly inside JSX children"
    },
    schema: [
      {
        type: "object",
        properties: {
          minTemplateExpressions: { type: "integer", minimum: 1 },
          reportLogicalTests: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      complexConditionalTextInJsx:
        "Do not inline complex conditional text in JSX. Prepare the display copy before JSX or extract a helper."
    }
  },

  create(context) {
    const options = {
      minTemplateExpressions: 2,
      reportLogicalTests: true,
      ...(context.options[0] || {})
    };

    return {
      JSXExpressionContainer(node) {
        if (!isJsxChildTextContainer(node)) return;

        const expression = unwrapExpression(node.expression);
        if (!expression || expression.type !== "ConditionalExpression") return;

        const branches = [expression.consequent, expression.alternate].map(unwrapExpression);
        if (!branches.some((branch) => isInlineTextExpression(branch))) return;

        const hasComplexTemplateBranch = branches.some(
          (branch) => getTemplateExpressionCount(branch) >= options.minTemplateExpressions
        );
        const hasComplexLogicalTest = options.reportLogicalTests && hasLogicalTest(expression.test);

        if (!hasComplexTemplateBranch && !hasComplexLogicalTest) return;

        context.report({
          node: expression,
          messageId: "complexConditionalTextInJsx"
        });
      }
    };
  }
};
