import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!process.env.MONGODB_URI) {
    throw new Error("⚠️ variable MONGODB_URI is missing at .env.local");
  }

  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }

  db = client.db("educlean-dev");
  return db;
}