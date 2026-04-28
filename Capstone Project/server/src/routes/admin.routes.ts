const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  getAllUsers,
  approveUser,
  deleteUser,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/approve", approveUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
