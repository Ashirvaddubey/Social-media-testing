const express = require("express");
const Register = require('../models/register.model.js')
const router = express.Router();
const { validationResult } = require("express-validator");
const fetchuser = require("../middleware/Fetchuser.js");

router.get("/", fetchuser, async (req, res) => {
  try {
    // Get user details from token
    const userId = req.user.id;
    
    // Find user by ID
    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Return user details
    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        followers: user.followers || [],
        followings: user.followings || []
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
});

module.exports = router;