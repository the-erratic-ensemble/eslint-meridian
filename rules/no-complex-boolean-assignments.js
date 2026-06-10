function unwrapExpression(node) {
  if (!node) return null

  if (
    node.type === "ChainExpression" ||
    node.type === "ParenthesizedExpression" ||
    node.type === "TSAsExpression" ||
    node.type === "TSNonNullExpression" ||
    node.type === "TSSatisfiesExpression" ||
    node.type === "TSTypeAssertion"
  ) {
    return unwrapExpression(node.expression)
  }

  return node
}

function walkExpression(node, visitor, logicalDepth = 0) {
  const expression = unwrapExpression(node)
  if (!expression || typeof expression !== "object") return

  visitor(expression, logicalDepth)

  if (
    expression.type === "LogicalExpression" &&
    (expression.operator === "&&" || expression.operator === "||")
  ) {
    const nextDepth = logicalDepth + 1
    walkExpression(expression.left, visitor, nextDepth)
    walkExpression(expression.right, visitor, nextDepth)
    return
  }

  for (const [key, value] of Object.entries(expression)) {
    if (key === "parent" || key === "type") continue

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && typeof child.type === "string") {
          walkExpression(child, visitor, logicalDepth)
        }
      }

      continue
    }

    if (value && typeof value === "object" && typeof value.type === "string") {
      walkExpression(value, visitor, logicalDepth)
    }
  }
}

function collectLogicalStats(node) {
  const operators = new Set()
  let logicalExpressionCount = 0
  let maxLogicalDepth = 0

  walkExpression(node, (child, logicalDepth) => {
    if (
      child.type === "LogicalExpression" &&
      (child.operator === "&&" || child.operator === "||")
    ) {
      logicalExpressionCount += 1
      operators.add(child.operator)
      maxLogicalDepth = Math.max(maxLogicalDepth, logicalDepth + 1)
    }
  })

  return {
    logicalExpressionCount,
    maxLogicalDepth,
    hasMixedOperators: operators.size > 1
  }
}

function matchesBooleanName(name, pattern) {
  if (!name) return false

  try {
    return new RegExp(pattern).test(name)
  } catch {
    return /^(?:is|has|can|should|will|did|needs)[A-Z]|(?:Disabled|Enabled|Visible|Hidden|Selected|Checked|Loading|Submitting|Ready|Pending|Open|Closed|Allowed|Available|Expanded|Collapsed)$/.test(
      name
    )
  }
}

function isBooleanTypeAnnotation(typeAnnotation) {
  if (!typeAnnotation) return false

  if (typeAnnotation.type === "TSBooleanKeyword") {
    return true
  }

  if (typeAnnotation.type === "TSUnionType") {
    const nonNullishTypes = typeAnnotation.types.filter(
      (entry) =>
        entry.type !== "TSNullKeyword" && entry.type !== "TSUndefinedKeyword"
    )

    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((entry) => isBooleanTypeAnnotation(entry))
    )
  }

  return false
}

function hasExplicitBooleanType(node) {
  return isBooleanTypeAnnotation(node.id?.typeAnnotation?.typeAnnotation ?? null)
}

function shouldReportComplexBoolean(node, options) {
  const stats = collectLogicalStats(node)
  if (stats.logicalExpressionCount === 0) {
    return null
  }

  const exceedsLogicalExpressionLimit =
    stats.logicalExpressionCount > options.maxLogicalExpressions
  const exceedsMixedOperatorDepth =
    stats.hasMixedOperators &&
    stats.logicalExpressionCount >= options.minMixedOperatorLogicalExpressions &&
    stats.maxLogicalDepth >= options.minMixedOperatorDepth

  if (!exceedsLogicalExpressionLimit && !exceedsMixedOperatorDepth) {
    return null
  }

  return stats
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when boolean flag variables stage overly complex logical expressions"
    },
    schema: [
      {
        type: "object",
        properties: {
          namePattern: { type: "string" },
          maxLogicalExpressions: { type: "integer", minimum: 1 },
          minMixedOperatorLogicalExpressions: { type: "integer", minimum: 2 },
          minMixedOperatorDepth: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      complexBooleanAssignment:
        "Boolean flag '{{name}}' stages a complex logical expression ({{logicalExpressionCount}} logical operators, depth {{maxLogicalDepth}}). Extract a named guard/helper or flatten the condition."
    }
  },

  create(context) {
    const options = {
      namePattern:
        "^(?:is|has|can|should|will|did|needs)[A-Z]|(?:Disabled|Enabled|Visible|Hidden|Selected|Checked|Loading|Submitting|Ready|Pending|Open|Closed|Allowed|Available|Expanded|Collapsed)$",
      maxLogicalExpressions: 2,
      minMixedOperatorLogicalExpressions: 3,
      minMixedOperatorDepth: 2,
      ...(context.options[0] || {})
    }

    return {
      VariableDeclarator(node) {
        if (node.id?.type !== "Identifier") return
        if (!node.init) return
        if (
          !matchesBooleanName(node.id.name, options.namePattern) &&
          !hasExplicitBooleanType(node)
        ) {
          return
        }

        const stats = shouldReportComplexBoolean(node.init, options)
        if (!stats) return

        context.report({
          node: node.init,
          messageId: "complexBooleanAssignment",
          data: {
            name: node.id.name,
            logicalExpressionCount: String(stats.logicalExpressionCount),
            maxLogicalDepth: String(stats.maxLogicalDepth)
          }
        })
      },

      AssignmentExpression(node) {
        if (node.left?.type !== "Identifier") return
        if (!matchesBooleanName(node.left.name, options.namePattern)) return

        const stats = shouldReportComplexBoolean(node.right, options)
        if (!stats) return

        context.report({
          node: node.right,
          messageId: "complexBooleanAssignment",
          data: {
            name: node.left.name,
            logicalExpressionCount: String(stats.logicalExpressionCount),
            maxLogicalDepth: String(stats.maxLogicalDepth)
          }
        })
      }
    }
  }
}
