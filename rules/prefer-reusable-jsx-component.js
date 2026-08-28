const DEFAULT_MIN_OCCURRENCES = 3;
const DEFAULT_MIN_ELEMENTS = 6;

function getJsxName(node) {
  if (!node) return "unknown";

  if (node.type === "JSXIdentifier") {
    return node.name;
  }

  if (node.type === "JSXMemberExpression") {
    return `${getJsxName(node.object)}.${getJsxName(node.property)}`;
  }

  if (node.type === "JSXNamespacedName") {
    return `${getJsxName(node.namespace)}:${getJsxName(node.name)}`;
  }

  return node.type;
}

function isComponentName(node) {
  return (
    node?.type === "JSXMemberExpression" ||
    (node?.type === "JSXIdentifier" && /^[A-Z]/.test(node.name))
  );
}

function expressionShape(node) {
  if (!node || typeof node !== "object") return "empty";

  if (node.type === "Identifier" || node.type === "PrivateIdentifier") {
    return node.type;
  }

  if (node.type === "Literal") {
    return `Literal:${typeof node.value}`;
  }

  if (node.type === "JSXElement" || node.type === "JSXFragment") {
    return jsxShape(node).signature;
  }

  const structuralParts = [];

  for (const [key, value] of Object.entries(node)) {
    if (
      key === "type" ||
      key === "parent" ||
      key === "loc" ||
      key === "range" ||
      key === "start" ||
      key === "end" ||
      key === "raw" ||
      key === "name" ||
      key === "value"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      const children = value
        .filter((child) => child && typeof child.type === "string")
        .map(expressionShape);

      if (children.length > 0) {
        structuralParts.push(`${key}:[${children.join(",")}]`);
      }

      continue;
    }

    if (value && typeof value === "object" && typeof value.type === "string") {
      structuralParts.push(`${key}:${expressionShape(value)}`);
      continue;
    }

    if (
      typeof value === "boolean" ||
      (typeof value === "string" && key !== "rawValue")
    ) {
      structuralParts.push(`${key}:${String(value)}`);
    }
  }

  return `${node.type}(${structuralParts.join("|")})`;
}

function attributeShape(attribute) {
  if (attribute.type === "JSXSpreadAttribute") {
    return `spread:${expressionShape(attribute.argument)}`;
  }

  const name = getJsxName(attribute.name);
  const value = attribute.value;

  if (!value) return `${name}:boolean`;
  if (value.type === "Literal") return `${name}:literal:${typeof value.value}`;
  if (value.type === "JSXElement" || value.type === "JSXFragment") {
    return `${name}:${jsxShape(value).signature}`;
  }
  if (value.type === "JSXExpressionContainer") {
    return `${name}:expression:${expressionShape(value.expression)}`;
  }

  return `${name}:${value.type}`;
}

function isIgnorableChild(node) {
  if (node.type === "JSXText") {
    return node.value.trim().length === 0;
  }

  return (
    node.type === "JSXExpressionContainer" &&
    node.expression.type === "JSXEmptyExpression"
  );
}

function childShape(node) {
  if (node.type === "JSXElement" || node.type === "JSXFragment") {
    return jsxShape(node);
  }

  if (node.type === "JSXText") {
    return { signature: "text", elementCount: 0 };
  }

  if (node.type === "JSXExpressionContainer") {
    return {
      signature: `expression:${expressionShape(node.expression)}`,
      elementCount: 0,
    };
  }

  return { signature: node.type, elementCount: 0 };
}

function jsxShape(node) {
  if (node.type === "JSXFragment") {
    const children = node.children.filter((child) => !isIgnorableChild(child));
    const shapes = children.map(childShape);

    return {
      signature: `fragment[${shapes.map((shape) => shape.signature).join(",")}]`,
      elementCount: shapes.reduce(
        (count, shape) => count + shape.elementCount,
        0,
      ),
    };
  }

  const { openingElement } = node;
  const tagName =
    openingElement.selfClosing && isComponentName(openingElement.name)
      ? "ComponentLeaf"
      : getJsxName(openingElement.name);
  const attributes = openingElement.attributes
    .map(attributeShape)
    .toSorted()
    .join(",");
  const children = node.children.filter((child) => !isIgnorableChild(child));
  const shapes = children.map(childShape);

  return {
    signature: `element:${tagName}(${attributes})[${shapes
      .map((shape) => shape.signature)
      .join(",")}]`,
    elementCount:
      1 + shapes.reduce((count, shape) => count + shape.elementCount, 0),
  };
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest a reusable component for substantial repeated JSX sibling structures.",
    },
    schema: [
      {
        type: "object",
        properties: {
          minOccurrences: { type: "integer", minimum: 2 },
          minElements: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      repeatedStructure:
        "{{occurrences}} sibling JSX blocks repeat the same {{elements}}-element structure. Extract a reusable component and pass the varying values as props or data.",
    },
  },

  create(context) {
    const minOccurrences =
      context.options[0]?.minOccurrences ?? DEFAULT_MIN_OCCURRENCES;
    const minElements = context.options[0]?.minElements ?? DEFAULT_MIN_ELEMENTS;

    function inspectChildren(node) {
      let run = [];
      let runSignature = null;

      function reportRun() {
        if (run.length < minOccurrences) return;

        const firstNode = run[0].node;
        const lastNode = run.at(-1).node;

        context.report({
          node: firstNode,
          loc: {
            start: firstNode.loc.start,
            end: lastNode.loc.end,
          },
          messageId: "repeatedStructure",
          data: {
            occurrences: String(run.length),
            elements: String(run[0].elementCount),
          },
        });
      }

      function resetRun() {
        reportRun();
        run = [];
        runSignature = null;
      }

      for (const child of node.children) {
        if (isIgnorableChild(child)) continue;

        if (child.type !== "JSXElement" && child.type !== "JSXFragment") {
          resetRun();
          continue;
        }

        const shape = jsxShape(child);
        if (shape.elementCount < minElements) {
          resetRun();
          continue;
        }

        if (shape.signature !== runSignature) {
          resetRun();
          runSignature = shape.signature;
        }

        run.push({ node: child, elementCount: shape.elementCount });
      }

      reportRun();
    }

    return {
      JSXElement: inspectChildren,
      JSXFragment: inspectChildren,
    };
  },
};
