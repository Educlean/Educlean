import React, { useState } from "react";
import type { GetServerSideProps } from "next";
import Banner from "@/components/Reusable/Banner";
import Image from "next/image";
import ArrowDown from "@/assets/icons/ArrowDown.svg";
import CardSchool from "@/components/Reusable/SchoolCard";
import SchoolForm from "@/components/Reusable/AddSchool";
import search from "@/assets/icons/search.svg";
import type { SchoolDocument } from "../../../lib/types";

interface SchoolProps {
  schools: SchoolDocument[];
}

export default function CreateSchool({ schools }: SchoolProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sArray, setSArray] = useState<SchoolDocument[]>(schools);
  const [schoolList, setSchoolList] = useState<SchoolDocument[]>(schools);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = schoolList.filter((school) =>
      school.name.toLowerCase().includes(value)
    );
    setSArray(filtered);
  };
  console.log('leyendo modificaciones');

  return (
    <div className="mb-5 flex flex-col gap-8 min-h-screen">
      <Banner label="Directory" description="Check schools directory" />

      <div className="flex flex-col gap-5 mx-5">

        {/* LISTA */}
        <div className="flex flex-col gap-5 w-full bg-gray-200 p-5 rounded-lg overflow-y-auto max-h-[500px]">
          <div className="w-full flex flex-row justify-between items-center border-b border-gray-300 pb-2">
            <input
              type="text"
              placeholder="Search schools"
              onChange={onChange}
              className="bg-none outline-none flex-2"
            />
            <Image src={search} alt="search" className="h-4 w-4" />
          </div>

          {sArray.map((school) => (
            <CardSchool
              key={school._id}
              _id={school._id}
              name={school.name}
              address={school.address}
              phone={school.phone}
              sArray={setSArray}
              setSchoolList={setSchoolList}
            />
          ))}
        </div>

        {/* FORM */}
        <div className="flex flex-col gap-5 w-full bg-gray-200 p-5 rounded-lg">
          <div
            className="flex flex-row justify-between items-center cursor-pointer border p-2 max-w-[200px] rounded"
            onClick={() => setIsActive((prev) => !prev)}
          >
            <span>Add new school</span>
            <Image
              src={ArrowDown}
              alt="arrow"
              className={`transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
            />
          </div>

          {isActive && (
            <SchoolForm
              isActive={isActive}
              setSArray={setSArray}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SchoolProps> = async (context) => {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = context.req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  const response = await fetch(`${baseUrl}/api/schools`);
  const data: SchoolDocument[] = await response.json();

  return {
    props: {
      schools: data,
    },
  };
};
