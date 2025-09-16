const { PrismaClient } = require('@prisma/client');

// Get database URL from environment variables
const getDatabaseUrl = () => {
  // Try different environment variable names that Railway might use
  return process.env.DATABASE_URL || 
         process.env.DATABASE_PUBLIC_URL || 
         process.env.POSTGRES_URL ||
         process.env.DB_URL ||
         "postgresql://postgres:KxjzkobotyaeyBzMvOlxCdopihZitajp@shinkansen.proxy.rlwy.net:36517/railway";
};

console.log('🔍 Database URL check:', getDatabaseUrl() ? 'Found' : 'Missing');

// Vercel Serverless Optimized Database Connection
let prisma;

if (process.env.NODE_ENV === 'production') {
  // Production - Railway/Vercel
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    log: ['error', 'warn'],
    errorFormat: 'pretty',
    // Serverless optimizations
    __internal: {
      engine: {
        connectTimeout: 60000,
        pool: {
          timeout: 60000,
        },
      },
    },
  });

  console.log('✅ Prisma Client initialized for PRODUCTION (Vercel)');
} else {
  // Development - Prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty'
    });
    
    console.log('✅ Prisma Client initialized for DEVELOPMENT');
  }
  prisma = global.prisma;
}

// Connection error handling
prisma.$on('error', (error) => {
  console.error('❌ Prisma Client Error:', error);
});

// Graceful shutdown handlers
const gracefulShutdown = async () => {
  try {
    console.log('🔄 Disconnecting Prisma Client...');
    await prisma.$disconnect();
    console.log('✅ Prisma Client disconnected successfully');
  } catch (error) {
    console.error('❌ Error during Prisma disconnection:', error);
  }
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Export prisma instance
module.exports = { prisma };

// Test connection on startup
const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

// Only test connection in development
if (process.env.NODE_ENV !== 'production') {
  testConnection();
}
