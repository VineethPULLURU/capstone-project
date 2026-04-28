const ApiError = require("../utils/ApiError");

const notFoundMiddleware = (req: any, res: any, next: any) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

module.exports = notFoundMiddleware;