const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/authcontroller.js');

const router = express.Router();

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

module.exports = router; 