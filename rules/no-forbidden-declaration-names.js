const DECLARATION_IDENTIFIER_NODE_TYPES = new Set([
  "FunctionDeclaration",
  "ClassDeclaration",
  "VariableDeclarator",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration"
]);

const MEMBER_IDENTIFIER_NODE_TYPES = new Set([
  "Property",
  "PropertyDefinition",
  "MethodDefinition",
  "TSPropertySignature",
  "TSMethodSignature"
]);

const createCaseSensitivityMatcher = (value, caseSensitive) => {
  if (caseSensitive) {
    return value;
  }

  return value.toLowerCase();
};

const getDeclarationIdentifier = (node) => {
  if (!node || !DECLARATION_IDENTIFIER_NODE_TYPES.has(node.type)) {
    return;
  }

  if (node.type === "VariableDeclarator") {
    return node.id?.type === "Identifier" ? node.id : undefined;
  }

  return node.id?.type === "Identifier" ? node.id : undefined;
};

const getMemberIdentifier = (node) => {
  if (!node || !MEMBER_IDENTIFIER_NODE_TYPES.has(node.type) || node.computed) {
    return;
  }

  if (node.key?.type === "Identifier") {
    return node.key;
  }

  return;
};

const ERROR_BOUNDARY_ALLOWED_MEMBER_NAMES = new Set(["render", "getDerivedStateFromError"]);

const isReactComponentSuperClass = (superClass) => {
  if (!superClass) {
    return false;
  }

  if (superClass.type === "Identifier") {
    return superClass.name === "Component" || superClass.name === "PureComponent";
  }

  return (
    superClass.type === "MemberExpression" &&
    !superClass.computed &&
    superClass.object?.type === "Identifier" &&
    superClass.object.name === "React" &&
    superClass.property?.type === "Identifier" &&
    (superClass.property.name === "Component" || superClass.property.name === "PureComponent")
  );
};

const getClassBodyMembers = (classNode) => {
  if (!classNode || (classNode.type !== "ClassDeclaration" && classNode.type !== "ClassExpression")) {
    return [];
  }

  return classNode.body?.body ?? [];
};

const hasClassMemberName = (classNode, memberName) =>
  getClassBodyMembers(classNode).some((member) => member.key?.type === "Identifier" && member.key.name === memberName);

const isErrorBoundaryClass = (classNode) => {
  if (!classNode || !isReactComponentSuperClass(classNode.superClass)) {
    return false;
  }

  return (
    hasClassMemberName(classNode, "componentDidCatch") || hasClassMemberName(classNode, "getDerivedStateFromError")
  );
};

const collectPatternIdentifiers = (pattern, identifiers = []) => {
  if (!pattern) {
    return identifiers;
  }

  if (pattern.type === "Identifier") {
    identifiers.push(pattern);
    return identifiers;
  }

  if (pattern.type === "AssignmentPattern") {
    return collectPatternIdentifiers(pattern.left, identifiers);
  }

  if (pattern.type === "RestElement") {
    return collectPatternIdentifiers(pattern.argument, identifiers);
  }

  if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) {
      collectPatternIdentifiers(element, identifiers);
    }

    return identifiers;
  }

  if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      if (!property) {
        continue;
      }

      if (property.type === "Property") {
        collectPatternIdentifiers(property.value, identifiers);
        continue;
      }

      if (property.type === "RestElement") {
        collectPatternIdentifiers(property.argument, identifiers);
      }
    }
  }

  return identifiers;
};

const findForbiddenNameMatch = (identifierName, patterns) => {
  for (const pattern of patterns) {
    const caseSensitive = pattern.caseSensitive ?? true;

    if (typeof pattern.startsWith === "string") {
      const source = createCaseSensitivityMatcher(identifierName, caseSensitive);
      const matcher = createCaseSensitivityMatcher(pattern.startsWith, caseSensitive);

      if (source.startsWith(matcher)) {
        return {
          matchType: "startsWith",
          caseSensitive,
          value: pattern.startsWith
        };
      }
    }

    if (typeof pattern.contains === "string") {
      const source = createCaseSensitivityMatcher(identifierName, caseSensitive);
      const matcher = createCaseSensitivityMatcher(pattern.contains, caseSensitive);

      if (source.includes(matcher)) {
        return {
          matchType: "contains",
          caseSensitive,
          value: pattern.contains
        };
      }
    }

    if (typeof pattern.endsWith === "string") {
      const source = createCaseSensitivityMatcher(identifierName, caseSensitive);
      const matcher = createCaseSensitivityMatcher(pattern.endsWith, caseSensitive);

      if (source.endsWith(matcher)) {
        return {
          matchType: "endsWith",
          caseSensitive,
          value: pattern.endsWith
        };
      }
    }
  }

  return;
};

const isDirectPromiseConstructor = (callee) => callee?.type === "Identifier" && callee.name === "Promise";

const isPromiseExecutorFunction = (node) => {
  if (!node || (node.type !== "ArrowFunctionExpression" && node.type !== "FunctionExpression")) {
    return false;
  }

  const callNode = node.parent;
  if (!callNode || callNode.type !== "NewExpression") {
    return false;
  }

  return isDirectPromiseConstructor(callNode.callee) && (callNode.arguments?.[0] ?? null) === node;
};

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when declaration, member, or parameter identifiers use forbidden naming fragments configured by startsWith, contains, or endsWith matchers."
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        required: ["patterns"],
        properties: {
          allowNames: {
            type: "array",
            items: {
              type: "string",
              minLength: 1
            },
            uniqueItems: true
          },
          patterns: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                startsWith: { type: "string", minLength: 1 },
                contains: { type: "string", minLength: 1 },
                endsWith: { type: "string", minLength: 1 },
                caseSensitive: { type: "boolean" }
              },
              anyOf: [{ required: ["startsWith"] }, { required: ["contains"] }, { required: ["endsWith"] }]
            }
          }
        }
      }
    ],
    messages: {
      avoidForbiddenDeclarationName:
        "Avoid identifier name '{{name}}'; it {{matchType}} '{{value}}' (case-{{caseMode}}) and violates the shared forbidden naming policy."
    }
  },

  create(context) {
    const options = context.options[0] ?? {};
    const allowNames = new Set(options.allowNames === undefined ? undefined : options.allowNames);
    const patterns = options.patterns ?? [];

    if (patterns.length === 0) {
      return {};
    }

    const reportIdentifierIfForbidden = (identifier) => {
      if (!identifier?.name) {
        return;
      }

      if (allowNames.has(identifier.name)) {
        return;
      }

      const match = findForbiddenNameMatch(identifier.name, patterns);
      if (!match) {
        return;
      }

      context.report({
        node: identifier,
        messageId: "avoidForbiddenDeclarationName",
        data: {
          name: identifier.name,
          matchType: match.matchType,
          value: match.value,
          caseMode: match.caseSensitive ? "sensitive" : "insensitive"
        }
      });
    };

    const inspectDeclarationNode = (node) => {
      reportIdentifierIfForbidden(getDeclarationIdentifier(node));
    };

    const inspectMemberNode = (node) => {
      const identifier = getMemberIdentifier(node);
      if (!identifier) {
        return;
      }

      if (ERROR_BOUNDARY_ALLOWED_MEMBER_NAMES.has(identifier.name) && isErrorBoundaryClass(node.parent?.parent)) {
        return;
      }

      reportIdentifierIfForbidden(identifier);
    };

    const inspectFunctionParameters = (node) => {
      const firstParameter = node.params?.[0];
      const promiseExecutorResolveIdentifiers =
        isPromiseExecutorFunction(node) && firstParameter
          ? new Set(
              collectPatternIdentifiers(firstParameter)
                .filter((identifier) => identifier.name === "resolve")
                .map((identifier) => identifier)
            )
          : undefined;

      for (const parameter of node.params ?? []) {
        for (const identifier of collectPatternIdentifiers(parameter)) {
          if (promiseExecutorResolveIdentifiers?.has(identifier)) {
            continue;
          }

          reportIdentifierIfForbidden(identifier);
        }
      }
    };

    return {
      ClassDeclaration: inspectDeclarationNode,
      VariableDeclarator: inspectDeclarationNode,
      TSInterfaceDeclaration: inspectDeclarationNode,
      TSTypeAliasDeclaration: inspectDeclarationNode,
      TSEnumDeclaration: inspectDeclarationNode,
      Property: inspectMemberNode,
      PropertyDefinition: inspectMemberNode,
      MethodDefinition: inspectMemberNode,
      TSPropertySignature: inspectMemberNode,
      TSMethodSignature: inspectMemberNode,
      FunctionExpression: inspectFunctionParameters,
      ArrowFunctionExpression: inspectFunctionParameters,
      FunctionDeclaration: (node) => {
        inspectDeclarationNode(node);
        inspectFunctionParameters(node);
      }
    };
  }
};
