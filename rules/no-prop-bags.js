import {
  getExportedPropertiesDeclaration,
  getPropertyName,
  getTypeAnnotationNode,
} from "./eslint-local-rules-shared.js";

const DEFAULT_OPTIONS = {
  maxBags: 2,
  maxPropsPerBag: 5,
};

const BAG_MEMBER_NODE_TYPES = new Set([
  "TSPropertySignature",
  "TSMethodSignature",
]);

const isNullishTypeNode = (node) =>
  node?.type === "TSNullKeyword" || node?.type === "TSUndefinedKeyword";

const countBagMembers = (members) =>
  members.filter((member) => BAG_MEMBER_NODE_TYPES.has(member.type)).length;

const unwrapTypeNode = (node) => {
  if (!node) {
    return null;
  }

  if (
    node.type === "TSParenthesizedType" ||
    node.type === "TSAsExpression" ||
    node.type === "TSSatisfiesExpression"
  ) {
    return unwrapTypeNode(node.typeAnnotation ?? node.expression);
  }

  return node;
};

const getTypeReferenceName = (node) => {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "TSQualifiedName") {
    return getTypeReferenceName(node.right);
  }

  return null;
};

const buildDeclarationMap = (programNode) => {
  const declarations = new Map();

  for (const statement of programNode.body ?? []) {
    const declaration = getExportedPropertiesDeclaration(statement);
    if (!declaration?.typeName) {
      continue;
    }

    declarations.set(declaration.typeName, declaration);
  }

  return declarations;
};

const resolveBagFromDeclaration = (declaration, declarations, seenNames) => {
  if (!declaration?.typeName || seenNames.has(declaration.typeName)) {
    return null;
  }

  seenNames.add(declaration.typeName);
  const memberCount = countBagMembers(declaration.members);
  seenNames.delete(declaration.typeName);

  return memberCount > 0
    ? {
        memberCount,
        sourceTypeName: declaration.typeName,
      }
    : null;
};

const resolveBagFromUnion = (typeNode, declarations, seenNames) => {
  const bagBranches = [];

  for (const branch of typeNode.types) {
    if (isNullishTypeNode(branch)) {
      continue;
    }

    const bag = resolveBagShape(branch, declarations, seenNames);
    if (!bag) {
      return null;
    }

    bagBranches.push(bag);
  }

  if (bagBranches.length !== 1) {
    return null;
  }

  return bagBranches[0];
};

function resolveBagShape(typeNode, declarations, seenNames = new Set()) {
  const normalizedTypeNode = unwrapTypeNode(typeNode);
  if (!normalizedTypeNode) {
    return null;
  }

  switch (normalizedTypeNode.type) {
    case "TSTypeLiteral": {
      const memberCount = countBagMembers(normalizedTypeNode.members ?? []);
      return memberCount > 0 ? { memberCount } : null;
    }

    case "TSUnionType": {
      return resolveBagFromUnion(normalizedTypeNode, declarations, seenNames);
    }

    case "TSIntersectionType": {
      let memberCount = 0;
      let branchCount = 0;

      for (const branch of normalizedTypeNode.types) {
        const bag = resolveBagShape(branch, declarations, seenNames);
        if (!bag) {
          return null;
        }

        branchCount += 1;
        memberCount += bag.memberCount;
      }

      return branchCount > 0 ? { memberCount } : null;
    }

    case "TSTypeReference": {
      const typeName = getTypeReferenceName(normalizedTypeNode.typeName);
      const typeParameters = normalizedTypeNode.typeArguments?.params ?? [];

      if (
        (typeName === "Readonly" ||
          typeName === "Partial" ||
          typeName === "Required") &&
        typeParameters[0]
      ) {
        return resolveBagShape(typeParameters[0], declarations, seenNames);
      }

      if (!typeName) {
        return null;
      }

      return resolveBagFromDeclaration(
        declarations.get(typeName),
        declarations,
        seenNames,
      );
    }

    default: {
      return null;
    }
  }
}

const collectPropBags = (propsDeclaration, declarations) => {
  const bags = [];

  for (const member of propsDeclaration.members) {
    const bagName = getPropertyName(member);
    const bagTypeNode = getTypeAnnotationNode(member);
    if (!bagName || !bagTypeNode) {
      continue;
    }

    const bag = resolveBagShape(bagTypeNode, declarations);
    if (!bag) {
      continue;
    }

    bags.push({
      name: bagName,
      memberCount: bag.memberCount,
      node: member,
      sourceTypeName: bag.sourceTypeName ?? null,
    });
  }

  return bags;
};

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when component props types accumulate too many nested object-shaped prop bags or make one nested bag too large.",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxBags: { type: "integer", minimum: 1 },
          maxPropsPerBag: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyPropBags:
        "Props type '{{typeName}}' contains {{count}} nested prop bags (max {{max}}). Flatten the component API or extract a dedicated child component instead of grouping several props into nested objects.",
      propBagTooLarge:
        "Nested prop bag '{{bagName}}' inside '{{typeName}}' contains {{count}} fields (max {{max}}). Flatten those fields or extract a dedicated component boundary instead of passing a large grouped bag.",
    },
  },

  create(context) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...(context.options[0] ?? {}),
    };
    const declarations = buildDeclarationMap(context.sourceCode.ast);

    const inspectDeclaration = (node) => {
      const propsDeclaration = getExportedPropertiesDeclaration(node);
      if (!propsDeclaration?.typeName?.endsWith("Props")) {
        return;
      }

      const bags = collectPropBags(propsDeclaration, declarations);

      if (bags.length > options.maxBags) {
        context.report({
          node: propsDeclaration.reportNode,
          messageId: "tooManyPropBags",
          data: {
            typeName: propsDeclaration.typeName,
            count: String(bags.length),
            max: String(options.maxBags),
          },
        });
      }

      for (const bag of bags) {
        if (bag.memberCount <= options.maxPropsPerBag) {
          continue;
        }

        context.report({
          node: bag.node,
          messageId: "propBagTooLarge",
          data: {
            bagName: bag.name,
            typeName: propsDeclaration.typeName,
            count: String(bag.memberCount),
            max: String(options.maxPropsPerBag),
          },
        });
      }
    };

    return {
      TSInterfaceDeclaration: inspectDeclaration,
      TSTypeAliasDeclaration: inspectDeclaration,
    };
  },
};
