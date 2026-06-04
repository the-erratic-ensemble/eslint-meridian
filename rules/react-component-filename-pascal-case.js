// eslint/rules/react-component-filename-pascal-case.js
import path from "node:path";

const NEXT_APP_ROUTE_FILE_NAMES = new Set([
  "page",
  "layout",
  "loading",
  "error",
  "not-found",
  "template",
  "default",
  "route"
]);

function isPascalCase(name) {
  return /^[A-Z][\dA-Za-z]*$/.test(name);
}

function isPascalCaseFilename(filename) {
  return /^[A-Z][\dA-Za-z]*$/.test(filename);
}

function isJsxNode(node) {
  return node && (node.type === "JSXElement" || node.type === "JSXFragment");
}

function functionReturnsJsx(functionNode) {
  if (!functionNode) return false;

  // Arrow fn with implicit return: const A = () => <div />
  if (functionNode.type === "ArrowFunctionExpression" && isJsxNode(functionNode.body)) {
    return true;
  }

  if (!functionNode.body || functionNode.body.type !== "BlockStatement") {
    return false;
  }

  for (const stmt of functionNode.body.body) {
    if (stmt.type === "ReturnStatement" && isJsxNode(stmt.argument)) {
      return true;
    }
  }

  return false;
}

function getTopLevelPascalCaseComponentNames(program) {
  const names = new Set();

  for (const stmt of program.body) {
    // function MyComponent() { return <div /> }
    if (stmt.type === "FunctionDeclaration" && stmt.id && isPascalCase(stmt.id.name) && functionReturnsJsx(stmt)) {
      names.add(stmt.id.name);
    }

    // const MyComponent = () => <div />
    // const MyComponent = function () { return <div /> }
    if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        if (
          decl.id?.type === "Identifier" &&
          isPascalCase(decl.id.name) &&
          decl.init &&
          (decl.init.type === "ArrowFunctionExpression" || decl.init.type === "FunctionExpression") &&
          functionReturnsJsx(decl.init)
        ) {
          names.add(decl.id.name);
        }
      }
    }

    // class MyComponent extends React.Component {}
    if (stmt.type === "ClassDeclaration" && stmt.id && isPascalCase(stmt.id.name)) {
      names.add(stmt.id.name);
    }

    // export default function MyComponent() { return <div /> }
    if (stmt.type === "ExportDefaultDeclaration") {
      const d = stmt.declaration;

      if (d?.type === "FunctionDeclaration" && d.id && isPascalCase(d.id.name) && functionReturnsJsx(d)) {
        names.add(d.id.name);
      }

      if (d?.type === "ClassDeclaration" && d.id && isPascalCase(d.id.name)) {
        names.add(d.id.name);
      }

      // export default MyComponent;
      if (d?.type === "Identifier" && isPascalCase(d.name)) {
        names.add(d.name);
      }
    }

    // export const MyComponent = () => <div />
    if (stmt.type === "ExportNamedDeclaration" && stmt.declaration?.type === "VariableDeclaration") {
      for (const decl of stmt.declaration.declarations) {
        if (
          decl.id?.type === "Identifier" &&
          isPascalCase(decl.id.name) &&
          decl.init &&
          (decl.init.type === "ArrowFunctionExpression" || decl.init.type === "FunctionExpression") &&
          functionReturnsJsx(decl.init)
        ) {
          names.add(decl.id.name);
        }
      }
    }

    if (stmt.type === "ExportNamedDeclaration" && stmt.declaration?.type === "FunctionDeclaration") {
      const function_ = stmt.declaration;
      if (function_.id && isPascalCase(function_.id.name) && functionReturnsJsx(function_)) {
        names.add(function_.id.name);
      }
    }
  }

  return [...names];
}

function isNextAppRouteFile(filename, extension, base) {
  if (!filename.includes(`${path.sep}app${path.sep}`)) {
    return false;
  }

  return NEXT_APP_ROUTE_FILE_NAMES.has(base) && [".jsx", ".tsx"].includes(extension);
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require PascalCase filenames for files that define a React component"
    },
    schema: [
      {
        type: "object",
        properties: {
          ignore: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      notPascal:
        "This file defines a React component ({{components}}), so the filename should be PascalCase. Rename '{{actual}}' to '{{expected}}'."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const extension = path.extname(filename);
    const base = path.basename(filename, extension);

    if (![".jsx", ".tsx"].includes(extension)) {
      return {};
    }

    const ignore = new Set(context.options[0]?.ignore ?? ["index"]);

    if (ignore.has(base)) {
      return {};
    }

    if (isNextAppRouteFile(filename, extension, base)) {
      return {};
    }

    return {
      Program(node) {
        const componentNames = getTopLevelPascalCaseComponentNames(node);

        if (componentNames.length === 0) {
          return;
        }

        if (isPascalCaseFilename(base)) {
          return;
        }

        const expected = componentNames[0];

        context.report({
          node,
          messageId: "notPascal",
          data: {
            components: componentNames.join(", "),
            actual: base + extension,
            expected: expected + extension
          }
        });
      }
    };
  }
};
