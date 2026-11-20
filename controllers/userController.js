const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const MAX_LENGTH_NAME = 500;
const MAX_LENGTH_EMAIL = 500;

const validateInputLengths = (name, email) => {
  const errors = [];

  if (name && name.length > MAX_LENGTH_NAME) {
    errors.push({ message: 'Name is too long' });
  }

  if (email && email.length > MAX_LENGTH_EMAIL) {
    errors.push({ message: 'Email is too long' });
  }

  return errors;
};
   // GET PENDING REGISTRATION REQUESTS
const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: {
      status: 'inactive',
      userType:{[Op.in]:['employee','teamlead']}
    },
    attributes: { exclude: ['password'] },
    order: [['id', 'DESC']]
  });

  return res.status(200).json({
    data: { users },
    succeeded: true,
    message: "Pending users retrieved successfully"
  });
});
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email } = req.body;

  const lengthErrors = validateInputLengths(name, email);

  if (lengthErrors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: lengthErrors
    });
  }

  next();
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const generateToken = (id, userType, isTeamLead) => {
  return jwt.sign(
    { id, userType, isTeamLead },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required'
    });
  }

  const user = await User.findOne({ where: { email } });
  console.log("DATABASE USER TYPE: ",user?.userType);
  console.log("DATABASE USER NAME:",user?.name);
  if (!user) {
    return res.status(400).json({
      message: 'Invalid email or password'
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Password Match:",isMatch);
  if (!isMatch) {
    return res.status(400).json({
      message: 'Invalid email or password'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      message: 'User is In Active Contact with Admin',
      succeeded: false
    });
  }

  if (user.isTerminated === true) {
    return res.status(403).json({
      message: 'User is Terminated, Contact with Admin',
      succeeded: false
    });
  }

  const { password: _, ...userWithoutPassword } = user.toJSON();

  const token = generateToken(
    user.id,
    user.userType,
    user.isTeamLead
  );

  return res.status(200).json({
    message: 'Login successful',
    succeeded: true,
    user: {
      ...userWithoutPassword,
      token: token
    }
  });
});

// CREATE USER
const createUser = asyncHandler(async (req, res) => {
  try {
    const {
      name, email, password, avatar, userType,
      cnic, cnic_front, cnic_back, phone, joiningDate,
      terminatedDate, status, isTeamLead, isTerminated, teamLeadId
    } = req.body;

    if (!name || !email || !password || !userType || !cnic || !joiningDate || !status) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }


    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const existingCnic = await User.findOne({ where: { cnic } });

    if (existingCnic) {
      return res.status(400).json({
        message: "Cnic already exists"
      });
    }

    if (phone) {
     const existingPhone = await User.findOne({
       where: { phone }
      });
     if (existingPhone) {
    return res.status(400).json({
      message: "Phone already exists"
    });
  }
}
    console.log("Received Password:",password?"YES":"NO");
    const newUser = await User.create({
      name, email, avatar, userType,
      cnic, cnic_front, cnic_back, phone,
      password: password,
      joiningDate, terminatedDate, status,
      isTeamLead, isTerminated, teamLeadId
    });
     console.log("Password Hashed.",newUser.password!==password);
    if (newUser) {
      const { password: _, ...userWithoutPassword } = newUser.toJSON();

      return res.status(200).json({
        data: {
          newUser: userWithoutPassword
        },
        succeeded: true,
        message: "User created successfully"
      });
    }

    return res.status(400).json({
      message: "Invalid user data"
    });

  } catch (error) {
    console.error("Error creating user:", error);

    return res.status(500).json({
      message: "An internal error occurred"
    });
  }
});

// REGISTER USER
// REGISTER USER

  const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Please fill all required fields"
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters"
    });
  }

  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const newUser = await User.create({
    name,
    email,
    password,
    avatar,
    userType: 'employee',
    status: 'inactive'
  });

  return res.status(201).json({
    data: {
      name: newUser.name,
      email: newUser.email,
      status: newUser.status
    },
    succeeded: true,
    message: "Registration submitted. Please wait for Admin approval."
  });
});

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchValue = req.query.searchValue || '';
    const userType = req.query.userType || '';
    const isTeamLead = req.query.isTeamLead || '';
    const status = req.query.status || 'active';

    const skip = (page - 1) * limit;

    const whereCondition = {
      ...(userType
        ? { userType }
        : { userType: { [Op.ne]: 'admin' } }),

      ...(isTeamLead !== ''
        ? { isTeamLead: isTeamLead === 'true' }
        : {}),

      ...(status ? { status } : {}),

      name: {
        [Op.iLike]: `%${searchValue}%`
      }
    };

    const users = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
      offset: skip,
      limit: limit
    });

    const totalUserCount = await User.count({
      where: whereCondition
    });

    const totalPages = Math.ceil((totalUserCount || 0) / limit);

    res.status(200).json({
      data: {
        users: users,
        totalPages,
        currentPage: page,
        totalCount: totalUserCount
      },
      succeeded: true,
      message: "Users retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// GET USERS BY TEAM LEAD
const getUsersByTeamLead = async (req, res) => {
  try {
    const { teamLeadId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchValue = req.query.searchValue || '';
    const status = req.query.status || 'active';

    const skip = (page - 1) * limit;

    if (!teamLeadId) {
      return res.status(400).json({
        message: 'Team Lead ID is required.'
      });
    }

    const whereCondition = {
      teamLeadId: teamLeadId,
      status,
      name: {
        [Op.iLike]: `%${searchValue}%`
      }
    };

    const users = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
      offset: skip,
      limit: limit
    });

    const totalUserCount = await User.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalUserCount / limit);

    res.status(200).json({
      data: {
        users,
        totalPages,
        currentPage: page,
        totalCount: totalUserCount
      },
      succeeded: true,
      message: "Users retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching users by team lead:", error);

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// LOGOUT USER
const logoutUser = (req, res) => {
  res.status(200).json({
    message: 'Logout successful'
  });
};

// UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  try {
         const {
      teamLeadId, name, email, password, avatar, userType,
      cnic, cnic_front, cnic_back, phone, joiningDate,
      terminatedDate, status, isTeamLead, isTerminated
} = req.body;

const id = req.params.id;
const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    // User model hook will hash the password when saved.
    if (password) user.password = password;

    if (avatar) user.avatar = avatar;
    if (userType) user.userType = userType;
    if (cnic) user.cnic = cnic;
    if (cnic_front) user.cnic_front = cnic_front;
    if (cnic_back) user.cnic_back = cnic_back;
    if (phone) user.phone = phone;
    if (joiningDate) user.joiningDate = joiningDate;
    if (terminatedDate) user.terminatedDate = terminatedDate;
    if (status) user.status = status;
    if (teamLeadId) user.teamLeadId = teamLeadId;
    if (isTeamLead !== undefined) user.isTeamLead = isTeamLead;
    if (isTerminated !== undefined) user.isTerminated = isTerminated;

    if (isTerminated === true) {
      user.status = 'inactive';
    }

    await user.save();

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return res.status(200).json({
      data: userWithoutPassword,
      succeeded: true,
      message: "User updated successfully"
    });

  } catch (error) {
    console.error("Error updating user:", error);

    return res.status(500).json({
      message: "An internal error occurred"
    });
  }
});
// handle
    const handleApproveUser = async (userId) => {
  try {
    const session = JSON.parse(
      localStorage.getItem("agri_session")
    );

    const response = await fetch(
      `http://localhost:5000/api/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          id: userId,
          status: "active"
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Approval failed");
    }

    setPendingUsers((previousUsers) =>
      previousUsers.filter((user) => user.id !== userId)
    );

    alert("User approved successfully!");
  } catch (error) {
    console.error("Approval error:", error);
    alert(error.message);
  }
};
// GET USER BY ID
const getUserById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      data: user,
      succeeded: true,
      message: "User fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching user:", error);

    return res.status(500).json({
      message: "An internal error occurred"
    });
  }
});

// DELETE USER
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await user.destroy();

    res.status(200).json({
      succeeded: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user", error);

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createUser,
  registerUser,
  getAllUsers,
  getPendingUsers,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  handleValidationErrors,
  getUserById,
  getUsersByTeamLead
};