require('dotenv').config()
const express = require('express')
const Register = require('../models/register.model.js')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fetchuser = require('../middleware/Fetchuser')
const JWT_SECRET = process.env.JWT_SECRET

// ROUTE 1: Register a new user
router.post(
  '/register',
  [
    body('name', 'Enter a valid name').isLength({ min: 5 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'password must be of minimum 6 characters').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    try {
      // Check for existing user
      let user = await Register.findOne({ email: req.body.email })
      if (user) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with this email'
        })
      }

      // Create new user
      const salt = await bcrypt.genSalt(10)
      const secpass = await bcrypt.hash(req.body.password, salt)
      
      user = await Register.create({
        name: req.body.name,
        email: req.body.email,
        password: secpass,
      })

      // Generate token
      const data = {
        user: {
          id: user.id,
          name: user.name,
        },
      }
      const authtoken = jwt.sign(data, JWT_SECRET)

      return res.status(200).json({ 
        success: true, 
        msg: "Registered Successfully",
        token: authtoken
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error' 
      })
    }
  },
)

// ROUTE 2: User Login
router.post(
  '/login',
  [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { email, password } = req.body

      // Check if user exists
      let user = await Register.findOne({ email })
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        })
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        })
      }

      // Generate token
      const data = {
        user: {
          id: user.id,
          email: user.email,
        },
      }
      const authtoken = jwt.sign(data, JWT_SECRET)
      
      return res.status(200).json({ 
        success: true, 
        token: authtoken 
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error' 
      })
    }
  },
)

module.exports = router