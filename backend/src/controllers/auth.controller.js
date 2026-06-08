const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const localDb = require('../utils/localDb');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d'
  });
}

// Helper to calculate Health Score and BMI
function calculateHealthScoreAndBMI(weight, height, age, activityLevel, sleepDuration, waterIntake, stressLevel, medicalConditions) {
  // Height in cm, Weight in kg
  const heightMeters = height / 100;
  const bmi = Number((weight / (heightMeters * heightMeters)).toFixed(1));

  // Base score 100, apply deductibles
  let score = 100;

  // BMI deductions (normal is 18.5 - 24.9)
  if (bmi < 18.5 || bmi > 25) {
    score -= 10;
  }
  if (bmi > 30) {
    score -= 10; // Obesity deduction
  }

  // Activity level additions/deductions
  if (activityLevel === 'Sedentary') score -= 10;
  if (activityLevel === 'Very Active') score += 5;

  // Sleep deductions (ideal is 7-9 hours)
  if (sleepDuration < 6 || sleepDuration > 9) {
    score -= 10;
  }

  // Hydration deductions (ideal is >= 3L)
  if (waterIntake < 2.5) {
    score -= 10;
  }

  // Stress level deductions
  if (stressLevel === 'High') score -= 10;

  // Medical conditions deductions
  if (medicalConditions && medicalConditions.length > 0 && !medicalConditions.includes('None')) {
    score -= (medicalConditions.length * 5);
  }

  // Clip score between 0 and 100
  score = Math.max(10, Math.min(100, score));

  return { bmi, healthScore: score };
}

const authController = {
  register: async (req, res) => {
    const { firstName, lastName, email, mobile, password } = req.body;

    if (!firstName || !lastName || !email || !mobile || !password) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    try {
      const isMock = global.isMockDB;
      let existingUser;

      if (isMock) {
        existingUser = localDb.findOne('users', { email });
      } else {
        existingUser = await User.findOne({ email });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email address.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      let newUser;
      const userData = {
        firstName,
        lastName,
        email,
        mobile,
        passwordHash,
        role: 'User',
        emailVerified: true, // Auto-verified for demo
        profileCompleted: false
      };

      if (isMock) {
        newUser = localDb.create('users', userData);
      } else {
        newUser = await User.create(userData);
      }

      const token = generateToken(newUser);
      res.status(201).json({
        message: 'Registration successful.',
        token,
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          mobile: newUser.mobile,
          role: newUser.role,
          profileCompleted: newUser.profileCompleted
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    try {
      const isMock = global.isMockDB;
      let user;

      if (isMock) {
        user = localDb.findOne('users', { email });
      } else {
        user = await User.findOne({ email });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken(user);
      res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          profileCompleted: user.profileCompleted
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  googleLogin: async (req, res) => {
    const { token: googleToken, email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google email is required.' });
    }

    try {
      const isMock = global.isMockDB;
      let user;

      if (isMock) {
        user = localDb.findOne('users', { email });
      } else {
        user = await User.findOne({ email });
      }

      // If user does not exist, register them automatically
      if (!user) {
        const userData = {
          firstName: firstName || 'GoogleUser',
          lastName: lastName || 'Account',
          email,
          mobile: 'N/A',
          passwordHash: 'oauth_managed', // flag that it's Google Auth
          role: 'User',
          emailVerified: true,
          profileCompleted: false
        };

        if (isMock) {
          user = localDb.create('users', userData);
        } else {
          user = await User.create(userData);
        }
      }

      // Generate app session token
      const sessionToken = generateToken(user);
      res.json({
        message: 'Google Login successful.',
        token: sessionToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          profileCompleted: user.profileCompleted
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let profile = null;

      if (isMock) {
        profile = localDb.findOne('healthProfiles', { userId: req.user._id });
      } else {
        profile = await HealthProfile.findOne({ userId: req.user._id });
      }

      res.json({
        user: {
          id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          mobile: req.user.mobile,
          role: req.user.role,
          profileCompleted: req.user.profileCompleted
        },
        profile
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  setupProfile: async (req, res) => {
    const {
      age, gender, height, weight, bloodGroup,
      activityLevel, exerciseFrequency, waterIntake, sleepDuration, stressLevel,
      medicalConditions, allergies, medications, familyHistory,
      dietPreference, foodRestrictions, favoriteFoods, dislikedFoods, budgetPreference,
      healthGoal, targetDuration
    } = req.body;

    if (!age || !gender || !height || !weight || !bloodGroup) {
      return res.status(400).json({ error: 'Please fill in all personal details.' });
    }

    try {
      const { healthScore } = calculateHealthScoreAndBMI(
        Number(weight), Number(height), Number(age),
        activityLevel, Number(sleepDuration), Number(waterIntake), stressLevel,
        medicalConditions
      );

      const isMock = global.isMockDB;
      let profile;

      const profileData = {
        userId: req.user._id,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        bloodGroup,
        activityLevel,
        exerciseFrequency,
        waterIntake: Number(waterIntake),
        sleepDuration: Number(sleepDuration),
        stressLevel,
        medicalConditions: Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions],
        allergies: Array.isArray(allergies) ? allergies : [allergies],
        medications: Array.isArray(medications) ? medications : [medications],
        familyHistory: Array.isArray(familyHistory) ? familyHistory : [familyHistory],
        dietPreference,
        foodRestrictions: Array.isArray(foodRestrictions) ? foodRestrictions : [foodRestrictions],
        favoriteFoods: Array.isArray(favoriteFoods) ? favoriteFoods : [favoriteFoods],
        dislikedFoods: Array.isArray(dislikedFoods) ? dislikedFoods : [dislikedFoods],
        budgetPreference: budgetPreference || 'Medium Budget',
        healthGoal,
        targetDuration,
        healthScore
      };

      if (isMock) {
        const existing = localDb.findOne('healthProfiles', { userId: req.user._id });
        if (existing) {
          profile = localDb.findByIdAndUpdate('healthProfiles', existing._id, profileData);
        } else {
          profile = localDb.create('healthProfiles', profileData);
        }
        // Mark profile completed
        localDb.findByIdAndUpdate('users', req.user._id, { profileCompleted: true });
      } else {
        profile = await HealthProfile.findOneAndUpdate(
          { userId: req.user._id },
          profileData,
          { upsert: true, new: true }
        );
        await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });
      }

      // Generate seed assessment record
      const assessmentData = {
        userId: req.user._id,
        healthScore,
        activityScore: activityLevel === 'Sedentary' ? 50 : activityLevel === 'Lightly Active' ? 70 : 90,
        nutritionScore: dietPreference === 'Vegetarian' ? 85 : 80,
        sleepScore: Number(sleepDuration) >= 7 ? 90 : 60,
        hydrationScore: Number(waterIntake) >= 3 ? 95 : 70,
        stressScore: stressLevel === 'Low' ? 95 : stressLevel === 'Moderate' ? 75 : 45,
        riskFactors: (medicalConditions || []).filter(c => c !== 'None').map(c => ({
          name: c,
          level: 'Moderate',
          description: `Existing condition ${c}`,
          advice: 'Consult doctor for disease tracking.'
        })),
        recommendations: [
          `Drink at least ${waterIntake} liters of water daily.`,
          `Maintain ${sleepDuration} hours of sleep nightly.`,
          `Set primary focus on your health goal: ${healthGoal}.`
        ]
      };

      if (isMock) {
        localDb.create('healthAssessments', assessmentData);
      } else {
        const HealthAssessment = require('../models/HealthAssessment');
        await HealthAssessment.create(assessmentData);
      }

      res.json({
        message: 'Health profile updated successfully.',
        profileCompleted: true,
        profile
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      if (isMock) {
        localDb.findByIdAndDelete('users', req.user._id);
        const profile = localDb.findOne('healthProfiles', { userId: req.user._id });
        if (profile) localDb.findByIdAndDelete('healthProfiles', profile._id);
      } else {
        await User.findByIdAndDelete(req.user._id);
        await HealthProfile.findOneAndDelete({ userId: req.user._id });
      }
      res.json({ message: 'Account deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  exportPDF: async (req, res) => {
    // Generate text/JSON representing PDF for front-end parsing
    try {
      const isMock = global.isMockDB;
      let profile;
      if (isMock) {
        profile = localDb.findOne('healthProfiles', { userId: req.user._id });
      } else {
        profile = await HealthProfile.findOne({ userId: req.user._id });
      }

      if (!profile) return res.status(404).json({ error: 'No health profile found to export.' });

      res.setHeader('Content-Type', 'application/json');
      res.json({
        title: 'Arogya Raksha Clinical Health Profile Summary',
        generatedAt: new Date().toISOString(),
        user: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          mobile: req.user.mobile
        },
        profile: {
          vitals: {
            age: profile.age,
            gender: profile.gender,
            height: `${profile.height} cm`,
            weight: `${profile.weight} kg`,
            bloodGroup: profile.bloodGroup,
            bmi: (profile.weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1)
          },
          lifestyle: {
            activity: profile.activityLevel,
            sleep: `${profile.sleepDuration} hours/night`,
            water: `${profile.waterIntake} liters/day`,
            stress: profile.stressLevel
          },
          medical: {
            conditions: profile.medicalConditions || [],
            allergies: profile.allergies || [],
            medications: profile.medications || [],
            familyHistory: profile.familyHistory || []
          },
          diet: {
            preference: profile.dietPreference,
            restrictions: profile.foodRestrictions || [],
            goal: profile.healthGoal
          },
          healthScore: `${profile.healthScore}/100`
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = authController;
