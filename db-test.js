const { Client } = require('pg');

class DatabaseService {
  constructor() {
    this.dbConfig = {
      host: 'localhost',
      port: 5432,
      database: 'xeno_db',
      user: 'postgres',
      password: 'your_actual_password@with@symbols'  // Put real password
    };
  }

  // Test database connection
  async testConnection() {
    const client = new Client(this.dbConfig);
    
    try {
      await client.connect();
      console.log('✅ Database connected successfully');
      await client.end();
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  // Get database client
  getClient() {
    return new Client(this.dbConfig);
  }

  async disconnect() {
    console.log('📡 Database service disconnected');
  }
}

module.exports = new DatabaseService();
