"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { Clipboard } from "lucide-react";

interface Request {
  _id: string;
  title: string;
  description: string;
  room: string;
  status: "todo" | "in_progress" | "done";
  priority: "urgent" | "normal";
  time: string;
  school: {
    name: string;
    address: string;
  };
  schoolId: string;
}

const RequestsPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"todo" | "in_progress" | "done">(
    "todo"
  );
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (user?.employeeID) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user?.employeeID) {
      setError("User data not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/requests/cleaner?employeeID=${user.employeeID}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      console.log(data);
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const updateRequestStatus = async (
    requestId: string,
    newStatus: "in_progress" | "done"
  ) => {
    try {
      setUpdatingRequest(requestId);

      const response = await fetch("/api/requests/cleaner", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          status: newStatus,
          employeeID: user?.employeeID,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request status");
      }

      const result = await response.json();

      // Update the local state
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );

      // Show success message (you could add a toast notification here)
      console.log(result.message);
    } catch (error) {
      console.error("Error updating request:", error);
      setError("Failed to update request. Please try again.");
    } finally {
      setUpdatingRequest(null);
    }
  };

  const handleStartTask = (requestId: string) => {
    updateRequestStatus(requestId, "in_progress");
  };

  const handleCompleteTask = (requestId: string) => {
    updateRequestStatus(requestId, "done");
  };

  const filteredRequests = requests.filter(
    (request) => request.status === activeTab
  );

  const renderRequestCard = (request: Request) => {
    const isCompleted = request.status === "done";
    const isInProgress = request.status === "in_progress";
    const isTodo = request.status === "todo";
    const isUpdating = updatingRequest === request._id;

    return (
      <div key={request._id} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              <Clipboard size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{request.title}</h3>
              <p className="text-sm text-gray-600">
                {formatDate(request.time)} - {formatTime(request.time)}
              </p>
            </div>
          </div>
          {isTodo && (
            <>
              <span className="text-red-600 text-sm px-2 py-1 rounded">
                Not Started
                {request.priority === "urgent" && (
                  <p className="  text-amber-500 text-xs text-right">Urgent</p>
                )}
              </span>
            </>
          )}
          {isInProgress && (
            <span className="text-blue-600 text-sm px-2 py-1 rounded">
              In Progress
            </span>
          )}
          {isCompleted && (
            <span className="text-green-600 text-sm px-2 py-1 rounded">
              Completed
            </span>
          )}
        </div>

        {isTodo && (
          <button
            onClick={() => handleStartTask(request._id)}
            disabled={isUpdating}
            className="w-full bg-[#39B52D] text-white py-2 rounded-lg font-medium mb-3 hover:bg-[#2d8a22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpdating && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isUpdating ? "Starting..." : "Start"}
          </button>
        )}

        {isInProgress && (
          <button
            onClick={() => handleCompleteTask(request._id)}
            disabled={isUpdating}
            className="w-full bg-[#39B52D] text-white py-2 rounded-lg font-medium mb-3 hover:bg-[#2d8a22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpdating && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isUpdating ? "Completing..." : "Complete"}
          </button>
        )}
        {(request.school?.name || request.room || request.description) && (
          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>
                <b>School:</b> {request.school?.name || "Unknown"}
              </span>
              <span>
                <b>Room:</b> {request.room}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Description
              </p>
              <p className="text-sm text-gray-600">{request.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#C4F2BF] text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-black mb-2">
            My Requests
          </h1>
        </div>
      </div>

      <div>
        {/* Page Title */}
        <div className="bg-white rounded-lg p-6 mb-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("todo")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "todo"
                  ? "border-[#39B52D] text-[#39B52D]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              To do
            </button>
            <button
              onClick={() => setActiveTab("in_progress")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "in_progress"
                  ? "border-[#39B52D] text-[#39B52D]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              In progress
            </button>
            <button
              onClick={() => setActiveTab("done")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "done"
                  ? "border-[#39B52D] text-[#39B52D]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchRequests}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-500">Loading requests...</p>
            </div>
          ) : (
            /* Requests List */
            <div className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(renderRequestCard)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No {activeTab.replace("_", " ")} requests
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;
