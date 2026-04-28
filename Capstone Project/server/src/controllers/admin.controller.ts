const { User, USER_STATUS, USER_ROLES } = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getAllUsers = asyncHandler(async (req: any, res: any) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Users fetched successfully", {
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
    throw new ApiError(400, "User is already active");
  }

  user.status = USER_STATUS.ACTIVE;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "User approved successfully", user));
});

const deleteUser = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === USER_ROLES.ADMIN) {
    throw new ApiError(400, "Admin users cannot be deleted");
  }

  await User.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "User deleted successfully", null));
});

module.exports = {
  getAllUsers,
  approveUser,
  deleteUser,
};
