function isFunctionExpressionNode(node) {
  return Boolean(node && (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression"));
}

function getPropertyName(node) {
  if (!node?.key) {
    return "property";
  }

  if (node.key.type === "Identifier") {
    return node.key.name;
  }

  if (node.key.type === "Literal" && typeof node.key.value === "string") {
    return node.key.value;
  }

  return "property";
}

function getRelevantLineSegment(lineText, lineNumber, loc) {
  const isStartLine = lineNumber === loc.start.line;
  const isEndLine = lineNumber === loc.end.line;
  const startColumn = isStartLine ? loc.start.column : 0;
  const endColumn = isEndLine ? loc.end.column : lineText.length;

  return lineText.slice(startColumn, endColumn);
}

function isIgnorableLine(lineText) {
  const trimmed = lineText.trim();
  if (!trimmed || trimmed === "{" || trimmed === "}") {
    return true;
  }

  return (
    trimmed.startsWith("//") ||
    trimmed === "/*" ||
    trimmed === "*/" ||
    trimmed === "*" ||
    /^\/\*.*\*\/$/u.test(trimmed) ||
    /^\*.*$/u.test(trimmed)
  );
}

function getBodyLineCount(functionNode, sourceCode) {
  if (!functionNode?.body?.loc) {
    return Number.POSITIVE_INFINITY;
  }

  if (!sourceCode?.lines) {
    return Number.POSITIVE_INFINITY;
  }

  const loc = functionNode.body.loc;
  let count = 0;

  for (let lineNumber = loc.start.line; lineNumber <= loc.end.line; lineNumber += 1) {
    const originalLine = sourceCode.lines[lineNumber - 1];
    if (typeof originalLine !== "string") {
      return Number.POSITIVE_INFINITY;
    }

    const relevantSegment = getRelevantLineSegment(originalLine, lineNumber, loc);
    if (isIgnorableLine(relevantSegment)) {
      continue;
    }

    count += 1;
  }

  return count;
}

function getInlineMethodFunction(node) {
  if (!node || node.type !== "Property" || node.parent?.type !== "ObjectExpression") {
    return null;
  }

  if (node.method && node.value?.type === "FunctionExpression") {
    return node.value;
  }

  if (isFunctionExpressionNode(node.value)) {
    return node.value;
  }

  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when inline object literal methods become too long"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxBodyLines: { type: "integer", minimum: 0 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooLong:
        "Inline object method '{{name}}' is too long ({{count}} body lines, max {{max}}). Extract a named helper or move the logic out of the object literal."
    }
  },

  create(context) {
    const options = {
      maxBodyLines: 3,
      ...(context.options[0] || {})
    };
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Property(node) {
        const functionNode = getInlineMethodFunction(node);
        if (!functionNode) {
          return;
        }

        const bodyLineCount = getBodyLineCount(functionNode, sourceCode);
        if (bodyLineCount <= options.maxBodyLines) {
          return;
        }

        context.report({
          node,
          messageId: "tooLong",
          data: {
            name: getPropertyName(node),
            count: String(bodyLineCount),
            max: String(options.maxBodyLines)
          }
        });
      }
    };
  }
};
