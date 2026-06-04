import meridianLocalRulesPlugin from "../rules/eslint-local-rules.js";

const meridianLocalOxlintPlugin = {
  meta: {
    name: "meridian-local"
  },
  rules: meridianLocalRulesPlugin.rules
};

export default meridianLocalOxlintPlugin;
