export const getTypeAnnotationNode = (member) => member?.typeAnnotation?.typeAnnotation;

export const getPropertyName = (member) => {
  if (!member || member.type !== "TSPropertySignature" || !member.key) {
    return;
  }

  if (member.key.type === "Identifier") {
    return member.key.name;
  }

  if (member.key.type === "Literal" && typeof member.key.value === "string") {
    return member.key.value;
  }

  return;
};

export const getExportedPropertiesDeclaration = (declarationNode) => {
  if (!declarationNode) {
    return;
  }

  if (declarationNode.type === "TSInterfaceDeclaration") {
    return {
      typeName: declarationNode.id?.name ?? undefined,
      members: declarationNode.body?.body ?? [],
      reportNode: declarationNode.id ?? declarationNode
    };
  }

  if (declarationNode.type === "TSTypeAliasDeclaration") {
    if (declarationNode.typeAnnotation?.type !== "TSTypeLiteral") {
      return;
    }

    return {
      typeName: declarationNode.id?.name ?? undefined,
      members: declarationNode.typeAnnotation.members ?? [],
      reportNode: declarationNode.id ?? declarationNode
    };
  }

  return;
};

const unwrapExpression = (node) => {
  if (!node) {
    return null;
  }

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
};

const getComputedPropertyKey = (node) => {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }

  return null;
};

export const getNormalizedExpressionKey = (node) => {
  const expression = unwrapExpression(node);
  if (!expression) {
    return null;
  }

  switch (expression.type) {
    case "Identifier": {
      return `id:${expression.name}`;
    }

    case "ThisExpression": {
      return "this";
    }

    case "Super": {
      return "super";
    }

    case "Literal": {
      return `literal:${JSON.stringify(expression.value)}`;
    }

    case "MemberExpression": {
      const objectKey = getNormalizedExpressionKey(expression.object);
      if (!objectKey) {
        return null;
      }

      if (!expression.computed && expression.property.type === "Identifier") {
        return `${objectKey}.${expression.property.name}`;
      }

      const computedPropertyKey = getComputedPropertyKey(expression.property);
      if (computedPropertyKey !== null) {
        return `${objectKey}.${computedPropertyKey}`;
      }

      return null;
    }

    case "CallExpression": {
      const calleeKey = getNormalizedExpressionKey(expression.callee);
      if (!calleeKey) {
        return null;
      }

      const argumentKeys = expression.arguments.map((argument) => {
        if (argument.type === "SpreadElement") {
          const spreadKey = getNormalizedExpressionKey(argument.argument);
          return spreadKey ? `...${spreadKey}` : null;
        }

        return getNormalizedExpressionKey(argument);
      });

      if (argumentKeys.includes(null)) {
        return null;
      }

      return `${calleeKey}(${argumentKeys.join(",")})`;
    }

    default: {
      return null;
    }
  }
};
