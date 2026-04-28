const { body } = require("express-validator");

const createProjectValidator = [
  body("name")
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters")
    .trim(),

  body("members").optional().isArray().withMessage("Members must be an array"),
];

const addMembersValidator = [
  body("members")
    .isArray({ min: 1 })
    .withMessage("Members must be a non-empty array"),
];

module.exports = {
  createProjectValidator,
  addMembersValidator,
};
