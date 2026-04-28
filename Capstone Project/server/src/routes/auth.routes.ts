const express = require("express");
const { signup, login } = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const {
  signupValidator,
  loginValidator,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", signupValidator, validate, signup);
router.post("/login", loginValidator, validate, login);

module.exports = router;
