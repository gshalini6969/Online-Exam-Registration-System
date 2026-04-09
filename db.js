const mysql = require('mysql2');
<<<<<<< HEAD

// Try multiple connection methods
let pool;
let promisePool;

async function connectToDatabase() {
  // Method 1: Try DATABASE_URL first
  if (process.env.DATABASE_URL) {
    console.log('📡 Trying DATABASE_URL connection...');
    try {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 30000,
        enableKeepAlive: true
      });
      promisePool = pool.promise();
      
      const [result] = await promisePool.execute('SELECT 1 as test');
      console.log('✅ Connected via DATABASE_URL');
      return promisePool;
    } catch (err) {
      console.log('❌ DATABASE_URL failed:', err.message);
    }
  }
  
  // Method 2: Try individual variables
  if (process.env.DB_HOST && process.env.DB_PASSWORD) {
    console.log('📡 Trying individual connection variables...');
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'railway',
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 30000,
        enableKeepAlive: true
      });
      promisePool = pool.promise();
      
      const [result] = await promisePool.execute('SELECT 1 as test');
      console.log('✅ Connected via individual variables');
      console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      return promisePool;
    } catch (err) {
      console.log('❌ Individual variables failed:', err.message);
    }
  }
  
  console.error('❌ Could not connect to database with any method');
  return null;
}

// Initialize connection
let connectedDb = null;

async function getDb() {
  if (!connectedDb) {
    connectedDb = await connectToDatabase();
  }
  return connectedDb;
}

// Export a proxy that waits for connection
module.exports = {
  execute: async (query, params) => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not connected');
    }
    return db.execute(query, params);
  },
  query: async (query, params) => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not connected');
    }
    return db.query(query, params);
  }
};
=======
require('dotenv').config();

const pool = mysql.createPool({
  host     : process.env.DB_HOST,
  port     : process.env.DB_PORT,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit   : 10
});

module.exports = pool.promise();
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
