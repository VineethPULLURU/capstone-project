const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const loggerMiddleware = require("./middlewares/logger.middleware");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("/{*splat}", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(loggerMiddleware);

app.get("/", (req: any, res: any) => {
  res.status(200).json({
    success: true,
    message: "Mini Jira API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
