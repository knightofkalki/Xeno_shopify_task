const { PrismaClient } = require('@prisma/client');

// Why: Centralized database configuration using environment variables
// What: Prisma client with secure connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = { prisma };
