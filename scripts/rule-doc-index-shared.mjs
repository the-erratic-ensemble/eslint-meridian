import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import {
  meridianLocalPilotRuleProfile,
  meridianLocalRecommendedRuleProfile,
  meridianLocalStrictRuleProfile,
} from "../rules/profile.js";

export const packageRoot = path.resolve(import.meta.dirname, "..");
const rulesDocsDir = path.join(packageRoot, "docs", "rules");
export const generatedIndexPath = path.join(rulesDocsDir, "index.md");

const sectionHeadingPattern = /^##\s+(.+)$/;
const ruleIdPattern = /- Rule ID: `meridian-local\/([^`]+)`/;
const categoryPattern = /- Category: (.+)/;

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n");
}

function trimTrailingBlankLines(text) {
  return text.replace(/\s+$/, "");
}

function parseSections(content) {
  const lines = normalizeLineEndings(content).split("\n");
  const sections = [];
  let current = { heading: null, lines: [] };

  for (const line of lines) {
    const headingMatch = line.match(sectionHeadingPattern);

    if (headingMatch) {
      sections.push(current);
      current = { heading: headingMatch[1], lines: [] };
      continue;
    }

    current.lines.push(line);
  }

  sections.push(current);
  return sections;
}

function getSectionBody(sections, heading) {
  const section = sections.find((candidate) => candidate.heading === heading);
  return trimTrailingBlankLines(section ? section.lines.join("\n") : "");
}

function getOptionSummary(optionsBody) {
  const trimmed = optionsBody.trim();

  if (trimmed === "This rule has no options.") {
    return "none";
  }

  const optionNames = trimmed
    .split("\n")
    .filter((line) => line.startsWith("- `"))
    .map((line) => line.match(/- `([^`]+)`/)?.[1])
    .filter(Boolean);

  return optionNames.length > 0 ? optionNames.join(", ") : "see rule doc";
}

function getRefactorSummary(refactorBody) {
  return refactorBody.trim().split("\n")[0] ?? "see rule doc";
}

function getProfileFlag(profile, ruleId) {
  return Object.prototype.hasOwnProperty.call(
    profile,
    `meridian-local/${ruleId}`,
  ) && profile[`meridian-local/${ruleId}`] !== "off"
    ? true
    : false;
}

export function collectRuleDocPaths() {
  return fs
    .readdirSync(rulesDocsDir)
    .filter((entry) => entry.endsWith(".md") && entry !== "index.md")
    .sort()
    .map((entry) => path.join(rulesDocsDir, entry));
}

function collectRuleIndexEntries() {
  return collectRuleDocPaths().map((absolutePath) => {
    const content = fs.readFileSync(absolutePath, "utf8");
    const sections = parseSections(content);
    const basename = path.basename(absolutePath, ".md");
    const relativeDocPath = `./${path.basename(absolutePath)}`;

    const ruleId = content.match(ruleIdPattern)?.[1] ?? basename;
    const category = content.match(categoryPattern)?.[1] ?? "Uncategorized";
    const optionSummary = getOptionSummary(
      getSectionBody(sections, "Rule Options"),
    );
    const refactorSummary = getRefactorSummary(
      getSectionBody(sections, "Refactor Direction"),
    );

    return {
      basename,
      relativeDocPath,
      ruleId,
      category,
      optionSummary,
      refactorSummary,
      recommended: getProfileFlag(meridianLocalRecommendedRuleProfile, ruleId),
      strict: getProfileFlag(meridianLocalStrictRuleProfile, ruleId),
      pilot: getProfileFlag(meridianLocalPilotRuleProfile, ruleId),
    };
  });
}

function formatProfileFlags({ recommended, strict, pilot }) {
  return `${recommended ? "R" : "-"}${strict ? "S" : "-"}${pilot ? "P" : "-"}`;
}

export async function buildRuleIndexMarkdown() {
  const lines = [
    "<!-- AUTO-GENERATED: run `pnpm generate:docs` -->",
    "",
    "# Meridian Local Rule Reference",
    "",
    "Use this index for a quick scan of the Meridian custom rule set.",
    "",
    "Supporting guides:",
    "",
    "- [Operator guide](../2026-04-23-operator-guide.md)",
    "- [Maintainer guide](../2026-04-23-maintainer-guide.md)",
    "",
    "Legend: `R` = `recommended`, `S` = `strict`, `P` = `pilot`.",
    "",
    "| Rule | Exported Rule ID | Category | Profiles | Options | Preferred refactor |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const entry of collectRuleIndexEntries()) {
    lines.push(
      `| [${entry.basename}](${entry.relativeDocPath}) | \`meridian-local/${entry.ruleId}\` | ${entry.category} | \`${formatProfileFlags(entry)}\` | ${entry.optionSummary} | ${entry.refactorSummary} |`,
    );
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Per-rule pages include profile status, implementation links, test links where available, edge-case guidance for heuristic rules, and refactor direction before suppression guidance.",
  );

  return prettier.format(`${lines.join("\n")}\n`, {
    filepath: generatedIndexPath,
  });
}
