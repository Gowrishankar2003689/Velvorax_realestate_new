const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { Pricing } = require('./models');

// Load environment variables
const loadEnv = () => {
  const paths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.txt'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.txt')
  ];

  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`Loaded environment variables from: ${envPath}`);
      return true;
    }
  }
  return false;
};

loadEnv();

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://nithish020306_db_user:Nithish%40236@cluster0.duzlpo7.mongodb.net/velvorax?appName=Cluster0';

const seedSetupCosts = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    const setups = [
      {
        tier: 'SETUP_STANDARD',
        inr: 0, usd: 0, usersLimit: 0,
        setupInr: '2,50,000',
        setupUsd: '3,000',
        features: []
      },
      {
        tier: 'SETUP_ADVANCED',
        inr: 0, usd: 0, usersLimit: 0,
        setupInr: '3,50,000 – 5,00,000',
        setupUsd: '4,200 – 6,000',
        features: []
      }
    ];

    for (const setup of setups) {
      const exists = await Pricing.findOne({ tier: setup.tier });
      if (!exists) {
        await new Pricing(setup).save();
        console.log(`Added ${setup.tier}`);
      } else {
        console.log(`${setup.tier} already exists`);
      }
    }

    console.log('Done');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedSetupCosts();
