const bcrypt = require('bcryptjs');
const User = require('../models/authmodel.js');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { name, phone, password } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate phone number format
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
    }

    // Check if user already exists with this phone number
    console.log('Checking for existing user with phone:', phone);
    const existingUser = await User.findOne({ phone });
    console.log('Existing user check result:', existingUser);
    
    if (existingUser) {
      console.log('User already exists with this phone number');
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword
    });

    console.log('Attempting to save new user:', { name: user.name, phone: user.phone });
    await user.save();
    console.log('User saved successfully');

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error details:', error);
    if (error.code === 11000) {
      console.log('Duplicate key error - phone number already exists');
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Error registering user' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    };

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Since we're using JWT, we don't need to do anything on the server
    // The client should remove the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error logging out' });
  }
};

module.exports = { registerUser, loginUser, logoutUser };
  