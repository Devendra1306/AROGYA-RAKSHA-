// Load environment variables for local testing/emulation
require('dotenv').config();

const app = require('../backend/src/app');

module.exports = app;
