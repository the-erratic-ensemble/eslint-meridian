const DOC_HINT = " See docs/rules/no-inline-conditional-styles.md.";

function getJsxAttributeName(node) {
  if (!node?.name) return null;
  if (node.name.type === "JSXIdentifier") return node.name.name;
  return null;
}

function isSimpleStyleFallbackNode(node) {
  if (!node) return false;

  return node.type === "Identifier" || node.type === "MemberExpression";
}

function isAllowedSimpleIdentifierFallback(node, options) {
  if (!options.allowSimpleIdentifierFallbacks) return false;
  if (!node || node.type !== "ConditionalExpression") return false;

  return isSimpleStyleFallbackNode(node.consequent) && isSimpleStyleFallbackNode(node.alternate);
}

function isTargetCall(node, functionNames) {
  return (
    node &&
    node.type === "CallExpression" &&
    node.callee &&
    node.callee.type === "Identifier" &&
    functionNames.includes(node.callee.name)
  );
}

function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;

    if (Array.isArray(value)) {
      for (const child of value) walk(child, visitor);
    } else if (value && typeof value === "object") {
      walk(value, visitor);
    }
  }
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow inline conditional style assembly in JSX props and steer variants toward cva instead of ad hoc class helpers"
    },
    schema: [
      {
        type: "object",
        properties: {
          propNames: {
            type: "array",
            items: { type: "string" }
          },
          functionNames: {
            type: "array",
            items: { type: "string" }
          },
          disallowTernary: { type: "boolean" },
          disallowLogicalAnd: { type: "boolean" },
          disallowLogicalOr: { type: "boolean" },
          allowSimpleIdentifierFallbacks: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      inlineConditionalStyle: `Do not use inline conditional style logic in '{{propName}}'. Keep the existing class expression or move the variant to \`cva\`/\`class-variance-authority\`, not an ad hoc \`get*ClassName\` helper.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      propNames: ["className"],
      functionNames: ["clsx", "cx", "cn"],
      disallowTernary: true,
      disallowLogicalAnd: false,
      disallowLogicalOr: false,
      allowSimpleIdentifierFallbacks: true,
      ...(context.options[0] || {})
    };

    function hasBannedConditional(node) {
      let found = false;

      walk(node, (child) => {
        if (found) return;

        if (
          options.disallowTernary &&
          child.type === "ConditionalExpression" &&
          !isAllowedSimpleIdentifierFallback(child, options)
        ) {
          found = true;
          return;
        }

        if (
          child.type === "LogicalExpression" &&
          ((options.disallowLogicalAnd && child.operator === "&&") ||
            (options.disallowLogicalOr && child.operator === "||"))
        ) {
          found = true;
        }
      });

      return found;
    }

    return {
      JSXAttribute(node) {
        const propName = getJsxAttributeName(node);
        if (!propName || !options.propNames.includes(propName)) return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;

        const expr = node.value.expression;

        if (hasBannedConditional(expr)) {
          context.report({
            node,
            messageId: "inlineConditionalStyle",
            data: { propName }
          });
          return;
        }

        if (isTargetCall(expr, options.functionNames)) {
          for (const arg of expr.arguments) {
            if (hasBannedConditional(arg)) {
              context.report({
                node,
                messageId: "inlineConditionalStyle",
                data: { propName }
              });
              return;
            }
          }
        }
      }
    };
  }
};
