const jwt = require("jsonwebtoken");

const authMiddleware = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
