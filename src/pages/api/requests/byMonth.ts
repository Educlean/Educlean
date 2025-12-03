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

        // Agregación robusta: convertir 'time' a fecha de forma segura
        // y filtrar documentos cuyo 'time' no sea convertible.
        const requestCounts = await db
            .collection("requests")
            .aggregate([
                {
                    $addFields: {
                        safeTime: {
                            $convert: {
                                input: "$time",
                                to: "date",
                                onError: null,
                                onNull: null,
                            },
                        },
                    },
                },
                {
                    // Excluir documentos donde la conversión falló
                    $match: { safeTime: { $ne: null } },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$safeTime" },
                            month: { $month: "$safeTime" },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
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