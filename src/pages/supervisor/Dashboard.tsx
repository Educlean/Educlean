// pages/supervisor/SDashboard.tsx
"use client";

import Banner from "../../components/Reusable/Banner";
import Card, { CardProps } from "../../components/Reusable/RequestCard";
import plusIcon from "../../assets/icons/plus.png";
import EmployeeCard from "../../components/Reusable/EmployeeCard";
import Image from "next/image";
import Link from "next/link";
import locationIcon from "../../assets/icons/location.svg";
import { UserProvider, useUser } from "@/context/UserContext";
// import { useMemo } from "react";
import useSWR from "swr";
import { format } from "date-fns-tz";

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

const vancouverDate = format(new Date(), "yyyy-MM-dd", { timeZone: "America/Vancouver" });
// --- Fetcher global para SWR ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Dashboard Content ---
function SDashboardContent() {
  // const today = new Date().toISOString().split("T")[0];
  const { user } = useUser();
  const displayName = user?.name || "";

  // SWR hooks
  const { data: requests = [], isLoading: loadingRequests } = useSWR<CardProps[]>(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/requests/byDay?date=${vancouverDate}`,
    fetcher
  );
  console.log("Requests:", requests)

  const { data: schools = [], isLoading: loadingSchools } = useSWR<School[]>(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/schools`,
    fetcher
  );
  console.log("Schools:", schools);

  const { data: employees = [], isLoading: loadingEmployees } = useSWR<Employee[]>(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/schedules/byDay?date=${vancouverDate}`,
    fetcher
  );

  console.log("Employees:", employees);

  // Memoized employees with school data


  // console.log("Employees with School:", employeesWithSchool);


  if (loadingRequests || loadingSchools || loadingEmployees) {
    return (
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-500">Loading your schedule...</p>
            </div>
          </div>)
  }

  return (
    <div className="lg:overflow-y-auto min-h-screen overflow-y-auto max-h-[564px]">
      {user ? (
        <div>
          <Banner
            label={`Hi, ${displayName.split(" ")[0]} 👋🏻`}
            className="lg:bg-[var(--lightGray)] px-5 py-5"
            description="Your dashboard today!"
          />

          <div className="md:max-w-2xl md:mx-auto lg:max-w-full lg:flex">
            {/* Today Requests */}
            <div className="rounded-md bg-[var(--light-gray)] m-4 p-5 max-h-[564px] overflow-y-auto lg:flex-1 lg:bg-white">
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
            <div className="flex flex-col gap-4 bg-[var(--light-gray)] m-4 p-5 max-h-[564px] overflow-y-auto rounded-md lg:flex-1 lg:bg-white">
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
                        <EmployeeCard key={emp.id} name={emp.user.name} className="my-2" />
                      ))}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// --- Wrapper con UserProvider ---
export default function SDashboard() {
  return (
    <UserProvider>
      <SDashboardContent />
    </UserProvider>
  );
}