"use client";

import Banner from "@/components/Reusable/Banner";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns-tz";

interface EmployeeHoursRow {
  employeeID: string;
  userId?: string;
  name?: string;
  date: string;
  schoolName?: string;
  hoursWorked: number;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((res) => {
    if (!res.ok) {
      throw new Error(`Fetch error ${res.status}`);
    }
    return res.json();
  });

export default function SupervisorHours() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const formatLocalDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }
    return format(parsed, "yyyy-MM-dd");
  };

  useEffect(() => {
    const d = format(new Date(), "yyyy-MM-dd", {
      timeZone: "UTC",
    });
    setStartDate(d);
    setEndDate(d);
  }, []);

  const queryKey =
    startDate && endDate
      ? `/api/clock/hours?startDate=${startDate}&endDate=${endDate}`
      : null;

  const {
    data: rawData,
    isLoading,
    error,
  } = useSWR<EmployeeHoursRow[]>(queryKey, fetcher);

  const data = useMemo(() => {
    if (!rawData) {
      return [];
    }
    return [...rawData];
  }, [rawData]);

  const groupedByEmployee = useMemo(() => {
    const groups = new Map<
      string,
      {
        employeeID: string;
        name: string;
        totalHours: number;
        rows: EmployeeHoursRow[];
      }
    >();

    for (const row of data) {
      const key = row.employeeID;
      const name = row.name || row.employeeID;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          employeeID: row.employeeID,
          name,
          totalHours: row.hoursWorked,
          rows: [row],
        });
      } else {
        existing.totalHours += row.hoursWorked;
        existing.rows.push(row);
      }
    }

    const result = Array.from(groups.values());

    result.forEach((group) => {
      group.rows.sort((a, b) => {
        if (a.date === b.date) {
          const schoolA = a.schoolName || "";
          const schoolB = b.schoolName || "";
          return schoolA.localeCompare(schoolB);
        }
        return a.date.localeCompare(b.date);
      });
    });

    result.sort((a, b) => {
      if (a.name === b.name) {
        return a.employeeID.localeCompare(b.employeeID);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [data]);

  return (
    <div className="">
      <Banner
        label="Team hours overview"
        description="Review total hours worked by each cleaner across your schools."
      />

      <div className="p-5 lg:mx-0 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-4 md:items-end bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#39B52D]/40 focus:border-[#39B52D]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#39B52D]/40 focus:border-[#39B52D]"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {error && (
            <div className="p-4 text-sm text-red-600 border-b border-red-100">
              Failed to load hours. Please try again.
            </div>
          )}

          {isLoading || !queryKey ? (
            <div className="p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin" />
                <p className="mt-2 text-gray-500 text-sm">Loading hours...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No hours found for the selected dates.
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4">
              {groupedByEmployee.map((group) => (
                <div
                  key={group.employeeID}
                  className="border border-gray-100 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Employee ID:{" "}
                        <span className="font-medium">{group.employeeID}</span>
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className="inline-flex items-center rounded-full bg-[#39B52D]/10 text-[#1f7a16] px-3 py-1 text-xs font-semibold">
                        Total hours:{" "}
                        <span className="ml-1">
                          {group.totalHours.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm">
                      <thead className="bg-white">
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">
                            School
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-600">
                            Hours worked
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr
                            key={`${group.employeeID}-${row.date}-${row.schoolName || "unknown"
                              }`}
                            className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 py-2 text-gray-800">
                              {formatLocalDate(row.date)}
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {row.schoolName || "Unknown school"}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 font-medium">
                              {row.hoursWorked.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
