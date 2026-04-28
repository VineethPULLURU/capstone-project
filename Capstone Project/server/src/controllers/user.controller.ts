const { User, USER_STATUS } = require("../models/User");
const allowedFields = require("../utils/allowedFields");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (req: any, res: any) => {
  const { status } = req.query;

  let activeStatus = "";

  if (status) {
    const allowedStatuses = Object.values(USER_STATUS);

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid user status filter");
    }

    activeStatus = status;
  }

  const users = await User.find({ status: activeStatus || USER_STATUS.ACTIVE })
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Users fetched successfully", {
      count: users.length,
      users,
    }),
  );
});

const getMyProfile = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.userId;

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile fetched successfully", user));
});

const updateMyProfile = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.userId;

  const filteredData = allowedFields(req.body, ["name"]);

  if (Object.keys(filteredData).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (filteredData.email && filteredData.email !== user.email) {
    const existingUser = await User.findOne({ email: filteredData.email });

    if (existingUser) {
      throw new ApiError(409, "Email is already in use");
    }
  }

  Object.assign(user, filteredData);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", user));
});

const getPendingUsers = asyncHandler(async (_req: any, res: any) => {
  const users = await User.find({ status: USER_STATUS.PENDING })
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Pending users fetched successfully", {
      count: users.length,
      users,
    }),
  );
});

const approveUser = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === USER_STATUS.ACTIVE) {
    throw new ApiError(400, "User is already approved");
  }

  user.status = USER_STATUS.ACTIVE;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "User approved successfully", user));
});

const rejectUser = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === USER_STATUS.REJECTED) {
    throw new ApiError(400, "User is already rejected");
  }

  user.status = USER_STATUS.REJECTED;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "User rejected successfully", user));
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPendingUsers,
  approveUser,
  rejectUser,
  getUsers,
};
