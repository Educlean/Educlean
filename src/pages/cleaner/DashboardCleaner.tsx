"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "../../context/UserContext";
import { Send } from "lucide-react";
import { isToday } from "../../../lib/timezone";

interface Schedule {
  _id: string;
  employeeID: string;
  schoolId: string;
  date: string;
  startTime: string;
  endTime: string;
  school: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

const DashboardCleaner = () => {
  const router = useRouter();
  const { user } = useUser();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.employeeID) {
      fetchSchedules();
    }
  }, [user]);

  

  const fetchSchedules = async () => {
    if (!user?.employeeID) {
      setError("User data not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/schedules/cleaner?employeeID=${user.employeeID}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const data = await response.json();
      setSchedules(data);
      console.log("Fetched schedules:", data);
      // Find today's schedule using UTC timezone
      const todayShift = data.find(
        (schedule: Schedule) => isToday(schedule.date)
      );
      setTodaySchedule(todayShift || null);

    } catch (error) {
      console.error("Error fetching schedules:", error);
      setError("Failed to load schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleLogShift = () => {
    if (todaySchedule?.schoolId) {
      router.push(`/cleaner/shift-tracking?schoolId=${todaySchedule.schoolId}`);
    } else {
      router.push("/cleaner/shift-tracking");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#C4F2BF] text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-black mb-2">
            Welcome, {user?.name || "Cleaner"} 👋🏻
          </h1>
          <p className="text-black">Ready for your next shift?</p>
        </div>
      </div>

      <div className="p-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchSchedules}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-500">Loading your schedule...</p>
            </div>
          </div>
        ) : (
          /* Welcome Section */
          <div className="bg-white mb-6">
            {/* Today's Shift */}
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-black mb-4">Today</h2>
              <div className="bg-gray-100 rounded-lg p-4">
                {todaySchedule ? (
                  <div className="rounded-lg mb-4">
                    <h3 className="font-semibold text-black mb-1">
                      {todaySchedule.school?.name || "Unknown School"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {todaySchedule.school?.address || "Address not available"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🕓</span>
                      <span>
                        {formatTimeRange(
                          todaySchedule.startTime,
                          todaySchedule.endTime
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg mb-4 text-center">
                    <p className="text-gray-600">
                      No shift scheduled for today
                    </p>
                  </div>
                )}

                <button
                  onClick={handleLogShift}
                  disabled={!todaySchedule}
                  className="w-full bg-[#39B52D] text-white py-3 rounded-lg font-medium hover:bg-[#2d8a22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {todaySchedule ? "Log Shift" : "No Shift Today"}
                </button>
              </div>
            </div>

            {/* Week Schedule */}
            <div>
              <h2 className="text-xl font-extrabold text-black mb-4">
                Week Schedule
              </h2>
              <div className="space-y-3">
                {schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 bg-gray-100 rounded-lg px-4"
                    >
                      <div>
                        <p className="font-medium text-black">
                          {formatDate(schedule.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTimeRange(
                            schedule.startTime,
                            schedule.endTime
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Send size={16} strokeWidth={1} />
                        <span className="text-sm font-medium text-gray-700">
                          {schedule.school?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No schedules found for this week
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCleaner;
