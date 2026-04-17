require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🎮 NPC Mode Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Groq AI:     ${process.env.GROQ_API_KEY ? '✅ configured' : '⚠️  not set (mock quests)'}`);
  console.log(`   Redis:       ${process.env.UPSTASH_REDIS_REST_URL ? '✅ configured' : '⚠️  not set (no cache)'}\n`);
});
