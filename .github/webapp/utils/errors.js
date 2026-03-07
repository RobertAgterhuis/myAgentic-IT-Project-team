// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';

/**
 * Standardized error response format for the API.
 * Each error includes: code, message (user-friendly), and recovery action.
 */

const ERROR_CATALOG = {
  VALIDATION_ERROR:      { message: 'The request contains invalid data.',          recovery: 'Check your input and try again.' },
  FILE_NOT_FOUND:        { message: 'The requested file was not found.',           recovery: 'Refresh the page to reload the latest data.' },
  DECISIONS_NOT_FOUND:   { message: 'The decisions file is missing.',              recovery: 'Ensure decisions.md exists in your workspace.' },
  INVALID_ACTION:        { message: 'The requested action is not recognized.',     recovery: 'Check the action name and try again.' },
  UNKNOWN_COMMAND:       { message: 'The command is not recognized.',              recovery: 'Check available commands in the help section.' },
  INVALID_TOPIC:         { message: 'The help topic identifier is invalid.',       recovery: 'Use a valid topic from the help index.' },
  TOPIC_NOT_FOUND:       { message: 'The help topic was not found.',               recovery: 'Check the help index for available topics.' },
  NOT_FOUND:             { message: 'The requested resource was not found.',       recovery: 'Check the URL and try again.' },
  PATH_TRAVERSAL:        { message: 'Access to this path is not allowed.',         recovery: 'Use only valid file paths within the workspace.' },
  PAYLOAD_TOO_LARGE:     { message: 'The request is too large to process.',        recovery: 'Reduce the size of the data being sent.' },
  INVALID_CONTENT_TYPE:  { message: 'The request content type is not supported.',  recovery: 'Send requests with Content-Type: application/json.' },
  INVALID_JSON:          { message: 'The request body contains invalid JSON.',     recovery: 'Check the JSON syntax and try again.' },
  INVALID_INPUT:         { message: 'One or more input fields are invalid.',       recovery: 'Review the field requirements and try again.' },
  METHOD_NOT_ALLOWED:    { message: 'This HTTP method is not supported here.',     recovery: 'Use a supported HTTP method for this endpoint.' },
  INTERNAL_ERROR:        { message: 'An unexpected server error occurred.',        recovery: 'Try again. If the problem persists, check server logs.' },
};

const STATUS_TO_CODE = {
  400: 'VALIDATION_ERROR',
  403: 'PATH_TRAVERSAL',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'INVALID_CONTENT_TYPE',
};

/**
 * Build a standardized error response object.
 * @param {string} code - Error code from ERROR_CATALOG
 * @param {string} [detail] - Optional detail overriding the default message
 * @returns {{ error: string, code: string, message: string, recovery: string }}
 */
function errorResponse(code, detail) {
  const entry = ERROR_CATALOG[code] || ERROR_CATALOG.INTERNAL_ERROR;
  return {
    error: detail || entry.message,
    code: ERROR_CATALOG[code] ? code : 'INTERNAL_ERROR',
    message: detail || entry.message,
    recovery: entry.recovery,
  };
}

/**
 * Map an HTTP status code to a default error code.
 * @param {number} status
 * @returns {string}
 */
function statusToCode(status) {
  return STATUS_TO_CODE[status] || 'INTERNAL_ERROR';
}

module.exports = { ERROR_CATALOG, errorResponse, statusToCode };
