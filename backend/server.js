require('dotenv').config({ path: '../.env' });
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { seedDatabase } = require('./src/config/seed');
const aiGateway = require('./src/services/aiGateway.service');

const PORT = process.env.PORT || 5000;

// Start server after connecting to database (or using mock fallback)
async function startServer() {
  await connectDB();
  await seedDatabase();
  
  // Validate AI Gateway configuration on startup
  aiGateway.validateConfig();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();

