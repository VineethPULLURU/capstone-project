const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
