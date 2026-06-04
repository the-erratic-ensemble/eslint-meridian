---
title: "Meridian Custom Lint Rules Standalone Extraction Checklist"
type: "guide"
description: "Checklist for moving @meridian/eslint-rules out of the Meridian monorepo into a standalone repository or broader distribution lane."
status: "active"
date created: "2026-04-25"
date modified: "2026-04-25"
---

# Meridian Custom Lint Rules Standalone Extraction Checklist

Use this checklist when `@meridian/eslint-rules` is being moved out of the Meridian monorepo or prepared for broader distribution than the current private standalone package.

## Package Contract

- replace monorepo `repository`, `homepage`, and `bugs` metadata with the standalone package home
- make an explicit license decision; do not carry `UNLICENSED` into a broader distribution path by inertia
- confirm the exported subpath contract is still the intended public surface
- re-run packed-artifact consumer smoke using the new repository/package location

## Tooling and Support

- confirm supported Node, ESLint, parser, and Oxlint versions against the target consumer environments
- decide whether flat-config-only remains the intended support posture
- verify package-manager assumptions if distribution is no longer Meridian-only

## Ownership and Operations

- assign changelog ownership and release responsibility in the new home
- define issue-routing and documentation ownership outside the monorepo
- re-check any remaining monorepo-relative doc links and repo-specific examples

## Consumer Confidence

- validate one real ESLint consumer through the published package name
- validate one Oxlint consumer through the published package name or documented artifact path
- confirm direct dependents no longer rely on monorepo-only import assumptions
