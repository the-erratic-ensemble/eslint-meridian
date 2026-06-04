import fs from "node:fs";
import { buildRuleIndexMarkdown, generatedIndexPath } from "./rule-doc-index-shared.mjs";

fs.writeFileSync(generatedIndexPath, await buildRuleIndexMarkdown());
console.log(`Generated ${generatedIndexPath}.`);
