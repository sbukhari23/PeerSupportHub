const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Validation for creating habits
const habitValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Habit name is required')
    .isLength({ max: 100 }).withMessage('Habit name too long'),
  body('category')
    .optional()
    .isIn(['Wellness', 'Productivity', 'Learning', 'Social', 'Career'])
    .withMessage('Invalid category'),
  body('dailyWindowStart')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
  body('dailyWindowEnd')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)')
];

// Validation for creating groups
const groupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Group name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Group name must be 3-100 characters'),
  body('type')
    .optional()
    .isIn(['Pod', 'FocusedSpace', 'AnonymousVent']).withMessage('Invalid group type'),
  body('topicFocus')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Topic focus too long')
];

// Validation for messages
const messageValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message too long (max 2000 characters)')
];

// Validation for MongoDB ObjectId params
const objectIdValidation = (paramName) => [
  param(paramName)
    .matches(/^[0-9a-fA-F]{24}$/).withMessage(`Invalid ${paramName} format`)
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  habitValidation,
  groupValidation,
  messageValidation,
  objectIdValidation,
};
