const SVG_TAG_NAMES = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "text",
  "tspan",
  "polyline",
  "polygon",
  "ellipse",
  "defs",
  "clipPath",
  "title",
]);

const CHART_SETUP_CALL_NAMES = new Set([
  "scaleLinear",
  "scaleBand",
  "scaleSqrt",
  "scaleTime",
  "scalePoint",
  "scaleLog",
  "line",
  "area",
  "arc",
  "pie",
  "stack",
  "hierarchy",
  "treemap",
]);

export function walk(node, visitor) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (typeof node.type === "string") {
    visitor(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        walk(child, visitor);
      }
    } else if (value && typeof value === "object") {
      walk(value, visitor);
    }
  }
}

export function isFunctionNode(node) {
  return Boolean(
    node &&
    (node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"),
  );
}

export function walkWithoutNestedFunctions(node, visitor, rootNode = node) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (typeof node.type === "string") {
    visitor(node);
  }

  if (node !== rootNode && isFunctionNode(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        walkWithoutNestedFunctions(child, visitor, rootNode);
      }
    } else if (value && typeof value === "object") {
      walkWithoutNestedFunctions(value, visitor, rootNode);
    }
  }
}

export function unwrapExpression(node) {
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
}

export function getJsxElementName(node) {
  if (!node) {
    return null;
  }

  const openingElement =
    node.type === "JSXElement" ? node.openingElement : null;
  const nameNode = openingElement?.name;

  if (!nameNode) {
    return null;
  }

  if (nameNode.type === "JSXIdentifier") {
    return nameNode.name;
  }

  if (nameNode.type === "JSXMemberExpression") {
    return nameNode.property?.name ?? null;
  }

  return null;
}

export function isSvgJsxElement(node) {
  const name = getJsxElementName(node);
  return name ? SVG_TAG_NAMES.has(name) : false;
}

export function containsSvgJsx(node) {
  let found = false;

  walk(node, (child) => {
    if (found) {
      return;
    }

    if (child.type === "JSXElement" && isSvgJsxElement(child)) {
      found = true;
    }
  });

  return found;
}

export function containsJsxValue(node) {
  const expression = unwrapExpression(node);
  if (!expression) {
    return false;
  }

  switch (expression.type) {
    case "JSXElement":
    case "JSXFragment": {
      return true;
    }

    case "ConditionalExpression": {
      return (
        containsJsxValue(expression.consequent) ||
        containsJsxValue(expression.alternate)
      );
    }

    case "LogicalExpression": {
      return (
        containsJsxValue(expression.left) || containsJsxValue(expression.right)
      );
    }

    case "SequenceExpression": {
      return expression.expressions.some((entry) => containsJsxValue(entry));
    }

    default: {
      return false;
    }
  }
}

export function functionReturnsJsx(node) {
  if (!node) {
    return false;
  }

  if (
    node.type === "ArrowFunctionExpression" &&
    node.body.type !== "BlockStatement"
  ) {
    return containsJsxValue(node.body);
  }

  const statements = node.body?.body ?? [];
  return statements.some(
    (statement) =>
      statement.type === "ReturnStatement" &&
      containsJsxValue(statement.argument),
  );
}

export function getReturnedJsxRoots(node) {
  const roots = [];

  if (!node) {
    return roots;
  }

  if (
    node.type === "ArrowFunctionExpression" &&
    node.body.type !== "BlockStatement"
  ) {
    if (containsJsxValue(node.body)) {
      roots.push(node.body);
    }

    return roots;
  }

  for (const statement of node.body?.body ?? []) {
    if (
      statement.type !== "ReturnStatement" ||
      !containsJsxValue(statement.argument)
    ) {
      continue;
    }

    roots.push(statement.argument);
  }

  return roots;
}

export function getFunctionName(node) {
  if (!node) {
    return "function";
  }

  if (node.type === "FunctionDeclaration" && node.id?.name) {
    return node.id.name;
  }

  if (
    (node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression") &&
    node.parent
  ) {
    if (
      node.parent.type === "VariableDeclarator" &&
      node.parent.id.type === "Identifier"
    ) {
      return node.parent.id.name;
    }

    if (
      node.parent.type === "Property" &&
      node.parent.key.type === "Identifier"
    ) {
      return node.parent.key.name;
    }
  }

  return "function";
}

export function isComponentLikeFunction(node) {
  const name = getFunctionName(node);
  return /^[A-Z]/u.test(name) && functionReturnsJsx(node);
}

export function isLoopNode(node) {
  return Boolean(
    node &&
    (node.type === "ForStatement" ||
      node.type === "ForOfStatement" ||
      node.type === "ForInStatement" ||
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement"),
  );
}

export function getChartSetupSignalCount(node) {
  let count = 0;

  walkWithoutNestedFunctions(node.body, (child) => {
    if (child.type !== "CallExpression") {
      return;
    }

    const callee = unwrapExpression(child.callee);
    if (!callee) {
      return;
    }

    if (
      callee.type === "Identifier" &&
      CHART_SETUP_CALL_NAMES.has(callee.name)
    ) {
      count += 1;
      return;
    }

    if (
      callee.type === "CallExpression" &&
      callee.callee.type === "Identifier" &&
      CHART_SETUP_CALL_NAMES.has(callee.callee.name)
    ) {
      count += 1;
    }
  });

  return count;
}

export function findVariable(scope, name) {
  let currentScope = scope;

  while (currentScope) {
    const variable = currentScope.set?.get(name);
    if (variable) {
      return variable;
    }

    currentScope = currentScope.upper;
  }

  return null;
}

export function getFunctionNodeFromVariable(variable) {
  for (const definition of variable?.defs ?? []) {
    if (
      definition.type === "FunctionName" &&
      definition.node?.type === "FunctionDeclaration"
    ) {
      return definition.node;
    }

    if (
      definition.type !== "Variable" ||
      definition.node?.type !== "VariableDeclarator"
    ) {
      continue;
    }

    const init = definition.node.init;
    if (
      init?.type === "ArrowFunctionExpression" ||
      init?.type === "FunctionExpression"
    ) {
      return init;
    }
  }

  return null;
}

export function collectSvgExpressionContainers(node) {
  const containers = [];

  function visit(currentNode, insideSvg) {
    if (!currentNode || typeof currentNode !== "object") {
      return;
    }

    const nextInsideSvg =
      insideSvg ||
      (currentNode.type === "JSXElement" && isSvgJsxElement(currentNode));

    if (nextInsideSvg && currentNode.type === "JSXExpressionContainer") {
      containers.push(currentNode);
    }

    for (const [key, value] of Object.entries(currentNode)) {
      if (key === "parent") {
        continue;
      }

      if (Array.isArray(value)) {
        for (const child of value) {
          visit(child, nextInsideSvg);
        }
      } else if (value && typeof value === "object") {
        visit(value, nextInsideSvg);
      }
    }
  }

  visit(node, false);
  return containers;
}

export function getImperativeJsxArrayBuilders(node) {
  const renderedIdentifiers = new Set();

  for (const returnedRoot of getReturnedJsxRoots(node)) {
    walk(returnedRoot, (child) => {
      if (child.type !== "JSXExpressionContainer") {
        return;
      }

      const expression = unwrapExpression(child.expression);
      if (expression?.type === "Identifier") {
        renderedIdentifiers.add(expression.name);
      }
    });
  }

  const builders = [];

  walkWithoutNestedFunctions(node.body, (child) => {
    if (
      child.type !== "VariableDeclarator" ||
      child.id.type !== "Identifier" ||
      child.init?.type !== "ArrayExpression" ||
      child.init.elements.length !== 0 ||
      !renderedIdentifiers.has(child.id.name)
    ) {
      return;
    }

    let pushesJsxInsideLoop = false;

    walkWithoutNestedFunctions(node.body, (candidate) => {
      if (!isLoopNode(candidate) || pushesJsxInsideLoop) {
        return;
      }

      walkWithoutNestedFunctions(candidate.body ?? candidate, (loopChild) => {
        if (loopChild.type !== "CallExpression") {
          return;
        }

        if (
          loopChild.callee.type !== "MemberExpression" ||
          loopChild.callee.computed ||
          loopChild.callee.object.type !== "Identifier" ||
          loopChild.callee.object.name !== child.id.name ||
          loopChild.callee.property.type !== "Identifier" ||
          loopChild.callee.property.name !== "push"
        ) {
          return;
        }

        if (
          loopChild.arguments.some((argument) => containsJsxValue(argument))
        ) {
          pushesJsxInsideLoop = true;
        }
      });
    });

    if (pushesJsxInsideLoop) {
      builders.push({
        name: child.id.name,
        node: child,
      });
    }
  });

  return builders;
}

export function getManualFindLoopSignals(node) {
  const declarations = new Map();

  for (const statement of node.body?.body ?? []) {
    if (statement.type !== "VariableDeclaration") {
      continue;
    }

    for (const declaration of statement.declarations) {
      if (declaration.id.type !== "Identifier") {
        continue;
      }

      const init = unwrapExpression(declaration.init);
      if (
        init === null ||
        init?.type === "Literal" ||
        init?.type === "Identifier"
      ) {
        declarations.set(declaration.id.name, declaration);
      }
    }
  }

  const signals = [];

  walkWithoutNestedFunctions(node.body, (child) => {
    if (child.type !== "ForOfStatement") {
      return;
    }

    const loopVariable =
      child.left.type === "VariableDeclaration"
        ? child.left.declarations[0]?.id
        : child.left;

    if (!loopVariable || loopVariable.type !== "Identifier") {
      return;
    }

    const statements =
      child.body.type === "BlockStatement" ? child.body.body : [child.body];
    if (statements.length !== 1 || statements[0].type !== "IfStatement") {
      return;
    }

    const consequentStatements =
      statements[0].consequent.type === "BlockStatement"
        ? statements[0].consequent.body
        : [statements[0].consequent];

    if (consequentStatements.length < 2) {
      return;
    }

    const assignmentStatement = consequentStatements.find(
      (entry) => entry.type === "ExpressionStatement",
    );
    const breakStatement = consequentStatements.find(
      (entry) => entry.type === "BreakStatement",
    );

    if (!assignmentStatement || !breakStatement) {
      return;
    }

    const assignment = assignmentStatement.expression;
    if (
      assignment.type !== "AssignmentExpression" ||
      assignment.operator !== "=" ||
      assignment.left.type !== "Identifier" ||
      assignment.right.type !== "Identifier" ||
      assignment.right.name !== loopVariable.name ||
      !declarations.has(assignment.left.name)
    ) {
      return;
    }

    signals.push({
      node: child,
      targetName: assignment.left.name,
      itemName: loopVariable.name,
    });
  });

  return signals;
}

export function getDerivedDataSignalCount(node) {
  let count = 0;

  for (const statement of node.body?.body ?? []) {
    if (statement.type !== "VariableDeclaration") {
      continue;
    }

    for (const declaration of statement.declarations) {
      const init = unwrapExpression(declaration.init);
      if (!init) {
        continue;
      }

      if (
        init.type === "CallExpression" ||
        init.type === "ConditionalExpression" ||
        init.type === "TemplateLiteral"
      ) {
        count += 1;
      }
    }
  }

  return count;
}
