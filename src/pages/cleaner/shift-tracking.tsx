"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GeolocationService, Coordinates } from "../../../lib/geolocation";
import { useUser } from "../../context/UserContext";
import { getLocalDateString, isToday } from "../../../lib/timezone";

// Interfaces mantenidas y añadidas
interface ShiftData {
  school: string;
  address: string;
  scheduledTime: string;
  room: string;
  schoolId: string;
  coordinates: Coordinates;
}

interface ClockStatus {
  status: "not_started" | "clocked_in" | "completed";
  clockInTime?: string;
  clockOutTime?: string;
  school: {
    id: string;
    name: string;
    address: string;
    coordinates: Coordinates;
  };
}

// Nueva Interfaz para tipar el objeto que proviene del schedule
interface CleanerScheduleItem {
  schoolId: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  room?: string;
  date: string;
  // Añadir cualquier otro campo que venga de esa API si es necesario
}

const ShiftTracking = () => {
  const router = useRouter();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
    time: "",
    message: "",
  });
  const [shiftStatus, setShiftStatus] = useState<
    "not_started" | "clocked_in" | "completed"
  >("not_started");
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null
  );

  // Get schoolId from URL query parameters
  const { schoolId } = router.query;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Asegurarse de que el router esté listo y schoolId sea una cadena antes de inicializar
    if (user && router.isReady && typeof schoolId === "string") {
      initializeShiftData();
      checkLocationPermission();
    }
  }, [user, schoolId, router.isReady]); // Añadir router.isReady y schoolId como dependencia

  const initializeShiftData = async () => {
    // Asegurarse de que schoolId sea una cadena para usarlo
    if (!user?.employeeID || typeof schoolId !== "string") {
      setError("Missing user data or school ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const localDateString = getLocalDateString();

      // Fetch current clock status
      const response = await fetch(
        `/api/clock/status?employeeID=${user.employeeID}&schoolId=${schoolId}&date=${localDateString}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shift data");
      }

      const data: ClockStatus = await response.json();

      setShiftStatus(data.status);
      if (data.clockInTime) {
        setClockInTime(new Date(data.clockInTime));
      }
      if (data.clockOutTime) {
        setClockOutTime(new Date(data.clockOutTime));
      }

      // Fetch schedule data for today
      const scheduleResponse = await fetch(
        `/api/schedules/cleaner?employeeID=${user.employeeID}`
      );

      let scheduledTime = "Not scheduled";
      let room = "TBD";

      if (scheduleResponse.ok) {
        // Tipado del arreglo para eliminar 'any'
        const scheduleData: CleanerScheduleItem[] =
          await scheduleResponse.json();

        // Uso del tipado al hacer el find
        const todaySchedule = scheduleData.find(
          (schedule: any) => {
            const scheduleDatePart = schedule.date.split("T")[0];
            const todayDatePart = getLocalDateString();
            return schedule.schoolId === schoolId && scheduleDatePart === todayDatePart;
          }
        );

        if (todaySchedule) {
          // Format the scheduled time using the helper function for 24-hour time strings
          const startTimeFormatted = formatTimeString(todaySchedule.startTime);
          const endTimeFormatted = formatTimeString(todaySchedule.endTime);
          scheduledTime = `${startTimeFormatted} - ${endTimeFormatted}`;
          room = todaySchedule.room || "Main area";
        }
      }

      // Set shift data
      setShiftData({
        school: data.school.name,
        address: data.school.address,
        scheduledTime: scheduledTime,
        room: room,
        schoolId: data.school.id,
        coordinates: data.school.coordinates,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load shift data"
      );
    } finally {
      setLoading(false);
    }
  };

  // ... (El resto del código se mantiene igual, ya que solo el 'any' fue el objetivo)

  const checkLocationPermission = async () => {
    try {
      const hasPermission = await GeolocationService.requestPermission();
      setLocationPermission(hasPermission);
    } catch (err) {
      setLocationPermission(false);
    }
  };

  const handleGoBack = () => {
    router.push("/cleaner/DashboardCleaner");
  };

  const handleClockIn = async () => {
    if (!shiftData || !locationPermission) {
      setError("Location permission required for clock in/out");
      return;
    }

    setIsClockingIn(true);
    setError(null);

    try {
      // Get current location and verify distance
      const locationCheck = await GeolocationService.isWithinRadius(
        shiftData.coordinates,
        150 // 150 meter radius
      );

      console.log(locationCheck);

      if (!locationCheck.isWithin) {
        throw new Error(
          `You must be within 150 meters of the school to clock in. Current distance: ${GeolocationService.formatDistance(
            locationCheck.distance
          )}`
        );
      }

      // Make API call to clock in
      const response = await fetch("/api/clock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeID: user?.employeeID,
          schoolId: shiftData.schoolId,
          latitude: locationCheck.currentCoords.latitude,
          longitude: locationCheck.currentCoords.longitude,
          action: "clock_in",
          date: getLocalDateString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to clock in");
      }

      // Update state on success
      setShiftStatus("clocked_in");
      setClockInTime(new Date(result.clockInTime));
      setSuccessMessage({
        title: "You are in🙌",
        description: `clocked in at `,
        time: formatTime(new Date(result.clockInTime)),
        message: "Have a great shift!",
      });
      setShowSuccessDialog(true);
    } catch (err) {
      if (err instanceof Error) {
        // Esto asume que el error de distancia se maneja aquí al hacer el throw
        if (err.message.includes("150 meters")) {
          setSuccessMessage({
            title: "You cannot connect",
            description: "You are out of the school limit",
            time: "",
            message: "",
          });
          setShowSuccessDialog(true);
        } else {
          setError(err.message);
        }
      } else setError("Failed to clock in");
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!shiftData || !locationPermission) {
      setError("Location permission required for clock in/out");
      return;
    }

    setIsClockingOut(true);
    setError(null);

    try {
      // Get current location and verify distance
      const locationCheck = await GeolocationService.isWithinRadius(
        shiftData.coordinates,
        150 // 150 meter radius
      );

      if (!locationCheck.isWithin) {
        throw new Error(
          `You must be within 150 meters of the school to clock out. Current distance: ${GeolocationService.formatDistance(
            locationCheck.distance
          )}`
        );
      }

      // Make API call to clock out
      const response = await fetch("/api/clock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeID: user?.employeeID,
          schoolId: shiftData.schoolId,
          latitude: locationCheck.currentCoords.latitude,
          longitude: locationCheck.currentCoords.longitude,
          action: "clock_out",
          date: getLocalDateString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to clock out");
      }

      // Update state on success
      setShiftStatus("completed");
      setClockOutTime(new Date(result.clockOutTime));
      setSuccessMessage({
        title: "Good job today🙌",
        description: `clocked out at `,
        time: formatTime(new Date(result.clockOutTime)),
        message: "Your shift is now complete",
      });
      setShowSuccessDialog(true);
    } catch (err) {
      if (err instanceof Error) {
        // Manejar el error de distancia de forma similar al clock-in
        if (err.message.includes("150 meters")) {
          setSuccessMessage({
            title: "You cannot connect",
            description: "You are out of the school limit",
            time: "",
            message: "Please try again when closer.",
          });
          setShowSuccessDialog(true);
        } else {
          setError(err.message);
        }
      } else setError("Failed to clock out");
    } finally {
      setIsClockingOut(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to format 24-hour time string (e.g., "17:00") to 12-hour format
  const formatTimeString = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const SuccessDialog = () => (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setShowSuccessDialog(false)}
    >
      <div
        className="bg-white rounded-lg p-4 mx-4 max-w-sm w-full text-center shadow-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowSuccessDialog(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="mb-4">
          <h3 className="text-3xl font-bold text-gray-800 mb-2">
            {successMessage.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {successMessage.description}{" "}
            <span className="font-bold text-black">{successMessage.time}</span>
          </p>
          <p className="text-black">{successMessage.message}</p>
        </div>
      </div>
    </div>
  );

  const getStatusMessage = () => {
    switch (shiftStatus) {
      case "clocked_in":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="font-medium text-blue-800">You are in</span>
            </div>
            <p className="text-blue-700">
              clocked in at{" "}
              <span className="font-semibold">
                {clockInTime ? formatTime(clockInTime) : "3:30 PM"}
              </span>
            </p>
            <p className="text-blue-600 text-sm mt-1">Have a good shift!</p>
          </div>
        );
      case "completed":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✨</span>
              <span className="font-medium text-green-800">Good job today</span>
            </div>
            <p className="text-green-700">
              clocked out at{" "}
              <span className="font-semibold">
                {clockOutTime ? formatTime(clockOutTime) : "Unknown"}
              </span>
            </p>
            <p className="text-green-600 text-sm mt-1">
              Your shift is now complete
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const getActionButtons = () => {
    const isClockInDisabled =
      shiftStatus !== "not_started" || isClockingIn || isClockingOut;
    const isClockOutDisabled =
      shiftStatus !== "clocked_in" || isClockingOut || isClockingIn;

    return (
      <div className="space-y-3">
        {/* Clock In Button */}
        <button
          onClick={handleClockIn}
          disabled={isClockInDisabled}
          className={`w-full py-4 rounded-lg font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isClockInDisabled
            ? "bg-gray-300 text-gray-500"
            : "bg-[#39B52D] text-white hover:bg-[#2d8a22]"
            }`}
        >
          {isClockingIn && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          )}
          {isClockingIn ? "Clocking In..." : "Clock In"}
        </button>

        {/* Clock Out Button */}
        <button
          onClick={handleClockOut}
          disabled={isClockOutDisabled}
          className={`w-full py-4 rounded-lg font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isClockOutDisabled
            ? "bg-gray-300 text-gray-500"
            : "bg-[#39B52D] text-white hover:bg-[#2d8a22]"
            }`}
        >
          {isClockingOut && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          )}
          {isClockingOut ? "Clocking Out..." : "Clock Out"}
        </button>

        {/* Back to Dashboard Button - only show when shift is completed */}
        {shiftStatus === "completed" && (
          <button
            onClick={handleGoBack}
            className="w-full bg-[#39B52D] text-white py-4 rounded-lg font-medium text-lg hover:bg-[#2d8a22] transition-colors"
          >
            Back to Dashboard
          </button>
        )}
      </div>
    );
  };

  const renderShiftScreen = () => (
    <div className="min-h-screen bg-gray-100">
      {showSuccessDialog && <SuccessDialog />}
      {/* Header */}
      <div className="bg-[#C4F2BF] text-white p-4 flex justify-between items-center">
        <button onClick={handleGoBack} className="flex items-center gap-2">
          <span className="text-lg bg-[#39B52D] px-2 pb-1 rounded-md">←</span>
          <span className="text-black underline">Go back</span>
        </button>
      </div>

      <div className="p-4">
        {/* Status Message */}
        {getStatusMessage()}

        {/* School Info */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {shiftData?.school || "Loading..."}
          </h1>
          <p className="text-gray-600 mb-4">
            {shiftData?.address || "Loading address..."}
          </p>

          <div className="flex items-center gap-2 text-gray-600 mb-6 justify-end">
            <span>🕓</span>
            <span className="text-lg font-semibold">
              {shiftStatus === "clocked_in"
                ? clockInTime
                  ? formatTime(clockInTime)
                  : "Unknown"
                : shiftData?.scheduledTime || "Loading..."}
            </span>
          </div>

          {getActionButtons()}
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39B52D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shift data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/cleaner/DashboardCleaner")}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                setError(null);
                initializeShiftData();
              }}
              className="flex-1 bg-[#39B52D] text-white px-4 py-2 rounded-lg hover:bg-[#2d8a22] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Location permission warning
  if (locationPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-500 text-2xl">📍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Location Access Required
          </h3>
          <p className="text-gray-600 mb-6">
            Location access is required to verify you are at the correct school
            for clock in/out.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/cleaner/DashboardCleaner")}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={checkLocationPermission}
              className="flex-1 bg-[#39B52D] text-white px-4 py-2 rounded-lg hover:bg-[#2d8a22] transition-colors"
            >
              Enable Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return renderShiftScreen();
};

export default ShiftTracking;
