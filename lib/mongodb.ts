import { MongoClient, Db, MongoClientOptions } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;

// Connection pool configuration for better performance
const clientOptions: MongoClientOptions = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2,  // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take
  connectTimeoutMS: 10000, // How long to wait for a connection to be established
  retryWrites: true, // Retry writes on network errors
  retryReads: true, // Retry reads on network errors
  compressors: ['zlib'], // Enable compression for better network performance
};

export async function getDb(): Promise<Db> {
  if (db && client) {
    try {
      // Check if the client is still connected by pinging the database
      await client.db().admin().ping();
      return db;
    } catch (error) {
      // Connection is not valid, will reconnect below
      console.log("MongoDB connection lost, reconnecting...");
    }
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("⚠️ variable MONGODB_URI is missing at .env.local");
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for the current connection attempt to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (db) return db;
  }

  try {
    isConnecting = true;
    
    // Close existing client if it exists but is not connected
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.warn("Error closing existing MongoDB client:", error);
      }
    }

    client = new MongoClient(process.env.MONGODB_URI, clientOptions);
    await client.connect();
    
    // Verify connection
    await client.db("admin").command({ ping: 1 });
    
    db = client.db("educlean-dev");
    
    // Create indexes for better query performance
    await createIndexes(db);
    console.log("Connected DB:", db.databaseName);
    console.log("MONGO URI:", process.env.MONGODB_URI);
console.log("MONGO DB:", process.env.MONGODB_DB);


    console.log("✅ MongoDB connected successfully with connection pooling");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    client = null;
    db = null;
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    isConnecting = false;
  }
}

// Create database indexes for better query performance
async function createIndexes(database: Db): Promise<void> {
  try {
    // Indexes for accounts collection
    await database.collection("accounts").createIndex({ employeeID: 1 }, { unique: true });
    await database.collection("accounts").createIndex({ role: 1 });

    // Indexes for users collection
    await database.collection("users").createIndex({ accountId: 1 }, { unique: true });
    await database.collection("users").createIndex({ email: 1 });

    // Indexes for schedules collection
    await database.collection("schedules").createIndex({ employeeID: 1, date: 1 });
    await database.collection("schedules").createIndex({ schoolId: 1, date: 1 });
    await database.collection("schedules").createIndex({ date: 1 });

    // Indexes for requests collection
    await database.collection("requests").createIndex({ schoolId: 1, status: 1 });
    await database.collection("requests").createIndex({ assignedTo: 1, status: 1 });
    await database.collection("requests").createIndex({ createdAt: 1 });

    // Indexes for clock records collection
    await database.collection("clockRecords").createIndex({ employeeID: 1, date: 1 });
    await database.collection("clockRecords").createIndex({ schoolId: 1, date: 1 });
    await database.collection("clockRecords").createIndex({ status: 1 });

    // Indexes for schools collection
    await database.collection("schools").createIndex({ name: 1 });
    await database.collection("schools").createIndex({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

    console.log("✅ Database indexes created successfully");
  } catch (error) {
    console.warn("⚠️ Some indexes may already exist:", error);
  }
}

// Graceful shutdown function
export async function closeConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
      client = null;
      db = null;
      console.log("✅ MongoDB connection closed gracefully");
    } catch (error) {
      console.error("❌ Error closing MongoDB connection:", error);
    }
  }
}

// Health check function
export async function checkConnection(): Promise<boolean> {
  try {
    if (!client || !db) return false;
    await client.db("admin").command({ ping: 1 });
    return true;
  } catch (error) {
    console.error("MongoDB health check failed:", error);
    return false;
  }
}
