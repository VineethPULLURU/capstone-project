const jwt = require("jsonwebtoken");

const generateToken = (user: any): string => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      status: user.status,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

module.exports = {
  generateToken,
};