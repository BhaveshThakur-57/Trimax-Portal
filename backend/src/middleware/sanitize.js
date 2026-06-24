/**
 * Sanitize user-supplied strings that will be used in MongoDB $regex.
 * Escapes all regex special characters to prevent ReDoS.
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Strip dangerous fields from req.body to prevent mass-assignment.
 * Call this in routes where raw body should not overwrite sensitive fields.
 */
const stripDangerousFields = (body, forbiddenFields) => {
  const cleaned = { ...body };
  for (const field of forbiddenFields) {
    delete cleaned[field];
  }
  return cleaned;
};

// Fields that should NEVER be set via user input
const PROTECTED_USER_FIELDS = [
  'role', 'isActive', 'resetPasswordToken', 'resetPasswordExpire',
  'createdBy', 'password', 'employeeId', '_id', '__v',
  '__proto__', 'constructor', 'prototype',
];

const PROTECTED_EMPLOYEE_UPDATE_FIELDS = [
  'role', 'resetPasswordToken', 'resetPasswordExpire',
  'password', '_id', '__v', '__proto__', 'constructor', 'prototype',
];

module.exports = {
  escapeRegex,
  stripDangerousFields,
  PROTECTED_USER_FIELDS,
  PROTECTED_EMPLOYEE_UPDATE_FIELDS,
};
