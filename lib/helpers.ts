import { getDb } from "./mongodb";
import {
  ObjectId,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
  AggregateOptions,
} from "mongodb";
import { DatabaseError } from "./errorHandler";
import { measureDatabaseOperation } from "./performance";

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
function getCacheKey(collection: string, filter: any): string {
  return `${collection}:${JSON.stringify(filter)}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired cache
  }
  return null;
}

function setCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_TTL
): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

function clearCacheByPattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Enhanced query functions with caching and optimization
export async function findAll<T extends Document>(
  collection: string,
  options?: {
    useCache?: boolean;
    cacheTtl?: number;
    limit?: number;
    sort?: any;
  }
): Promise<WithId<T>[]> {
  try {
    const cacheKey = getCacheKey(collection, { all: true, ...options });

    if (options?.useCache) {
      const cached = getFromCache<WithId<T>[]>(cacheKey);
      if (cached) return cached;
    }

    const db = await getDb();
    let query = db.collection<T>(collection).find({});

    if (options?.sort) query = query.sort(options.sort);
    if (options?.limit) query = query.limit(options.limit);

    const result = await query.toArray();

    if (options?.useCache) {
      setCache(cacheKey, result, options.cacheTtl);
    }

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to find documents in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function findById<T extends Document>(
  collection: string,
  id: string,
  options?: { useCache?: boolean; cacheTtl?: number }
): Promise<WithId<T> | null> {
  const cacheKey = getCacheKey(collection, { _id: id });

  if (options?.useCache) {
    const cached = getFromCache<WithId<T>>(cacheKey);
    if (cached) return cached;
  }

  const db = await getDb();
  const result = await db
    .collection<T>(collection)
    .findOne({ _id: new ObjectId(id) } as Filter<T>);

  if (options?.useCache && result) {
    setCache(cacheKey, result, options.cacheTtl);
  }

  return result;
}

export async function findOne<T extends Document>(
  collection: string,
  filter: Filter<T>,
  options?: { useCache?: boolean; cacheTtl?: number }
): Promise<WithId<T> | null> {
  return measureDatabaseOperation("findOne", collection, async () => {
    try {
      const cacheKey = getCacheKey(collection, filter);

      if (options?.useCache) {
        const cached = getFromCache<WithId<T>>(cacheKey);
        if (cached) return cached;
      }

      const db = await getDb();
      const result = await db.collection<T>(collection).findOne(filter);

      if (options?.useCache && result) {
        setCache(cacheKey, result, options.cacheTtl);
      }

      return result;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find document in ${collection}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });
}

export async function findMany<T extends Document>(
  collection: string,
  filter: Filter<T>,
  options?: {
    useCache?: boolean;
    cacheTtl?: number;
    limit?: number;
    sort?: any;
    projection?: any;
  }
): Promise<WithId<T>[]> {
  const cacheKey = getCacheKey(collection, { filter, ...options });

  if (options?.useCache) {
    const cached = getFromCache<WithId<T>[]>(cacheKey);
    if (cached) return cached;
  }

  const db = await getDb();
  let query = db.collection<T>(collection).find(filter);

  if (options?.projection) query = query.project(options.projection);
  if (options?.sort) query = query.sort(options.sort);
  if (options?.limit) query = query.limit(options.limit);

  const result = await query.toArray();

  if (options?.useCache) {
    setCache(cacheKey, result, options.cacheTtl);
  }

  return result;
}

// Optimized function to get schedules with school information using aggregation
export async function getSchedulesWithSchoolInfo(
  employeeID: string,
  dateFilter: any,
  options?: { useCache?: boolean; cacheTtl?: number }
): Promise<any[]> {
  const cacheKey = getCacheKey("schedules_with_schools", {
    employeeID,
    dateFilter,
  });

  if (options?.useCache) {
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;
  }

  const db = await getDb();
  const pipeline = [
    {
      $match: {
        employeeID,
        ...dateFilter,
      },
    },
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    {
      $unwind: {
        path: "$school",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        employeeID: 1,
        schoolId: 1,
        date: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        "school.name": 1,
        "school.address": 1,
        "school.coordinates": 1,
      },
    },
    {
      $sort: { date: 1, startTime: 1 },
    },
  ];

  const result = await db.collection("schedules").aggregate(pipeline).toArray();

  if (options?.useCache) {
    setCache(cacheKey, result, options.cacheTtl);
  }

  return result;
}

// Optimized function to get requests with school information
export async function getRequestsWithSchoolInfo(
  filter: any,
  options?: { useCache?: boolean; cacheTtl?: number }
): Promise<any[]> {
  const cacheKey = getCacheKey("requests_with_schools", filter);

  if (options?.useCache) {
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;
  }

  const db = await getDb();
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        schoolObjectId: { $toObjectId: "$schoolId" },
      },
    },
    {
      $lookup: {
        from: "schools",
        localField: "schoolObjectId",
        foreignField: "_id",
        as: "school",
      },
    },
    {
      $unwind: {
        path: "$school",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        priority: 1,
        status: 1,
        room: 1,
        time: 1,
        assignedTo: 1,
        createdAt: 1,
        updatedAt: 1,
        schoolId: 1,
        "school.name": 1,
        "school.address": 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];

  const result = await db.collection("requests").aggregate(pipeline).toArray();

  if (options?.useCache) {
    setCache(cacheKey, result, options.cacheTtl);
  }

  return result;
}

export async function insertOne<T extends Document>(
  collection: string,
  doc: OptionalUnlessRequiredId<T>
) {
  try {
    const db = await getDb();
    const result = await db.collection<T>(collection).insertOne(doc);

    // Clear related cache entries
    clearCacheByPattern(collection);

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to insert document in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updateOne<T extends Document>(
  collection: string,
  id: string,
  doc: Partial<T>
) {
  const db = await getDb();
  const result = await db
    .collection<T>(collection)
    .updateOne({ _id: new ObjectId(id) } as Filter<T>, {
      $set: { ...doc, updatedAt: new Date() },
    });

  // Clear related cache entries
  clearCacheByPattern(collection);

  return result;
}

export async function updateMany<T extends Document>(
  collection: string,
  filter: Filter<T>,
  update: any
) {
  const db = await getDb();
  const result = await db
    .collection<T>(collection)
    .updateMany(filter, { $set: { ...update, updatedAt: new Date() } });

  // Clear related cache entries
  clearCacheByPattern(collection);

  return result;
}

export async function deleteOne(collection: string, id: string) {
  const db = await getDb();
  const result = await db
    .collection(collection)
    .deleteOne({ _id: new ObjectId(id) });

  // Clear related cache entries
  clearCacheByPattern(collection);

  return result;
}

export async function deleteMany(collection: string, filter: any) {
  const db = await getDb();
  const result = await db.collection(collection).deleteMany(filter);

  // Clear related cache entries
  clearCacheByPattern(collection);

  return result;
}

// Bulk operations for better performance
export async function insertMany<T extends Document>(
  collection: string,
  docs: OptionalUnlessRequiredId<T>[]
) {
  const db = await getDb();
  const result = await db.collection<T>(collection).insertMany(docs);

  // Clear related cache entries
  clearCacheByPattern(collection);

  return result;
}

// Aggregation helper
export async function aggregate<T extends Document>(
  collection: string,
  pipeline: any[],
  options?: AggregateOptions & { useCache?: boolean; cacheTtl?: number }
): Promise<T[]> {
  const cacheKey = getCacheKey(collection, { pipeline });

  if (options?.useCache) {
    const cached = getFromCache<T[]>(cacheKey);
    if (cached) return cached;
  }

  const db = await getDb();
  const result = (await db
    .collection<T>(collection)
    .aggregate(pipeline, options)
    .toArray()) as T[];

  if (options?.useCache) {
    setCache(cacheKey, result, options.cacheTtl);
  }

  return result;
}

// Cache management functions
export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
