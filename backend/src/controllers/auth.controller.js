const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || 're_Z1B2qbtH_LhxFu4y1W4Nqw9KHB5XZ3GfM');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const localDb = require('../utils/localDb');
const { JWT_SECRET } = require('../middleware/auth');

const googleClient = new OAuth2Client();

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
          profileCompleted: user.profileCompleted,
          profilePicture: user.profilePicture
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  googleLogin: async (req, res) => {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google auth token is required.' });
    }

    try {
      let email;
      let firstName = 'GoogleUser';
      let lastName = 'Account';
      let googleId = '';
      let profilePicture = '';

      const clientId = process.env.GOOGLE_CLIENT_ID;

      // Verify Google token if CLIENT_ID is configured and token is not simulated
      if (googleToken !== 'simulated_oauth_token' && clientId) {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: clientId
          });
          const payload = ticket.getPayload();
          email = payload.email;
          firstName = payload.given_name || 'GoogleUser';
          lastName = payload.family_name || 'Account';
          googleId = payload.sub;
          profilePicture = payload.picture || '';
        } catch (verifyErr) {
          console.error('Google token verification failed:', verifyErr.message);
          return res.status(401).json({ error: 'Google authentication failed: Invalid token.' });
        }
      } else {
        // Simulated / Local Development Fallback
        email = req.body.email;
        firstName = req.body.firstName || 'GoogleUser';
        lastName = req.body.lastName || 'Account';
        googleId = 'simulated_google_id_' + email;
        profilePicture = '';

        if (!email) {
          return res.status(400).json({ error: 'Email is required for simulated login.' });
        }
      }

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
          firstName,
          lastName,
          email,
          mobile: 'N/A',
          passwordHash: 'oauth_managed', // flag that it's Google Auth
          googleId,
          authProvider: 'google',
          profilePicture,
          role: 'User',
          emailVerified: true,
          profileCompleted: false
        };

        if (isMock) {
          user = localDb.create('users', userData);
        } else {
          user = await User.create(userData);
        }
      } else {
        // If user already exists, update their Google ID, profile picture and provider if not set
        const updateData = {};
        let needsUpdate = false;
        if (!user.googleId) {
          updateData.googleId = googleId;
          needsUpdate = true;
        }
        if (!user.profilePicture && profilePicture) {
          updateData.profilePicture = profilePicture;
          needsUpdate = true;
        }
        if (user.authProvider === 'local') {
          updateData.authProvider = 'google';
          needsUpdate = true;
        }

        if (needsUpdate) {
          if (isMock) {
            user = localDb.findByIdAndUpdate('users', user._id, updateData);
          } else {
            user = await User.findByIdAndUpdate(user._id, { $set: updateData }, { new: true });
          }
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
          profileCompleted: user.profileCompleted,
          profilePicture: user.profilePicture || profilePicture
        }
      });
    } catch (err) {
      console.error('Unhandled googleLogin error:', err);
      res.status(500).json({ error: err.message || 'An error occurred during Google authentication.' });
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
          profileCompleted: req.user.profileCompleted,
          profilePicture: req.user.profilePicture
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
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address.' });
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
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      if (user.authProvider === 'google') {
        return res.status(400).json({
          error: 'This account is managed through Google Sign-In. Please use your Google account to access Arogya Raksha.'
        });
      }

      const token = crypto.randomBytes(20).toString('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      if (isMock) {
        localDb.findByIdAndUpdate('users', user._id, {
          resetPasswordToken: token,
          resetPasswordExpires: expires.toISOString()
        });
      } else {
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();
      }

      const origin = req.headers.origin || 'http://localhost:5173';
      const resetLink = `${origin}/reset-password/${token}`;

      // Premium-styled Email HTML Template
      const emailHtml = `
        <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center; color: #334155;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; text-align: left;">
            
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; padding: 12px; background-color: #0284c7; border-radius: 16px; color: #ffffff; font-weight: bold; font-size: 20px; text-decoration: none;">
                🏥 Arogya Raksha
              </div>
            </div>

            <h2 style="font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">Reset Your Password</h2>
            
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetLink}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3); transition: all 0.2s;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 0; margin-bottom: 20px; text-align: center;">This link expires in 15 minutes.</p>
            
            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; font-size: 13px; color: #94a3b8; text-align: center;">
              <p style="margin: 0 0 8px 0;">If you did not request this password reset, please ignore this email.</p>
            </div>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Arogya Raksha <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset Your Arogya Raksha Password',
        html: emailHtml
      });

      res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (err) {
      console.error('Error in forgotPassword:', err.message);
      res.status(500).json({ error: err.message });
    }
  },

  resetPassword: async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    try {
      const isMock = global.isMockDB;
      let user;

      if (isMock) {
        user = localDb.findOne('users', { resetPasswordToken: token });
      } else {
        user = await User.findOne({ resetPasswordToken: token });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid password reset link.' });
      }

      const expiryTime = isMock ? new Date(user.resetPasswordExpires) : user.resetPasswordExpires;
      if (new Date() > expiryTime) {
        return res.status(400).json({ error: 'This password reset link has expired. Please request a new password reset link.' });
      }

      // Password rules validation
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const isLongEnough = password.length >= 8;

      if (!isLongEnough || !hasUppercase || !hasLowercase || !hasNumber) {
        return res.status(400).json({
          error: 'Password does not meet rules: must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      if (isMock) {
        localDb.findByIdAndUpdate('users', user._id, {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null
        });
      } else {
        user.passwordHash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
      }

      res.status(200).json({ message: 'Password updated successfully. Please login with your new password.' });
    } catch (err) {
      console.error('Error in resetPassword:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = authController;
