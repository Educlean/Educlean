"use client";

import Banner from "../../components/Reusable/Banner";
import Card, { CardProps } from "../../components/Reusable/RequestCard";
import plusIcon from "../../assets/icons/plus.png";
import EmployeeCard from "../../components/Reusable/EmployeeCard";
import Image from "next/image";
import Link from "next/link";
import locationIcon from "../../assets/icons/location.svg";
import { useUser } from "@/context/UserContext";
import StackedBarChart from "../../components/Reusable/StackedBarChart";

import useSWR from "swr";
import { format } from "date-fns-tz";
import { useEffect, useState } from "react";

interface School {
  _id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  schoolId: string;
  user: {
    _id: string;
    name: string;
  };
  school?: {
    _id: string;
    name: string;
  };
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((res) => {
    if (!res.ok) throw new Error(`Fetch error ${res.status}`);
    return res.json();
  });

function SDashboardContent() {
  const { user } = useUser();
  const displayName = user?.name || "";
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    const d = format(new Date(), "yyyy-MM-dd", {
      timeZone: "UTC",
    });
    setCurrentDate(d);
  }, []);

  const { data: requests = [], isLoading: loadingRequests } = useSWR<
    CardProps[]
  >(currentDate ? `/api/requests/byDay?date=${currentDate}` : null, fetcher);

  const { data: schools = [], isLoading: loadingSchools } =
    useSWR<School[]>(`/api/schools`, fetcher);

  const { data: employees = [], isLoading: loadingEmployees } = useSWR<
    Employee[]
  >(currentDate ? `/api/schedules/byDay?date=${currentDate}` : null, fetcher);

  if (loadingRequests || loadingSchools || loadingEmployees) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center rounded-lg p-6 mb-6">
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:overflow-visible">
      {user && (
        <div>
          {/* HEADER */}
          <Banner
            label={`Hi, ${displayName.split(" ")[0]} 👋🏻`}
            className="lg:bg-[var(--light-gray)] px-5 py-5"
            description="Your dashboard today!"
          />

          <div className="md:max-w-2xl md:mx-auto lg:max-w-full lg:flex">
            {/* Today Requests */}
            <div
              className="
                rounded-md bg-[var(--light-gray)] m-4 p-5 
                lg:flex-1 lg:bg-white
                lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto
              "
            >
              <div className="flex flex-row justify-between">
                <h2 className="text-xl font-bold">Today Request</h2>
                <Link href="/supervisor/CreateRequest" passHref>
                  <div className="flex flex-row gap-2 items-center cursor-pointer">
                    <p className="text-xl underline decoration-1 underline-offset-4">
                      Create request
                    </p>
                    <Image src={plusIcon} alt="Add" height={20} width={20} />
                  </div>
                </Link>
              </div>

              {requests.map((request, i) => (
                <Card
                  key={i}
                  school={request.school}
                  title={request.title}
                  status={request.status}
                  time={request.time}
                  description={request.description}
                  room={request.room}
                />
              ))}
            </div>

            {/* Team Section */}
            <div
              className="
                flex flex-col gap-4 bg-[var(--light-gray)] m-4 p-5 rounded-md
                lg:flex-1 lg:bg-white
                lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto
              "
            >
              <h2 className="text-xl font-bold">Your Team Today</h2>

              {schools.map((school) => (
                <div
                  key={school._id}
                  className="p-5 rounded-lg bg-white lg:bg-gray-50"
                >
                  <div className="mb-3 flex flex-row items-center gap-2">
                    <Image
                      src={locationIcon}
                      alt="Location"
                      height={20}
                      width={20}
                    />
                    <h2 className="text-xl">{school.name}</h2>
                  </div>

                  <div>
                    {employees
                      .filter((emp) => emp.school?._id === school._id)
                      .map((emp) => (
                        <EmployeeCard
                          key={emp.id}
                          name={emp.user.name}
                          className="my-2"
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRAPH */}
          <div className="bg-[var(--light-gray)] md:bg-white mx-4 mb-4 p-5 rounded-sm">
            <StackedBarChart />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SDashboard() {
  return <SDashboardContent />;
}
