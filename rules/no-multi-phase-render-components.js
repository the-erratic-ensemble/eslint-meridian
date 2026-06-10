import {
  containsSvgJsx,
  functionReturnsJsx,
  getChartSetupSignalCount,
  getDerivedDataSignalCount,
  getFunctionName,
  getImperativeJsxArrayBuilders,
  getManualFindLoopSignals,
  getReturnedJsxRoots,
  isComponentLikeFunction,
  isFunctionNode,
} from "./chart-rendering-shared.js";

function getSvgMapSignalCount(node) {
  let count = 0;

  for (const returnedRoot of getReturnedJsxRoots(node)) {
    if (!containsSvgJsx(returnedRoot)) {
      continue;
    }

    const source = contextSourceHack(returnedRoot);
    count += source;
  }

  return count;
}

function contextSourceHack(returnedRoot) {
  let count = 0;

  const visit = (node, insideSvg) => {
    if (!node || typeof node !== "object") {
      return;
    }

    const nextInsideSvg =
      insideSvg ||
      (node.type === "JSXElement" &&
        node.openingElement?.name?.type === "JSXIdentifier" &&
        node.openingElement.name.name === "svg");

    if (
      nextInsideSvg &&
      node.type === "CallExpression" &&
      node.callee.type === "MemberExpression" &&
      !node.callee.computed &&
      node.callee.property.type === "Identifier" &&
      node.callee.property.name === "map"
    ) {
      count += 1;
    }

    for (const [key, value] of Object.entries(node)) {
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
  };

  visit(returnedRoot, false);
  return count;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [
      {
        type: "object",
        properties: {
          minPhases: { type: "integer", minimum: 2 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      multiPhaseRenderComponent:
        "Component '{{name}}' handles too many render phases in one function ({{phaseCount}} phases: {{phases}}). Extract prepared chart data, selection logic, or mark layers.",
    },
  },

  create(context) {
    const options = {
      minPhases: 4,
      ...(context.options[0] || {}),
    };

    function checkFunction(node) {
      if (
        !isFunctionNode(node) ||
        !isComponentLikeFunction(node) ||
        !functionReturnsJsx(node)
      ) {
        return;
      }

      const returnedRoots = getReturnedJsxRoots(node);
      if (
        returnedRoots.length === 0 ||
        !returnedRoots.some((entry) => containsSvgJsx(entry))
      ) {
        return;
      }

      const phases = [];

      if (getDerivedDataSignalCount(node) >= 3) {
        phases.push("derived data");
      }

      if (getChartSetupSignalCount(node) >= 2) {
        phases.push("chart setup");
      }

      if (getManualFindLoopSignals(node).length > 0) {
        phases.push("selection scan");
      }

      if (
        getImperativeJsxArrayBuilders(node).length > 0 ||
        getSvgMapSignalCount(node) >= 2
      ) {
        phases.push("mark building");
      }

      phases.push("svg markup");

      if (phases.length < options.minPhases) {
        return;
      }

      context.report({
        node,
        messageId: "multiPhaseRenderComponent",
        data: {
          name: getFunctionName(node),
          phaseCount: String(phases.length),
          phases: phases.join(", "),
        },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
