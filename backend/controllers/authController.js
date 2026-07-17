const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authModel = require("../models/authModel");

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "2h";

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      stallName,
      cuisine,
      hawkerCenter,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        error: "First name, last name, email, password and role are required",
      });
    }

    if (!["customer", "vendor"].includes(role)) {
      return res.status(400).json({
        error: "Role must be either 'customer' or 'vendor'",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    if (role === "vendor" && !stallName) {
      return res.status(400).json({
        error: "Stall name is required to register as a vendor",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await authModel.findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Every account gets a unique, auto-generated userId from the database
    const newUser = await authModel.createUser({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      passwordHash,
      role,
    });

    if (role === "customer") {
      const customerRecord = await authModel.linkCustomerRecord(
        newUser.userId,
        `${firstName} ${lastName}`,
        normalizedEmail,
      );

      newUser.customerId = customerRecord.customerId;
      newUser.stallId = null;
    } else {
      const stallRecord = await authModel.linkStallRecord(
        newUser.userId,
        stallName,
        cuisine,
        hawkerCenter,
      );

      newUser.stallId = stallRecord.stallId;
      newUser.customerId = null;
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      error: "Unable to register account",
      details: error.message,
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await authModel.findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        error: "Incorrect email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Incorrect email or password",
      });
    }

    const token = generateToken(user);

    // Never send the password hash back to the client
    delete user.passwordHash;

    return res.status(200).json({
      message: "Login successful",
      token,
      user, // includes the unique userId
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Unable to log in",
      details: error.message,
    });
  }
}

// GET /api/auth/me  (requires verifyToken)
async function getProfile(req, res) {
  try {
    const user = await authModel.findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      error: "Unable to retrieve profile",
      details: error.message,
    });
  }
}

// PUT /api/auth/me  (requires verifyToken)
async function updateProfile(req, res) {
  try {
    const { firstName, lastName, phone } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        error: "First name and last name are required",
      });
    }

    const updatedUser = await authModel.updateUser(req.user.userId, {
      firstName,
      lastName,
      phone,
    });

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      error: "Unable to update profile",
      details: error.message,
    });
  }
}

// DELETE /api/auth/me  (requires verifyToken)
async function deleteAccount(req, res) {
  try {
    const deletedUser = await authModel.deleteUser(req.user.userId);

    if (!deletedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      error: "Unable to delete account",
      details: error.message,
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
};
