const normalizePath = (value) => value.replaceAll("\\", "/");

const collectForwardReferenceBindings = (node, bindings) => {
  if (node.source?.value !== "react") {
    return;
  }

  for (const specifier of node.specifiers ?? []) {
    if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
      bindings.reactNamespaceNames.add(specifier.local.name);
      continue;
    }

    if (
      specifier.type === "ImportSpecifier" &&
      specifier.imported?.type === "Identifier" &&
      specifier.imported.name === "forwardRef"
    ) {
      bindings.forwardRefNames.add(specifier.local.name);
    }
  }
};

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow React.forwardRef usage in React 19-first codepaths."
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          allowPathIncludes: {
            type: "array",
            items: { type: "string", minLength: 1 }
          }
        }
      }
    ],
    messages: {
      avoidForwardRef:
        "Avoid forwardRef in React 19-first code. Prefer plain refs as props unless this file is explicitly allowlisted."
    }
  },

  create(context) {
    const options = context.options[0] ?? {};
    const allowPathIncludes = options.allowPathIncludes ?? [];
    const filename = normalizePath(context.filename ?? "");

    const isAllowlisted = allowPathIncludes.some((fragment) => filename.includes(fragment));
    if (isAllowlisted) {
      return {};
    }

    const bindings = {
      forwardRefNames: new Set(),
      reactNamespaceNames: new Set()
    };

    return {
      ImportDeclaration(node) {
        collectForwardReferenceBindings(node, bindings);
      },
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type === "Identifier" && bindings.forwardRefNames.has(callee.name)) {
          context.report({ node: callee, messageId: "avoidForwardRef" });
          return;
        }

        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.object?.type === "Identifier" &&
          callee.property?.type === "Identifier" &&
          callee.property.name === "forwardRef" &&
          bindings.reactNamespaceNames.has(callee.object.name)
        ) {
          context.report({ node: callee.property, messageId: "avoidForwardRef" });
        }
      }
    };
  }
};
