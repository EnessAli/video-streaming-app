/*
  Request validation middleware
  Checks express-validator results,
  returns 400 if there are errors and does not continue
*/
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }
  next();
};

module.exports = validate;
