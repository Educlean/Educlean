import React from "react";
// import { useRouter } from 'next/router';
import type { GetServerSideProps, GetStaticProps } from "next";
import Banner from "@/components/Reusable/Banner";
import { useState } from "react";
import Image from "next/image";
import ArrowDown from "@/assets/icons/ArrowDown.svg";
// import { SchoolCard } from "@/components/Reusable/SchoolCard";
import { SchoolDocument } from "../../../lib/types";
import CardSchool from "@/components/Reusable/SchoolCard";
import SchoolForm from "@/components/Reusable/AddSchool";
import search from "@/assets/icons/search.svg";

// import { FixedSizeList } from 'react-window';

interface schoolProps {
  schools: SchoolDocument[];
}

export default function CreateSchool({ schools }: { schools: SchoolDocument[] }) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sArray, setSArray] = useState<SchoolDocument[]>(schools);
  const [schoolList, setSchoolList] = useState<SchoolDocument[]>(schools);


  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = schoolList.filter((school) =>
      school.name.toLowerCase().includes(value),
    );
    setSArray(filtered);
    console.log("Filtered schools:", filtered);
  };

  return (
    <div className="mb-5 flex flex-col gap-8 min-h-screen">
      <Banner label="Directory" description="Check schools directory" />
      <div className="flex flex-col gap-5  mx-5">
        {/* Schools list */}
        <div className="flex flex-col gap-5 w-full  bg-gray-200 p-5 rounded-lg scroll-smooth overflow-y-auto max-h-[500px]">
          <div className="w-full flex flex-row justify-between items-center border-b border-gray-300 pb-2">
            <input
              type="text"
              name="search"
              placeholder="Search schools"
              className="bg-none outline-none  flex-2"
              onChange={onChange}
            />
            <Image src={search} alt="search" className="inline h-4 w-4" />
          </div>
          {sArray.map((s) => (
            <CardSchool
              key={s._id}
              _id={s._id}
              name={s.name}
              address={s.address}
              phone={s.phone}
              sArray={setSArray}
              setSchoolList={setSchoolList}
            />
          ))}
        </div>
        {/* Add school form */}
        <div className="flex flex-col gap-5 w-full bg-gray-200 p-5 rounded-lg ">
          <div
            className="flex flex-row justify-between gap-2 items-center cursor-pointer w-full cursor-pointer border p-2 max-w-[200px] rounded"
            onClick={() => setIsActive((prev) => !prev)}
          >
            <span>Add new school</span>
            <Image
              src={ArrowDown}
              alt="arrow"
              className={`cursor-pointer transition-transform duration-300  
      ${isActive ? "rotate-180" : "rotate-0"}`}
            />
          </div>
          <div className="w-full">
            {isActive ? <SchoolForm isActive={isActive} setSArray={setSArray} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<schoolProps> = async (context) => {

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = context.req?.headers.host;
  const baseUrl = `${protocol}://${host}`;

  const response = await fetch(
    `${baseUrl}/api/schools`,
    {
      method: "GET",
    },
  );

  const data: SchoolDocument[] = await response.json();
  console.log("SSR data:", data);

  return {
    props: {
      schools: data,
    },
  };
};
