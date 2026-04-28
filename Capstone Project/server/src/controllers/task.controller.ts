const mongoose = require("mongoose");
const { Task, TASK_STATUS, TASK_PRIORITY } = require("../models/Task");
const { Project } = require("../models/Project");
const { User, USER_STATUS } = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

import { Request, Response } from "express";

interface AuthRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

interface PopulatedProjectLike {
  _id: string;
  name?: string;
  description?: string;
  members: Array<any>;
}

interface UpdateTaskBody {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  assignedTo?: string | null;
}

const createTaskInProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id: projectId } = req.params;
    const { title, description, priority, status, assignedTo } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid project ID");
    }

    const project = await Project.findOne({
      _id: projectId,
      members: userId,
    });

    if (!project) {
      throw new ApiError(404, "Project not found or access denied");
    }

    let assigneeId: string | null = null;

    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        throw new ApiError(400, "Invalid assignee ID");
      }

      const assignee = await User.findById(assignedTo);

      if (!assignee) {
        throw new ApiError(404, "Assignee user not found");
      }

      if (assignee.status !== USER_STATUS.ACTIVE) {
        throw new ApiError(400, "Assigned user is not active");
      }

      const isMember = project.members.some(
        (member: any) => member.toString() === assignedTo.toString(),
      );

      if (!isMember) {
        throw new ApiError(400, "Assignee must be a member of the project");
      }

      assigneeId = assignedTo;
    }

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      project: projectId,
      assignedTo: assigneeId,
      createdBy: userId,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name description")
      .populate("assignedTo", "name email role status")
      .populate("createdBy", "name email role status");

    return res
      .status(201)
      .json(new ApiResponse(201, "Task created successfully", populatedTask));
  },
);

const getProjectTasks = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id: projectId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid project ID");
    }

    const project = await Project.findOne({
      _id: projectId,
      members: userId,
    });

    if (!project) {
      throw new ApiError(404, "Project not found or access denied");
    }

    const tasks = await Task.find({ project: projectId })
      .populate("project", "name description")
      .populate("assignedTo", "name email role status")
      .populate("createdBy", "name email role status")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, "Tasks fetched successfully", {
        count: tasks.length,
        tasks,
      }),
    );
  },
);

const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;

  let query = {};

  if (role !== "admin") {
    const projects = await Project.find({ members: userId }).select("_id");
    const projectIds = projects.map((project: any) => project._id);
    query = { project: { $in: projectIds } };
  }

  const tasks = await Task.find(query)
    .populate("project", "name description")
    .populate("assignedTo", "name email role status")
    .populate("createdBy", "name email role status")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Tasks fetched successfully", {
      count: tasks.length,
      tasks,
    }),
  );
});

const getTaskById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id)
    .populate("project")
    .populate("assignedTo", "name email role status")
    .populate("createdBy", "name email role status");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const projectDoc = task.project as PopulatedProjectLike;

  const isProjectMember = projectDoc.members.some(
    (member: any) => member.toString() === userId.toString(),
  );

  if (!isProjectMember) {
    throw new ApiError(403, "Access denied for this task");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Task fetched successfully", task));
});

const updateTask = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { title, description, priority, status, assignedTo } =
      req.body as UpdateTaskBody;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid task ID");
    }

    const task = await Task.findById(id).populate("project");

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const projectDoc = task.project as unknown as PopulatedProjectLike;

    const isProjectMember = projectDoc.members.some(
      (member) => member.toString() === userId.toString(),
    );

    if (!isProjectMember) {
      throw new ApiError(403, "Access denied for this task");
    }

    if (role !== "admin") {
      const assignedUserId = task.assignedTo ? task.assignedTo.toString() : null;
      const isAssignedUser = assignedUserId === userId.toString();

      if (!isAssignedUser) {
        throw new ApiError(403, "Only assigned user can update task status");
      }

      const allowedKeys = Object.keys(req.body);
      const onlyStatusUpdate =
        allowedKeys.length === 1 &&
        Object.prototype.hasOwnProperty.call(req.body, "status");

      if (!onlyStatusUpdate) {
        throw new ApiError(403, "Members can update only task status");
      }

      const validTransitions: Record<string, string[]> = {
        [TASK_STATUS.TODO]: [TASK_STATUS.IN_PROGRESS],
        [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.DONE],
        [TASK_STATUS.DONE]: [],
      };

      if (!status || !validTransitions[task.status]?.includes(status)) {
        throw new ApiError(
          400,
          `Invalid status transition from ${task.status} to ${status}`,
        );
      }

      task.status = status as typeof task.status;
    } else {
      if (title !== undefined) {
        task.title = title;
      }

      if (description !== undefined) {
        task.description = description;
      }

      if (priority !== undefined) {
        const allowedPriorities = TASK_PRIORITY
          ? Object.values(TASK_PRIORITY)
          : ["low", "medium", "high"];

        if (!allowedPriorities.includes(priority)) {
          throw new ApiError(400, "Invalid task priority");
        }

        task.priority = priority as typeof task.priority;
      }

      if (status !== undefined) {
        const allowedStatuses = Object.values(TASK_STATUS);

        if (!allowedStatuses.includes(status)) {
          throw new ApiError(400, "Invalid task status");
        }

        task.status = status as typeof task.status;
      }

      if (assignedTo !== undefined) {
        if (assignedTo === null || assignedTo === "") {
          task.assignedTo = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
            throw new ApiError(400, "Invalid assignee ID");
          }

          const assignee = await User.findById(assignedTo);

          if (!assignee) {
            throw new ApiError(404, "Assigned user not found");
          }

          if (assignee.status !== USER_STATUS.ACTIVE) {
            throw new ApiError(400, "Assigned user is not active");
          }

          const isAssigneeMember = projectDoc.members.some(
            (member) => member.toString() === assignedTo.toString(),
          );

          if (!isAssigneeMember) {
            throw new ApiError(400, "Assigned user must be a member of the project");
          }

          task.assignedTo = assignedTo;
        }
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project", "name description")
      .populate("assignedTo", "name email role status")
      .populate("createdBy", "name email role status");

    return res
      .status(200)
      .json(new ApiResponse(200, "Task updated successfully", updatedTask));
  },
);

const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  await Task.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Task deleted successfully", null));
});

module.exports = {
  createTaskInProject,
  getProjectTasks,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};