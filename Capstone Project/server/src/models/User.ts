const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const { Schema } = mongoose;

const USER_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
};

const USER_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
};

interface IUser {
  name: string;
  email: string;
  password: string;
  role: "admin" | "member";
  status: "pending" | "active" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
  isModified(path: string): boolean;
}

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value: string) {
          return validator.isEmail(value);
        },
        message: "Please provide a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: [USER_ROLES.ADMIN, USER_ROLES.MEMBER],
        message: "Role must be either admin or member",
      },
      default: USER_ROLES.MEMBER,
    },

    status: {
      type: String,
      enum: {
        values: [USER_STATUS.PENDING, USER_STATUS.ACTIVE, USER_STATUS.REJECTED],
        message: "Status must be either pending, active, or rejected",
      },
      default: USER_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
  this: IUser,
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = {
  User,
  USER_ROLES,
  USER_STATUS,
};
