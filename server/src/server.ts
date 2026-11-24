import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

const startServer = async () => {
  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL database connection established.');

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Joineazy Server is running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`🔗 API Base: http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
