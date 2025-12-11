import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId, Document } from "mongodb"; // Importar Document de MongoDB
import { getVancouverDateString, getVancouverDayBounds } from "../../../../lib/timezone";

interface RequestUpdateBody {
  requestId: string;
  status: "todo" | "in_progress" | "done";
  employeeID: string;
}

// Interfaz para el objeto de actualización de la solicitud, combinando campos comunes y opcionales.
interface RequestUpdateData extends Document {
  status: "todo" | "in_progress" | "done";
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await getDb();

  if (req.method === "GET") {
    try {
      // Usamos NextApiRequest con tipado más estricto si es necesario, pero req.query es Record<string, string | string[]> por defecto.
      const { employeeID, schoolId } = req.query;

      if (!employeeID) {
        return res.status(400).json({ error: "employeeID is required" });
      }

      // Reemplazamos 'any' por 'Document' para el filtro de MongoDB
      const filter: Document = {};

      // Si schoolId es proporcionado, filtrar por escuela
      if (schoolId) {
        // Aseguramos que schoolId es una string antes de crear ObjectId
        filter.schoolId = new ObjectId(schoolId as string);
      } else {
        // Si no se proporciona schoolId, obtener todas las escuelas donde este empleado trabaja
        // Primero, obtener los horarios de hoy para este empleado en la zona horaria de Vancouver
        const today = getVancouverDateString();
        const { startOfDay } = getVancouverDayBounds(today);

        // Asumiendo que 'schedules' tiene un esquema donde schoolId es un ObjectId
        const schedules = await db
          .collection<Document>("schedules") // Tipamos la colección si es necesario
          .find({
            employeeID: employeeID as string,
            date: { $gte: startOfDay },
          })
          .toArray();

        // Mapeamos los resultados. Asumimos que schoolId existe y es un ObjectId.
        const schoolIds = schedules.map((schedule) =>
          (schedule.schoolId as ObjectId).toString()
        );

        if (schoolIds.length > 0) {
          // Filtramos las solicitudes por los ObjectIds
          filter.schoolId = { $in: schoolIds.map(String) };
        } else {
          // No se encontraron horarios, devolver array vacío
          return res.status(200).json([]);
        }
      }

      // Obtener solicitudes con información de la escuela usando agregación optimizada
      // Importamos la función getRequestsWithSchoolInfo (debe devolver Promise<Document[]>)
      const { getRequestsWithSchoolInfo } = await import("../../../../lib/helpers");

      const requestsWithSchoolInfo: Document[] = await getRequestsWithSchoolInfo(
        filter,
        { useCache: true, cacheTtl: 1 * 60 * 1000 } // Cache por 1 minuto
      );

      return res.status(200).json(requestsWithSchoolInfo);
    } catch (error) {
      console.error("Get cleaner requests error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    try {
      // Desestructuramos el cuerpo con la interfaz tipada
      const { requestId, status, employeeID }: RequestUpdateBody = req.body;

      if (!requestId || !status || !employeeID) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["todo", "in_progress", "done"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Importar funciones helper
      const { findById, updateOne } = await import("../../../../lib/helpers");

      // Verificar si la solicitud existe. findById devuelve WithId<Document> | null.
      const request = await findById<Document>("requests", requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Preparamos los datos de actualización con la interfaz tipada
      const updateData: Partial<RequestUpdateData> = {
        status,
        updatedAt: new Date(),
      };

      // Agregar marcas de tiempo según el estado
      if (status === "in_progress" && request.status === "todo") {
        updateData.startedAt = new Date();
        updateData.assignedTo = employeeID;
      } else if (status === "done" && request.status === "in_progress") {
        updateData.completedAt = new Date();
      }

      // Actualizar la solicitud usando el helper optimizado (updateOne requiere Partial<T>)
      const result = await updateOne<Document>("requests", requestId, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Obtener la solicitud actualizada con información de la escuela usando agregación
      const { getRequestsWithSchoolInfo } = await import("../../../../lib/helpers");

      const [updatedRequestWithSchool]: Document[] = await getRequestsWithSchoolInfo(
        { _id: new ObjectId(requestId) },
        { useCache: false } // No cachear búsquedas de una sola solicitud
      );

      return res.status(200).json({
        success: true,
        message: `Request status updated to ${status}`,
        request: updatedRequestWithSchool,
      });
    } catch (error) {
      console.error("Update request status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}