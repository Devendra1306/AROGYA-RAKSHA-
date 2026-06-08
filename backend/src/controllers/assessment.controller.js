const HealthProfile = require('../models/HealthProfile');
const HealthAssessment = require('../models/HealthAssessment');
const localDb = require('../utils/localDb');
const aiGateway = require('../services/aiGateway.service');

const assessmentController = {
  generate: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let profile;
      if (isMock) {
        profile = localDb.findOne('healthProfiles', { userId: req.user._id });
      } else {
        profile = await HealthProfile.findOne({ userId: req.user._id });
      }

      if (!profile) {
        return res.status(404).json({ error: 'Please set up your health profile first before generating an assessment.' });
      }

      // Calculate factors
      const age = profile.age;
      const heightM = profile.height / 100;
      const bmi = Number((profile.weight / (heightM * heightM)).toFixed(1));

      // Calculate individual scores
      let activityScore = 50;
      if (profile.activityLevel === 'Lightly Active') activityScore = 70;
      if (profile.activityLevel === 'Moderately Active') activityScore = 85;
      if (profile.activityLevel === 'Very Active') activityScore = 100;

      let sleepScore = 50;
      if (profile.sleepDuration >= 7 && profile.sleepDuration <= 9) sleepScore = 100;
      else if (profile.sleepDuration === 6 || profile.sleepDuration === 10) sleepScore = 75;

      let hydrationScore = Math.min(100, Math.round((profile.waterIntake / 3) * 100));

      let stressScore = 50;
      if (profile.stressLevel === 'Low') stressScore = 100;
      if (profile.stressLevel === 'Moderate') stressScore = 75;

      let weightScore = 50;
      if (bmi >= 18.5 && bmi <= 24.9) weightScore = 100;
      else if (bmi >= 25 && bmi <= 29.9) weightScore = 75;

      let nutritionScore = 80;
      if (profile.dietPreference === 'Vegetarian') nutritionScore = 85;
      if (profile.dietPreference === 'Vegan') nutritionScore = 90;

      let conditionsScore = Math.max(10, 100 - (profile.medicalConditions?.filter(c => c !== 'None').length || 0) * 15);

      // Weighted Health Score Calculation
      const healthScore = Math.round(
        (activityScore * 0.20) +
        (weightScore * 0.20) +
        (sleepScore * 0.15) +
        (hydrationScore * 0.10) +
        (nutritionScore * 0.15) +
        (conditionsScore * 0.10) +
        (stressScore * 0.10)
      );

      // Risk Factors Identification
      const riskFactors = [];
      if (bmi >= 30) {
        riskFactors.push({
          name: 'Obesity Risk',
          level: 'High',
          description: `Your BMI is ${bmi}, which is classified as obese.`,
          advice: 'Focus on calorie-deficit meals, regular cardio, and consulting a nutritionist.'
        });
      } else if (bmi >= 25) {
        riskFactors.push({
          name: 'Overweight Risk',
          level: 'Moderate',
          description: `Your BMI is ${bmi}, indicating you are slightly overweight.`,
          advice: 'Incorporate 150 minutes of moderate activity weekly and monitor carbohydrate portions.'
        });
      }

      if (profile.medicalConditions?.includes('Diabetes')) {
        riskFactors.push({
          name: 'Diabetic Complications',
          level: 'High',
          description: 'You have diagnosed diabetes.',
          advice: 'Strictly monitor blood sugar, restrict simple sugars, and inspect feet daily for injuries.'
        });
      }

      if (profile.sleepDuration < 6) {
        riskFactors.push({
          name: 'Sleep Deficiency Risk',
          level: 'Moderate',
          description: `You sleep ${profile.sleepDuration} hours nightly, which is below the recommended minimum.`,
          advice: 'Establish a screen-free wind-down routine 1 hour before bedtime.'
        });
      }

      if (profile.stressLevel === 'High') {
        riskFactors.push({
          name: 'High Chronic Stress',
          level: 'High',
          description: 'You report high stress levels.',
          advice: 'Practice 10 minutes of deep breathing or guided meditation daily.'
        });
      }

      // Generate Recommendations
      const recommendations = [
        `Activity: Increase your physical exercise to at least 3-4 days a week to boost your cardiovascular health.`,
        `Sleep: Maintain a consistent sleeping schedule of 7 to 8 hours daily.`,
        `Hydration: Ensure you drink at least 3.0 Liters of water daily to maintain cognitive function and metabolism.`,
        `Diet: Align meals with your health goals (${profile.healthGoal}) and budget (${profile.budgetPreference}).`
      ];

      // Query Gemini for natural language analysis
      const aiPrompt = `Analyze this user health assessment data. Health Score is ${healthScore}/100.
Vitals: BMI is ${bmi}, Age is ${age}, Gender is ${profile.gender}.
Lifestyle: Sleep ${profile.sleepDuration} hours, Water ${profile.waterIntake}L, Stress is ${profile.stressLevel}.
Existing conditions: ${profile.medicalConditions?.join(', ') || 'None'}.
Please write a short (3-4 sentences) natural-language medical analysis summarizing their health status and providing encouraging feedback.`;

      const aiResponse = await aiGateway.generateResponse(aiPrompt, profile);
      const healthAnalysis = aiResult => aiResult.response || 'Your overall health score is moderate. Focus on sleeping and staying hydrated.';
      const analysisText = aiResponse.response;

      const assessmentData = {
        userId: req.user._id,
        healthScore,
        activityScore,
        nutritionScore,
        sleepScore,
        hydrationScore,
        stressScore,
        riskFactors,
        recommendations,
        analysisText,
        generatedAt: new Date().toISOString()
      };

      let newAssessment;
      if (isMock) {
        newAssessment = localDb.create('healthAssessments', assessmentData);
        localDb.findByIdAndUpdate('healthProfiles', profile._id, { healthScore });
      } else {
        newAssessment = await HealthAssessment.create(assessmentData);
        await HealthProfile.findByIdAndUpdate(profile._id, { healthScore });
      }

      res.status(201).json(newAssessment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getLatest: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let assessment = null;
      if (isMock) {
        const list = localDb.find('healthAssessments', { userId: req.user._id });
        if (list.length > 0) {
          // Get latest by date
          list.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
          assessment = list[0];
        }
      } else {
        assessment = await HealthAssessment.findOne({ userId: req.user._id }).sort({ generatedAt: -1 });
      }

      if (!assessment) return res.status(404).json({ error: 'No health assessments generated yet.' });
      res.json(assessment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let list = [];
      if (isMock) {
        list = localDb.find('healthAssessments', { userId: req.user._id });
        list.sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));
      } else {
        list = await HealthAssessment.find({ userId: req.user._id }).sort({ generatedAt: 1 });
      }
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = assessmentController;
