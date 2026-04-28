const mongoose = require("mongoose");
const { Project } = require("../models/Project");
const { User, USER_STATUS } = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const createProject = asyncHandler(async (req: any, res: any) => {
  const { name, description, members = [] } = req.body;

  if (!name) {
    throw new ApiError(400, "Project name is required");
  }

  const validMembers = [];

  if (Array.isArray(members) && members.length > 0) {
    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new ApiError(400, `Invalid member ID: ${memberId}`);
      }

      const user = await User.findById(memberId);

      if (!user) {
        throw new ApiError(404, `User not found for ID: ${memberId}`);
      }

      if (user.status !== USER_STATUS.ACTIVE) {
        throw new ApiError(400, `User ${user.email} is not active`);
      }

      validMembers.push(memberId.toString());
    }
  }

  const allMembers = [...new Set([req.user.userId.toString(), ...validMembers])];

  const project = await Project.create({
    name,
    description,
    createdBy: req.user.userId,
    members: allMembers,
  });

  const populatedProject = await Project.findById(project._id)
    .populate("createdBy", "name email role status")
    .populate("members", "name email role status");

  return res
    .status(201)
    .json(new ApiResponse(201, "Project created successfully", populatedProject));
});

const getMyProjects = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.userId;

  const projects = await Project.find({
    members: userId,
  })
    .populate("createdBy", "name email role status")
    .populate("members", "name email role status")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Projects fetched successfully", {
      count: projects.length,
      projects,
    })
  );
});

const getProjectById = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({
    _id: id,
    members: userId,
  })
    .populate("createdBy", "name email role status")
    .populate("members", "name email role status");

  if (!project) {
    throw new ApiError(404, "Project not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Project fetched successfully", project));
});

const getProjectMembers = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({
    _id: id,
    members: userId,
  }).populate("members", "name email role status");

  if (!project) {
    throw new ApiError(404, "Project not found or access denied");
  }

  return res.status(200).json(
    new ApiResponse(200, "Project members fetched successfully", {
      count: project.members.length,
      members: project.members,
    })
  );
});

const addMembersToProject = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { members } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid project ID");
  }

  if (!Array.isArray(members) || members.length === 0) {
    throw new ApiError(400, "Members array is required");
  }

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const validMembers = [];

  for (const memberId of members) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new ApiError(400, `Invalid member ID: ${memberId}`);
    }

    const user = await User.findById(memberId);

    if (!user) {
      throw new ApiError(404, `User not found for ID: ${memberId}`);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ApiError(400, `User ${user.email} is not active`);
    }

    validMembers.push(memberId.toString());
  }

  const mergedMembers = [
    ...new Set([
      ...project.members.map((member: any) => member.toString()),
      ...validMembers,
    ]),
  ];

  project.members = mergedMembers;
  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate("createdBy", "name email role status")
    .populate("members", "name email role status");

  return res
    .status(200)
    .json(new ApiResponse(200, "Members added successfully", updatedProject));
});

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  getProjectMembers,
  addMembersToProject,
};