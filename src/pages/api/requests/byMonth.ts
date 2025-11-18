import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";

// No necesitamos una función para el rango de medianoche de Vancouver en este caso,
// ya que la agregación de MongoDB maneja la extracción del mes/año del campo 'time'.

export default async function getRequestCountByMonth(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const db = await getDb();
        console.log("DB:", db.databaseName);
        console.log("Count:", await db.collection("requests").countDocuments());

        console.log("Aggregating request count by month...");

        // Agregación para contar el número de requests por mes y año
        const requestCounts = await db
            .collection("requests")
            .aggregate([
                {
                    $group: {
                        // Agrupar por el mes y el año de la fecha 'time'
                        _id: {
                            year: { $year: "$time" },
                            month: { $month: "$time" },
                        },
                        // Contar el número de documentos en cada grupo (mes/año)
                        count: { $sum: 1 },
                    },
                },
                {
                    // (Opcional) Ordenar los resultados cronológicamente
                    $sort: { "_id.year": 1, "_id.month": 1 },
                },
            ])
            .toArray();

        // El resultado tendrá un formato como:
        // [
        //   { "_id": { "year": 2023, "month": 10 }, "count": 150 },
        //   { "_id": { "year": 2023, "month": 11 }, "count": 220 },
        //   ...
        // ]

        res.setHeader("Cache-Control", "no-store");
        res.status(200).json(requestCounts);
    } catch (error) {
        console.error("Error fetching request counts by month:", error);
        res.status(500).json({ error: "Error fetching request counts by month" });
    }
}