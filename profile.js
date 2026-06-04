import fs from "node:fs";

const recommendedOxlintRuleConfig = JSON.parse(
  fs.readFileSync(new URL("oxlint/meridian-local-rules.json", import.meta.url), "utf8")
);

const STRICT_ADDITIONS = {
  "meridian-local/no-deep-optional-chaining-conditions": "warn",
  "meridian-local/no-mixed-ui-and-domain-logic-in-component": "warn"
};

const PILOT_OVERRIDES = {
  "meridian-local/no-inline-object-literals-in-jsx": "warn"
};

const cloneRules = (rules) => structuredClone(rules ?? {});

export const meridianLocalRecommendedRuleProfile = cloneRules(recommendedOxlintRuleConfig.rules);
export const meridianLocalStrictRuleProfile = {
  ...cloneRules(meridianLocalRecommendedRuleProfile),
  ...cloneRules(STRICT_ADDITIONS)
};
export const meridianLocalPilotRuleProfile = {
  ...cloneRules(meridianLocalStrictRuleProfile),
  ...cloneRules(PILOT_OVERRIDES)
};

export const meridianLocalRuleProfiles = {
  recommended: meridianLocalRecommendedRuleProfile,
  strict: meridianLocalStrictRuleProfile,
  pilot: meridianLocalPilotRuleProfile
};

export const meridianLocalProfileNames = Object.freeze(Object.keys(meridianLocalRuleProfiles));

export function getMeridianLocalRuleProfile(profileName = "recommended") {
  const profile = meridianLocalRuleProfiles[profileName];

  if (!profile) {
    throw new Error(
      `Unknown meridian-local profile \"${profileName}\". Expected one of: ${meridianLocalProfileNames.join(", ")}.`
    );
  }

  return cloneRules(profile);
}
