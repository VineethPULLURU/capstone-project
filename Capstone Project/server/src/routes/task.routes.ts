const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  assignTaskValidator,
  updateTaskValidator,
} = require("../validators/task.validator");
const {
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTasks);
router.get("/:id", getTaskById);

router.patch(
  "/:id",
  roleMiddleware("admin", "member"),
  updateTaskValidator,
  validate,
  updateTask,
);

router.delete("/:id", roleMiddleware("admin"), deleteTask);

module.exports = router;