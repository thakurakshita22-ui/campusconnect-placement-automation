import { app } from './app.js';
import { config } from './config/env.js';
import { initDatabase } from './config/database.js';

async function startServer() {
  console.log('\n🚀 Starting CampusConnect Backend Services...');
  
  // Initialize Database (Oracle or Demo In-Memory Repository)
  const dbStatus = await initDatabase();
  console.log(`📡 Database Mode: ${dbStatus.mode.toUpperCase()}`);
  console.log(`ℹ️  ${dbStatus.message}`);

  app.listen(config.port, () => {
    console.log(`\n=======================================================`);
    console.log(` CampusConnect API Server listening on port ${config.port} `);
    console.log(` Health Check: http://localhost:${config.port}/api/health `);
    console.log(` Dashboard API: http://localhost:${config.port}/api/dashboard `);
    console.log(`=======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
