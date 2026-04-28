const { body } = require("express-validator");
const { TASK_STATUS, TASK_PRIORITY } = require("../models/Task");

const createTaskValidator = [
  body("title")
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Task title must be between 3 and 100 characters")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters")
    .trim(),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium or high"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),

  body("assignedTo")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("assignedTo must be a valid user ID"),
];

const assignTaskValidator = [
  body("assignedTo")
    .notEmpty()
    .withMessage("assignedTo is required")
    .isMongoId()
    .withMessage("assignedTo must be a valid user ID"),
];

const updateTaskValidator = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim(),

  body("priority")
    .optional()
    .isIn(Object.values(TASK_PRIORITY))
    .withMessage("Invalid task priority"),

  body("status")
    .optional()
    .isIn(Object.values(TASK_STATUS))
    .withMessage("Invalid task status"),

  body("assignedTo")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("assignedTo must be a valid user ID"),
];

module.exports = {
  createTaskValidator,
  assignTaskValidator,
  updateTaskValidator,
};
