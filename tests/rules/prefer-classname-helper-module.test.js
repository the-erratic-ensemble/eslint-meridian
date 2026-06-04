import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../prefer-classname-helper-module.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "prefer-classname-helper-module";

test("allows short class helper calls", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={clsx("card", activeClassName, sizeClassName)} />;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports class helper calls with too many arguments", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={clsx("card", activeClassName, sizeClassName, toneClassName)} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "extractClassnameHelper");
});

test("reports class helper calls containing conditional logic", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={clsx("card", isActive && "card-active")} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "extractClassnameHelper");
});

test("reports template literals with too many expressions", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={\`\${baseClass} \${sizeClass} \${toneClass}\`} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "extractClassnameHelper");
});
