import { useEffect, useState } from 'react';
import Banner from '../../components/Reusable/Banner';
import PrimaryButton from '../../components/Reusable/PrimaryButton';
// import schoolsData from '../../data/schools.json';
import React from 'react';
import { useRouter } from 'next/router';

type School = {
  _id: string;
  name: string;
  short: string;
};

export default function CreateRequest() {
  const [schools, setSchools] = useState<School[]>([]);
  const router = useRouter();

  console.log('schools', schools)
  useEffect(() => {
    const getSchools = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schools`);
      const data = await res.json();
      setSchools(data);
    };
    getSchools();
  }, []);
  console.log(schools);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = schools.find(s => s.name === formData.get('school'))?._id;
    console.log('schoolId', schoolId);

    console.log({
      school: formData.get('school'),
      priority: formData.get('priority'),
      description: formData.get('description'),
      title: formData.get('title'),
      room: formData.get('room'),
    });

    await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        school: formData.get('school'),
        priority: formData.get('priority'),
        description: formData.get('description'),
        title: formData.get('title'),
        room: formData.get('room'),
        status: 'Pending',
        time: new Date().toISOString(),
        schoolId,
      }),
    })

    alert('Request created successfully!');
    router.push('/supervisor/Dashboard');
  };
 




  return (
    <div className="md:max-w-2xl md:m-auto lg:max-w-full lg:mx-5 mb-5 flex flex-col gap-8 min-h-screen">
      <Banner
        label="Create Request"
        description="Communicate your team what to do!"
      />
      <form className="flex flex-col p-4 gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label>Request title</label>
          <input
            name="title"
            type="text"
            className="border border-gray-300 h-10 p-3 rounded-lg"
            placeholder="Title" 
            required
          ></input>
        </div>
        <div className="flex flex-col gap-2">
          <label>{`Room (Optional)`}</label>
          <input
            name="room"
            type="text"
            className="border border-gray-300 h-10 p-3 rounded-lg"
            placeholder="Create Password"
            required
          ></input>
        </div>
        <div className="flex flex-col gap-2">
          <label>School</label>
          <select className="border h-10 px-3 border-gray-300 rounded-lg" name="school" required>
            <option value="-" className="text-primary">
              Select school
            </option>
            {schools.map((s, i) => (
              <option key={i}>{`${s.name}`}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label>Task priority</label>
          <select className="border h-10 px-3 rounded-lg border-gray-300" name="priority" required>
            <option value="" className="text-primary">
              Priority
            </option>
            <option value="" className="text-primary">
              High
            </option>
            <option value="" className="text-primary">
              Medium
            </option>
            <option value="" className="text-primary">
              Low
            </option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label>Description</label>
          <textarea
            name="description"
            rows={4}
            className="border p-3 rounded-lg border-gray-300"
            placeholder="Describe what you need us to do."
          />
        </div>
          <PrimaryButton
            label="Create request"
            type="submit"
            className="bg-primary rounded-lg p-3 text-white mt-2"
          />
      </form>
    </div>
  );
}
