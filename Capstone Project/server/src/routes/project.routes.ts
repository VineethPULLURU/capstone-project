const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createProjectValidator,
  addMembersValidator,
} = require("../validators/project.validator");
const { createTaskValidator } = require("../validators/task.validator");
const {
  createProject,
  getMyProjects,
  getProjectById,
  addMembersToProject,
  getProjectMembers,
} = require("../controllers/project.controller");
const {
  getProjectTasks,
  createTaskInProject,
} = require("../controllers/task.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyProjects);
router.post(
  "/",
  roleMiddleware("admin"),
  createProjectValidator,
  validate,
  createProject,
);

router.get("/:id/members", getProjectMembers);

router.patch(
  "/:id/members",
  roleMiddleware("admin"),
  addMembersValidator,
  validate,
  addMembersToProject,
);

router.get("/:id/tasks", getProjectTasks);

router.post(
  "/:id/tasks",
  roleMiddleware("admin", "member"),
  createTaskValidator,
  validate,
  createTaskInProject,
);

router.get("/:id", getProjectById);

module.exports = router;
