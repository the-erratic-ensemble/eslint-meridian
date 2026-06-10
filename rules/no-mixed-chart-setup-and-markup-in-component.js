import {
  collectSvgExpressionContainers,
  containsSvgJsx,
  functionReturnsJsx,
  getChartSetupSignalCount,
  getFunctionName,
  getImperativeJsxArrayBuilders,
  getReturnedJsxRoots,
  isComponentLikeFunction,
  isFunctionNode,
} from "./chart-rendering-shared.js";

function countSvgMarkupSignals(node) {
  let count = 0;

  for (const returnedRoot of getReturnedJsxRoots(node)) {
    for (const container of collectSvgExpressionContainers(returnedRoot)) {
      const expression = container.expression;

      if (expression.type === "Literal") {
        continue;
      }

      count += 1;
    }
  }

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
          minChartSetupSignals: { type: "integer", minimum: 1 },
          minSvgMarkupSignals: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      mixedChartSetupAndMarkup:
        "Component '{{name}}' mixes chart setup and dense SVG markup in one render surface ({{setupCount}} chart setup signals, {{markupCount}} SVG expression containers). Extract prepared chart data or mark layers.",
    },
  },

  create(context) {
    const options = {
      minChartSetupSignals: 2,
      minSvgMarkupSignals: 5,
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

      const chartSetupCount = getChartSetupSignalCount(node);
      if (chartSetupCount < options.minChartSetupSignals) {
        return;
      }

      const markupCount = countSvgMarkupSignals(node);
      if (markupCount < options.minSvgMarkupSignals) {
        return;
      }

      const imperativeBuilders = getImperativeJsxArrayBuilders(node);
      if (imperativeBuilders.length === 0) {
        return;
      }

      context.report({
        node,
        messageId: "mixedChartSetupAndMarkup",
        data: {
          name: getFunctionName(node),
          setupCount: String(chartSetupCount),
          markupCount: String(markupCount),
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
