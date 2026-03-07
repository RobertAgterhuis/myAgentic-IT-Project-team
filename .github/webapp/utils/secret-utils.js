#!/usr/bin/env node
// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';

/**
 * Secret-detection shared utilities.
 * Consolidates the repeated secret-warning formatting pattern
 * used across apiSave, apiPostDecision, and apiPostCommand.
 * @module utils/secret-utils
 */

/** @type {string} Canonical warning message for detected secrets. */
const SECRET_WARNING_TEMPLATE =
  'Possible secrets detected ($NAMES). Please verify no sensitive data was submitted.';

/**
 * Format secret-detection warnings into a response-ready array.
 * @param {string[]} warnings - Secret pattern names found.
 * @returns {string[]} Array with a single warning message, or empty array.
 */
function formatSecretWarnings(warnings) {
  if (!warnings || warnings.length === 0) return [];
  return [SECRET_WARNING_TEMPLATE.replace('$NAMES', warnings.join(', '))];
}

/**
 * Attach secret warnings to a response object (mutates in place).
 * @param {object} response - The response object to augment.
 * @param {string[]} warnings - Secret pattern names found.
 * @returns {object} The same response object (for chaining).
 */
function attachSecretWarnings(response, warnings) {
  const formatted = formatSecretWarnings(warnings);
  if (formatted.length > 0) response.warnings = formatted;
  return response;
}

module.exports = { formatSecretWarnings, attachSecretWarnings };
