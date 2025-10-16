import { getDb } from "./mongodb";
import {
  ObjectId,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
} from "mongodb";

export async function findAll<T extends Document>(
  collection: string,
): Promise<WithId<T>[]> {
  const db = await getDb();
  return db.collection<T>(collection).find({}).toArray();
}

export async function findById<T extends Document>(
  collection: string,
  id: string,
): Promise<WithId<T> | null> {
  const db = await getDb();
  return db
    .collection<T>(collection)
    .findOne({ _id: new ObjectId(id) } as Filter<T>);
}
export async function findMany <T extends Document>(
  collection: string,
  filter: Filter<T>,
): Promise<WithId<T>[]> {
  const db = await getDb();
  return db.collection<T>(collection).find(filter).toArray();
}

export async function findOne<T extends Document>(
  collection: string,
  filter: Filter<T>,
): Promise<WithId<T> | null> {
  const db = await getDb();
  return db.collection<T>(collection).findOne(filter);
}

export async function insertOne<T extends Document>(
  collection: string,
  doc: OptionalUnlessRequiredId<T>,
) {
  const db = await getDb();
  return db.collection<T>(collection).insertOne(doc);
}

export async function updateOne<T extends Document>(
  collection: string,
  id: string,
  doc: Partial<T>,
) {
  const db = await getDb();
  return db
    .collection<T>(collection)
    .updateOne({ _id: new ObjectId(id) } as Filter<T>, { $set: doc });
}

export async function deleteOne(collection: string, id: string) {
  const db = await getDb();
  return db.collection(collection).deleteOne({ _id: new ObjectId(id) });
}
