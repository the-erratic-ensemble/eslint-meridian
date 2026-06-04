import fs from "node:fs";
import path from "node:path";
import {
  buildRuleIndexMarkdown,
  collectRuleDocPaths,
  generatedIndexPath,
  packageRoot,
} from "./rule-doc-index-shared.mjs";

const requiredHeadings = [
  "## Why This Rule Exists",
  "## What It Reports",
  "## Meridian Profile Status",
  "## Source of Truth",
  "## Rule Options",
  "## Examples",
  "## Refactor Direction",
  "## When To Disable",
];

const markdownLinkPattern = /\[[^]]+]\(([^)]+)\)/g;

const issues = [];

function assert(condition, message) {
  if (!condition) {
    issues.push(message);
  }
}

function validateRequiredSections(relativePath, content) {
  for (const heading of requiredHeadings) {
    assert(
      content.includes(heading),
      `${relativePath}: missing required heading "${heading}"`,
    );
  }

  assert(
    content.includes("- `recommended`: "),
    `${relativePath}: missing recommended profile status line`,
  );
  assert(
    content.includes("- `strict`: "),
    `${relativePath}: missing strict profile status line`,
  );
  assert(
    content.includes("- `pilot`: "),
    `${relativePath}: missing pilot profile status line`,
  );
  assert(
    content.includes("- Rule ID: `meridian-local/"),
    `${relativePath}: missing Rule ID line`,
  );
  assert(
    content.includes("- Implementation: ["),
    `${relativePath}: missing implementation link`,
  );
}

function validateLinks(relativePath, content, absolutePath) {
  const links = [...content.matchAll(markdownLinkPattern)].map(
    (match) => match[1],
  );

  for (const target of links) {
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("#")
    ) {
      continue;
    }

    const withoutAnchor = target.split("#")[0];
    const resolved =
      withoutAnchor.startsWith("./") || withoutAnchor.startsWith("../")
        ? path.resolve(path.dirname(absolutePath), withoutAnchor)
        : path.resolve(packageRoot, withoutAnchor);
    assert(
      fs.existsSync(resolved),
      `${relativePath}: broken relative link -> ${target}`,
    );
  }
}

function collectGuideDocPaths() {
  const docsRoot = path.join(packageRoot, "docs");
  const guidePaths = [
    path.join(packageRoot, "README.md"),
    path.join(packageRoot, "DEVELOPMENT.md"),
  ];

  for (const entry of fs.readdirSync(docsRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    guidePaths.push(path.join(docsRoot, entry.name));
  }

  return guidePaths.sort();
}

for (const absolutePath of collectRuleDocPaths()) {
  const relativePath = path.relative(packageRoot, absolutePath);
  const content = fs.readFileSync(absolutePath, "utf8");

  validateRequiredSections(relativePath, content);
  validateLinks(relativePath, content, absolutePath);
}

for (const absolutePath of collectGuideDocPaths()) {
  const relativePath = path.relative(packageRoot, absolutePath);
  const content = fs.readFileSync(absolutePath, "utf8");

  validateLinks(relativePath, content, absolutePath);
}

const generatedIndexContent = await buildRuleIndexMarkdown();
const currentIndexContent = fs.readFileSync(generatedIndexPath, "utf8");

assert(
  currentIndexContent === generatedIndexContent,
  'docs/rules/index.md is stale. Run "pnpm generate:docs".',
);

if (issues.length > 0) {
  console.error("Rule docs validation failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Validated ${collectRuleDocPaths().length} rule docs.`);
