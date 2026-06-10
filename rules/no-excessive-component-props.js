import { functionReturnsJsx } from "./chart-rendering-shared.js";

const DEFAULT_MAX = 8;
const REACT_COMPONENT_TYPE_NAMES = new Set([
  "FC",
  "FunctionComponent",
  "React.FC",
  "React.FunctionComponent",
]);

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function getQualifiedNameText(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "TSQualifiedName") {
    const left = getQualifiedNameText(node.left);
    return left ? `${left}.${node.right.name}` : node.right.name;
  }

  if (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.property.type === "Identifier"
  ) {
    const objectName = getQualifiedNameText(node.object);
    return objectName
      ? `${objectName}.${node.property.name}`
      : node.property.name;
  }

  return null;
}

function countObjectPatternProperties(node) {
  return node.properties.filter((property) => property.type === "Property")
    .length;
}

function extractStringLiteralKeys(node) {
  if (!node) {
    return null;
  }

  if (
    node.type === "TSLiteralType" &&
    node.literal.type === "Literal" &&
    typeof node.literal.value === "string"
  ) {
    return [node.literal.value];
  }

  if (node.type === "TSUnionType") {
    const keys = [];

    for (const child of node.types) {
      const childKeys = extractStringLiteralKeys(child);
      if (!childKeys) {
        return null;
      }

      keys.push(...childKeys);
    }

    return [...new Set(keys)];
  }

  return null;
}

function buildLocalTypeMap(program) {
  const typeMap = new Map();

  for (const statement of program.body) {
    if (
      (statement.type === "TSInterfaceDeclaration" ||
        statement.type === "TSTypeAliasDeclaration") &&
      statement.id?.type === "Identifier"
    ) {
      typeMap.set(statement.id.name, statement);
    }
  }

  return typeMap;
}

function mergeCounts(results, reducer) {
  let complete = true;
  let hasResult = false;
  let value = reducer.seed;

  for (const result of results) {
    if (!result) {
      continue;
    }

    hasResult = true;
    complete &&= result.complete;
    value = reducer.apply(value, result.count);
  }

  if (!hasResult) {
    return { count: 0, complete: false };
  }

  return { count: value, complete };
}

function countResolvableTypeReference(name, typeArguments, helpers, seen) {
  if (!name) {
    return { count: 0, complete: false };
  }

  if (REACT_COMPONENT_TYPE_NAMES.has(name)) {
    return typeArguments[0]
      ? countTypeNode(typeArguments[0], helpers, seen)
      : { count: 0, complete: false };
  }

  if (
    (name === "PropsWithChildren" ||
      name === "Readonly" ||
      name === "Partial" ||
      name === "Required") &&
    typeArguments[0]
  ) {
    return countTypeNode(typeArguments[0], helpers, seen);
  }

  if (name === "Pick") {
    const base = typeArguments[0]
      ? countTypeNode(typeArguments[0], helpers, seen)
      : { count: 0, complete: false };
    const keys = extractStringLiteralKeys(typeArguments[1]);

    if (!keys) {
      return { count: base.count, complete: false };
    }

    return { count: keys.length, complete: base.complete };
  }

  if (name === "Omit") {
    const base = typeArguments[0]
      ? countTypeNode(typeArguments[0], helpers, seen)
      : { count: 0, complete: false };
    const keys = extractStringLiteralKeys(typeArguments[1]);

    if (!keys) {
      return { count: base.count, complete: false };
    }

    return {
      count: Math.max(0, base.count - keys.length),
      complete: base.complete,
    };
  }

  const declaration = helpers.typeMap.get(name);
  if (!declaration) {
    return { count: 0, complete: false };
  }

  return countTypeDeclaration(declaration, helpers, seen);
}

function countTypeReferenceNode(node, helpers, seen) {
  const name = getQualifiedNameText(node.typeName);
  const typeArguments = node.typeArguments?.params ?? [];
  return countResolvableTypeReference(name, typeArguments, helpers, seen);
}

function countInterfaceDeclaration(node, helpers, seen) {
  const ownCount = node.body.body.filter(
    (member) =>
      member.type === "TSPropertySignature" ||
      member.type === "TSMethodSignature",
  ).length;

  const extensionCounts = node.extends.map((extension) =>
    countResolvableTypeReference(
      getQualifiedNameText(extension.expression),
      extension.typeArguments?.params ?? [],
      helpers,
      seen,
    ),
  );
  const mergedExtensions = mergeCounts(extensionCounts, {
    seed: 0,
    apply: (total, count) => total + count,
  });

  return {
    count: ownCount + mergedExtensions.count,
    complete:
      extensionCounts.length === 0 ? true : mergedExtensions.complete,
  };
}

function countTypeDeclaration(node, helpers, seen) {
  const name = node.id?.name;
  if (!name || seen.has(name)) {
    return { count: 0, complete: false };
  }

  seen.add(name);

  const result =
    node.type === "TSInterfaceDeclaration"
      ? countInterfaceDeclaration(node, helpers, seen)
      : countTypeNode(node.typeAnnotation, helpers, seen);

  seen.delete(name);
  return result;
}

function countTypeNode(node, helpers, seen) {
  if (!node) {
    return { count: 0, complete: false };
  }

  switch (node.type) {
    case "TSTypeLiteral":
      return {
        count: node.members.filter(
          (member) =>
            member.type === "TSPropertySignature" ||
            member.type === "TSMethodSignature",
        ).length,
        complete: true,
      };
    case "TSTypeReference":
      return countTypeReferenceNode(node, helpers, seen);
    case "TSIntersectionType":
      return mergeCounts(
        node.types.map((child) => countTypeNode(child, helpers, seen)),
        {
          seed: 0,
          apply: (total, count) => total + count,
        },
      );
    case "TSUnionType":
      return mergeCounts(
        node.types.map((child) => countTypeNode(child, helpers, seen)),
        {
          seed: 0,
          apply: (currentMax, count) => Math.max(currentMax, count),
        },
      );
    case "TSParenthesizedType":
      return countTypeNode(node.typeAnnotation, helpers, seen);
    default:
      return { count: 0, complete: false };
  }
}

function unwrapParam(node) {
  return node?.type === "AssignmentPattern" ? node.left : node;
}

function countPropsFromParam(param, helpers) {
  const normalizedParam = unwrapParam(param);
  if (!normalizedParam) {
    return null;
  }

  if (normalizedParam.typeAnnotation?.type === "TSTypeAnnotation") {
    return countTypeNode(
      normalizedParam.typeAnnotation.typeAnnotation,
      helpers,
      new Set(),
    );
  }

  if (normalizedParam.type === "ObjectPattern") {
    return {
      count: countObjectPatternProperties(normalizedParam),
      complete: true,
    };
  }

  return null;
}

function countPropsFromComponentTypeAnnotation(typeAnnotation, helpers) {
  if (!typeAnnotation) {
    return null;
  }

  if (typeAnnotation.type === "TSTypeAnnotation") {
    return countPropsFromComponentTypeAnnotation(
      typeAnnotation.typeAnnotation,
      helpers,
    );
  }

  if (typeAnnotation.type !== "TSTypeReference") {
    return null;
  }

  const name = getQualifiedNameText(typeAnnotation.typeName);
  if (!REACT_COMPONENT_TYPE_NAMES.has(name)) {
    return null;
  }

  const typeArguments = typeAnnotation.typeArguments?.params ?? [];
  return typeArguments[0]
    ? countTypeNode(typeArguments[0], helpers, new Set())
    : null;
}

function unwrapComponentFunction(init) {
  if (!init) {
    return null;
  }

  if (
    init.type === "ArrowFunctionExpression" ||
    init.type === "FunctionExpression"
  ) {
    return init;
  }

  if (init.type === "CallExpression") {
    const firstArgument = init.arguments[0];
    if (
      firstArgument?.type === "ArrowFunctionExpression" ||
      firstArgument?.type === "FunctionExpression"
    ) {
      return firstArgument;
    }
  }

  return null;
}

function getComponentCandidate(node) {
  if (
    node.type === "FunctionDeclaration" &&
    node.id?.type === "Identifier" &&
    isPascalCase(node.id.name)
  ) {
    return {
      name: node.id.name,
      functionNode: node,
      reportNode: node.id,
      componentTypeAnnotation: null,
    };
  }

  if (
    node.type !== "VariableDeclarator" ||
    node.id.type !== "Identifier" ||
    !isPascalCase(node.id.name)
  ) {
    return null;
  }

  const functionNode = unwrapComponentFunction(node.init);
  if (!functionNode) {
    return null;
  }

  return {
    name: node.id.name,
    functionNode,
    reportNode: node.id,
    componentTypeAnnotation: node.id.typeAnnotation ?? null,
  };
}

function looksLikeReactComponent(candidate, helpers) {
  if (
    countPropsFromComponentTypeAnnotation(
      candidate.componentTypeAnnotation,
      helpers,
    )
  ) {
    return true;
  }

  return functionReturnsJsx(candidate.functionNode);
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when a React component defines too many top-level props.",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyProps:
        "React component '{{name}}' defines {{count}} top-level props (max {{max}}). Split responsibilities or extract a child component instead of growing one broad component API.",
    },
  },

  create(context) {
    const max = context.options[0]?.max ?? DEFAULT_MAX;
    const helpers = {
      typeMap: buildLocalTypeMap(context.sourceCode.ast),
    };

    function inspectNode(node) {
      const candidate = getComponentCandidate(node);
      if (!candidate || !looksLikeReactComponent(candidate, helpers)) {
        return;
      }

      const paramCount = countPropsFromParam(
        candidate.functionNode.params[0],
        helpers,
      );
      const componentTypeCount = countPropsFromComponentTypeAnnotation(
        candidate.componentTypeAnnotation,
        helpers,
      );
      const countResult = componentTypeCount ?? paramCount;

      if (!countResult || countResult.count <= max) {
        return;
      }

      context.report({
        node: candidate.reportNode,
        messageId: "tooManyProps",
        data: {
          name: candidate.name,
          count: String(countResult.count),
          max: String(max),
        },
      });
    }

    return {
      FunctionDeclaration: inspectNode,
      VariableDeclarator: inspectNode,
    };
  },
};
