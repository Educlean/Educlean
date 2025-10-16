// pages/supervisor/SDashboard.tsx
'use client';

import type { GetServerSideProps } from 'next';
import Banner from '../../components/Reusable/Banner';
import Card from '../../components/Reusable/RequestCard';
import type { CardProps } from '../../components/Reusable/RequestCard';
import plusIcon from '../../assets/icons/plus.png';
import EmployeeCard from '../../components/Reusable/EmployeeCard';
import Image from 'next/image';
import Link from 'next/link';
import employees from '../../data/employees.json';
import schoolsData from '../../data/schools.json';
import locationIcon from '../../assets/icons/location.svg';
import { UserProvider, useUser } from '@/context/UserContext';

interface DashboardProps {
  requests: CardProps[];
}

// Content
function SDashboardContent({ requests }: { requests: CardProps[] }) {
  const { user } = useUser();
  console.log({user})
  const displayName = user?.name || 'User';

  return (
    <div className="lg:overflow-y-auto min-h-screen overflow-y-auto max-h-[564px]">
      <Banner
        label={`Hi, ${displayName.split(' ')[0]} 👋🏻`}
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
        <div className="flex flex-col gap-4 bg-[var(--lightGray)] m-4 p-5 max-h-[564px] overflow-y-auto rounded-md lg:flex-1 lg:bg-white">
          <h2 className="text-xl font-bold">Your Team Today</h2>
          {schoolsData.map((school) => (
            <div key={school.id} className="p-5 rounded-lg bg-white lg:bg-gray-50">
              <div className="mb-3 flex flex-row items-center gap-2">
                <Image src={locationIcon} alt="Location" height={20} width={20} />
                <h2 className="text-xl">{school.name}</h2>
              </div>
              <div>
                {employees
                  .filter((e) => e.schoolId === school.id)
                  .map((emp) => (
                    <EmployeeCard key={emp.id} name={emp.name} className="my-2" />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dashboard involved in the userContext
export default function SDashboard({ requests }: DashboardProps) {
  return (
    <UserProvider>
      <SDashboardContent requests={requests} />
    </UserProvider>
  );
}

// SSR to get requests, employees on duty, request historial, and more
export const getServerSideProps: GetServerSideProps<DashboardProps> = async () => {
  const reqResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/requests`);
  const requestData: CardProps[] = await reqResponse.json();


  const today = new Date();
  const todayString = today.toISOString().split("T")[0];


  const requests: CardProps[] = requestData
    .filter((req) => {
      const reqDate = new Date(req.time as string); // asegurar que es string
      const reqDateString = reqDate.toISOString().split("T")[0];
      return reqDateString === todayString;
    })
    .map((req) => ({
      ...req,
      status: req.status as CardProps['status'],
    }));
  return {
    props: {
      requests,
    },
  };
};
