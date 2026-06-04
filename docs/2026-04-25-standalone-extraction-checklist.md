---
title: "Meridian Custom Lint Rules Standalone Extraction Checklist"
type: "guide"
description: "Checklist for moving eslint-meridian into a new repository, owner, or distribution lane."
status: "active"
date created: "2026-04-25"
date modified: "2026-06-04"
---

# Meridian Custom Lint Rules Standalone Extraction Checklist

Use this checklist when `eslint-meridian` is moving to a new repository, owner, or release lane.

## Package Contract

- replace `repository`, `homepage`, and `bugs` metadata with the new package home
- make an explicit license decision; do not carry `UNLICENSED` into a broader distribution path by inertia
- confirm the exported subpath contract is still the intended public surface
- re-run packed-artifact consumer smoke using the new repository/package location

## Tooling and Support

- confirm supported Node, ESLint, parser, and Oxlint versions against the target consumer environments
- decide whether flat-config-only remains the intended support posture
- verify package-manager assumptions if distribution is no longer Meridian-only

## Ownership and Operations

- assign changelog ownership and release responsibility in the new home
- define issue-routing and documentation ownership in the new home
- re-check any remaining repo-specific doc links and examples

## Consumer Confidence

- validate one real ESLint consumer through the published package name
- validate one Oxlint consumer through the published package name or documented artifact path
- confirm direct dependents no longer rely on old repository-only import assumptions
