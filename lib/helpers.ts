import { getDb } from "./mongodb";
import {
  ObjectId,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
  AggregateOptions,
  UpdateResult,
  DeleteResult,
  InsertOneResult,
  InsertManyResult,
  UpdateFilter,
} from "mongodb";
import { DatabaseError } from "./errorHandler";
import { measureDatabaseOperation } from "./performance";

// Definición de la interfaz de la caché
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache for frequently accessed data
// Usamos 'unknown' para el contenido del Map, ya que puede ser de cualquier tipo.
const cache = new Map<string, CacheEntry<unknown>>(); 
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ---------------------- CACHE HELPER FUNCTIONS ----------------------

// Cache helper functions
// Usamos 'unknown' para el filtro genérico.
function getCacheKey(collection: string, filter: unknown): string {
  return `${collection}:${JSON.stringify(filter, (key, value) => {
    // Aseguramos que ObjectId se serialice correctamente
    if (value instanceof ObjectId) {
      return value.toHexString();
    }
    return value;
  })}`;
}

function getFromCache<T>(key: string): T | null {
  // El casting aquí usa el tipo genérico <T>
  const cached = cache.get(key) as CacheEntry<T> | undefined; 
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
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
  // Guardamos el objeto tipado en el Map, asegurando que T es compatible con unknown.
  cache.set(key, entry as CacheEntry<unknown>);
}

function clearCacheByPattern(pattern: string): void {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
}

// ------------------- ENHANCED QUERY FUNCTIONS ----------------------

export async function findAll<T extends Document>(
  collection: string,
  options?: {
    useCache?: boolean;
    cacheTtl?: number;
    limit?: number;
    sort?: Document; // Reemplazado 'any' por 'Document'
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
  try {
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
  } catch (error) {
     throw new DatabaseError(
      `Failed to find document by ID in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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
    sort?: Document; // Reemplazado 'any' por 'Document'
    projection?: Document; // Reemplazado 'any' por 'Document'
  }
): Promise<WithId<T>[]> {
  const cacheKey = getCacheKey(collection, { filter, ...options });

  if (options?.useCache) {
    const cached = getFromCache<WithId<T>[]>(cacheKey);
    if (cached) return cached;
  }

  try {
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
  } catch (error) {
    throw new DatabaseError(
      `Failed to find many documents in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Optimized function to get schedules with school information using aggregation
export async function getSchedulesWithSchoolInfo(
  employeeID: string,
  dateFilter: Document, // Reemplazado 'any' por 'Document'
  options?: { useCache?: boolean; cacheTtl?: number }
): Promise<Document[]> { // Reemplazado 'any[]' por 'Document[]'
  const cacheKey = getCacheKey("schedules_with_schools", {
    employeeID,
    dateFilter,
  });

  if (options?.useCache) {
    const cached = getFromCache<Document[]>(cacheKey);
    if (cached) return cached;
  }

  try {
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

    return result as Document[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to aggregate schedules in schedules_with_schools: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Optimized function to get requests with school information
export async function getRequestsWithSchoolInfo(
  filter: Document, // Reemplazado 'any' por 'Document'
  options?: { useCache?: boolean; cacheTtl?: number }
): Promise<Document[]> { // Reemplazado 'any[]' por 'Document[]'
  const cacheKey = getCacheKey("requests_with_schools", filter);

  if (options?.useCache) {
    const cached = getFromCache<Document[]>(cacheKey);
    if (cached) return cached;
  }

  try {
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

    return result as Document[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to aggregate requests in requests_with_schools: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function insertOne<T extends Document>(
  collection: string,
  doc: OptionalUnlessRequiredId<T>
): Promise<InsertOneResult<T>> {
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
): Promise<UpdateResult> {
  try {
    const db = await getDb();
    const result = await db
      .collection<T>(collection)
      .updateOne({ _id: new ObjectId(id) } as Filter<T>, {
        $set: { ...doc, updatedAt: new Date() },
      });

    // Clear related cache entries
    clearCacheByPattern(collection);
    clearCacheByPattern(getCacheKey(collection, { _id: id }));


    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to update document in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// La función updateMany con la línea corregida
export async function updateMany<T extends Document>(
  collection: string,
  filter: Filter<T>,
  update: Document
): Promise<UpdateResult> {
  try {
    const db = await getDb();
    
    // 1. Creamos un tipo que representa el objeto de actualización de metadatos.
    // Usamos 'Omit' para tomar todas las claves de 'T', ya que 'update' es un Document genérico.
    // La clave 'updatedAt' se añade de forma explícita con su tipo Date.
    type UpdateWithDate<Doc> = Partial<Doc> & { updatedAt: Date };

    // 2. Aplicamos este nuevo tipo al objeto de actualización para el $set.
    const setPayload: UpdateWithDate<T> = { 
        ...update, 
        updatedAt: new Date() 
    } as UpdateWithDate<T>;

    // 3. Pasamos el payload al $set dentro de UpdateFilter<T>.
    const updateOperation: UpdateFilter<T> = {
        $set: setPayload
    }

    const result = await db
      .collection<T>(collection)
      .updateMany(filter, updateOperation);

    // Clear related cache entries
    clearCacheByPattern(collection);

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to update documents in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteOne(
  collection: string, 
  id: string
): Promise<DeleteResult> {
  try {
    const db = await getDb();
    const result = await db
      .collection(collection)
      .deleteOne({ _id: new ObjectId(id) });

    // Clear related cache entries
    clearCacheByPattern(collection);
    clearCacheByPattern(getCacheKey(collection, { _id: id }));

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete document in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteMany(
  collection: string, 
  filter: Document // Reemplazado 'any' por 'Document'
): Promise<DeleteResult> {
  try {
    const db = await getDb();
    const result = await db.collection(collection).deleteMany(filter);

    // Clear related cache entries
    clearCacheByPattern(collection);

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete many documents in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Bulk operations for better performance
export async function insertMany<T extends Document>(
  collection: string,
  docs: OptionalUnlessRequiredId<T>[]
): Promise<InsertManyResult<T>> {
  try {
    const db = await getDb();
    const result = await db.collection<T>(collection).insertMany(docs);

    // Clear related cache entries
    clearCacheByPattern(collection);

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to insert many documents in ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Aggregation helper
export async function aggregate<T extends Document>(
  collection: string,
  pipeline: Document[], // Reemplazado 'any[]' por 'Document[]'
  options?: AggregateOptions & { useCache?: boolean; cacheTtl?: number }
): Promise<T[]> {
  const cacheKey = getCacheKey(collection, { pipeline });

  if (options?.useCache) {
    const cached = getFromCache<T[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const db = await getDb();
    const result = (await db
      .collection<T>(collection)
      .aggregate(pipeline, options)
      .toArray()) as T[];

    if (options?.useCache) {
      setCache(cacheKey, result, options.cacheTtl);
    }

    return result;
  } catch (error) {
    throw new DatabaseError(
      `Failed to perform aggregation on ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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