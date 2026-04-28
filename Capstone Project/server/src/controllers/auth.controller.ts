const { User, USER_STATUS, USER_ROLES } = require("../models/User");
const { generateToken } = require("../utils/token");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const signup = asyncHandler(async (req: any, res: any) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: USER_ROLES.MEMBER,
    status: USER_STATUS.PENDING,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      "Signup successful. Your account is pending admin approval.",
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    ),
  );
});

const login = asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status === USER_STATUS.PENDING) {
    throw new ApiError(403, "Your account is pending admin approval");
  }

  if (user.status === USER_STATUS.REJECTED) {
    throw new ApiError(403, "Your account has been rejected");
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, "Your account is not active");
  }

  const userObject = user.toObject();
  delete userObject.password;

  const token = generateToken({
    _id: user._id,
    email: user.email,
    role: user.role,
  });

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user: userObject,
      token,
    }),
  );
});

module.exports = {
  signup,
  login,
};
