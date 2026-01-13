"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Cleaner from "@/assets/Images/cleaner.jpg";

type School = {
  _id: string;
  name: string;
};

export default function CreateSchoolRequest() {
  const [schools, setSchools] = useState<School[]>([]);
  const router = useRouter();

  // Cargar escuelas (igual que en supervisor)
  useEffect(() => {
    const getSchools = async () => {
      const res = await fetch("/api/schools");
      const data = await res.json();
      setSchools(data);
    };

    getSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const schoolName = formData.get("school") as string;
    const schoolId = schools.find(s => s.name === schoolName)?._id;

    await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        room: formData.get("room"),
        description: formData.get("description"),
        priority: formData.get("priority"),
        school: schoolName,
        schoolId,
        status: "todo",
      }),
    });

    alert("Request sent successfully");
    router.push("/"); // o donde quieras mandar al colegio después
  };

  return (
    <div className="min-h-screen bg-[#eef3f1] font-sans">
      {/* HERO */}
      <header className="bg-gradient-to-b from-[#0b132b] to-[#1c2541] text-white px-6 py-20 text-center mb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">
            Get in touch
          </h1>
          <p className="text-base opacity-90">
            Submit a request and ensure the right staff is notified and assigned. Fast, organized, and reliable — Educlean, cleaner schools, brighter learning.
          </p>
        </div>
      </header>

      {/* FORM */}
      <main className="flex justify-center -mt-20 px-6 pb-16">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          
          <div className="hidden lg:block">
            <Image
              src={Cleaner}
              alt="School cleaning"
              className="w-full h-full p-5 object-cover object-center"
            />
          </div>

          <form className="p-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Request title</label>
                <input
                  name="title"
                  required
                  className="px-3 py-2 border border-gray-200 rounded-md"
                  placeholder=""
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm mb-1">School</label>
                <select
                  name="school"
                  required
                  className="px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="">Select school</option>
                  {schools.map(s => (
                    <option key={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Room</label>
                <input
                  name="room"
                  className="px-3 py-2 border border-gray-200 rounded-md"
                  placeholder=""
                />
              </div>

              {/* <div className="flex flex-col">
                <label className="text-sm mb-1">
                  Task priority (optional)
                </label>
                <select
                  name="priority"
                  className="px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div> */}
            </div>

            <div className="flex flex-col mb-6">
              <label className="text-sm mb-1">Task description</label>
              <textarea
                name="description"
                rows={4}
                className="px-3 py-2 border border-gray-200 rounded-md resize-none"
                placeholder="There is an event at the school today..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-green-500 text-white cursor-pointer hover:bg-green-600 transition"
              >
                Submit request
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-center text-md text-gray-600 pb-8">
        Vancouver, British Columbia · (687) 246 90 26
      </footer>
    </div>
  );
}
