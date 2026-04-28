const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { updateProfileValidator } = require("../validators/user.validator");
const { USER_ROLES } = require("../models/User");
const {
  getUsers,
  getMyProfile,
  updateMyProfile,
  getPendingUsers,
  approveUser,
  rejectUser,
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/profile", authMiddleware, getMyProfile);
router.get("/", authMiddleware, roleMiddleware("admin"), getUsers);
router.patch(
  "/profile",
  authMiddleware,
  updateProfileValidator,
  validate,
  updateMyProfile,
);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  getPendingUsers,
);

router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  approveUser,
);

router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  rejectUser,
);

module.exports = router;
