import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import School from '../models/School.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'resource_bridge_secure_jwt_secret_key_2026';

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      schoolId: user.schoolId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Please provide both username/email and password' });
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    // Find by username or email
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }]
    }).populate('schoolId');

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        school: user.schoolId || null
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register-school
router.post('/register-school', async (req, res) => {
  try {
    const {
      schoolCode,
      schoolName,
      district,
      address,
      latitude,
      longitude,
      contactNumber,
      principalName,
      studentCount,
      classroomCount,
      username,
      password,
      email
    } = req.body;

    // Basic Validation
    if (!schoolCode || !schoolName || !district || !username || !password || !email) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    // Check if schoolCode or username or email already exists
    const existingSchool = await School.findOne({ schoolCode: schoolCode.trim().toUpperCase() });
    if (existingSchool) {
      return res.status(400).json({ error: `School Code '${schoolCode}' is already registered` });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username.trim().toLowerCase() }, { email: email.trim().toLowerCase() }]
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or Email is already in use' });
    }

    // 1. Create School Record
    const newSchool = await School.create({
      schoolCode: schoolCode.trim().toUpperCase(),
      schoolName: schoolName.trim(),
      district: district.trim(),
      address: address ? address.trim() : 'District Education Zone',
      latitude: latitude ? Number(latitude) : 28.6139,
      longitude: longitude ? Number(longitude) : 77.2090,
      contactNumber: contactNumber ? contactNumber.trim() : '+91 00000 00000',
      principalName: principalName ? principalName.trim() : 'Principal Officer',
      studentCount: studentCount ? Number(studentCount) : 0,
      classroomCount: classroomCount ? Number(classroomCount) : 0
    });

    // 2. Hash Password and Create User Record
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: principalName ? `${principalName} (Principal)` : `${schoolName} Admin`,
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      email: email.trim().toLowerCase(),
      role: 'SCHOOL',
      schoolId: newSchool._id
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'School registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        school: newSchool
      }
    });
  } catch (error) {
    console.error('[Auth Register Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me (Current user session)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).populate('schoolId');
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists' });
    }

    res.json({
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      school: user.schoolId || null
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
});

export default router;
