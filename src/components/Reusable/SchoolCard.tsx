import { useState } from "react";
import location from "../../assets/icons/location.svg";
import phoneIcon from "../../assets/icons/phone.svg";
import Image from "next/image";
import { SchoolDocument } from "../../../lib/types";
// import { School } from "../../lib/types";


export interface SchoolCardProps extends SchoolDocument {
  // Las funciones de setter ahora deben manejar el tipo SchoolDocument[]
  sArray: React.Dispatch<React.SetStateAction<SchoolDocument[]>>;
  setSchoolList: React.Dispatch<React.SetStateAction<SchoolDocument[]>>;
}

export default function SchoolCard({
  name,
  address,
  phone,
  _id,
  sArray,
  setSchoolList,
}: SchoolCardProps) {
  const [editable, setEditable] = useState(false);
  const [formData, setFormData] = useState({
    name,
    address: address,
    contact: phone,
    _id,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log("Save data in db:", formData);
    setEditable(false);
    try {
      const response = fetch(`/api/schools?id=${_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.contact,
        }),
      });
    } catch (error) {
      console.error("Error updating school:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = (e.target as HTMLButtonElement).value;
    console.log("Delete school with id:", id);
    try {
      const response = await fetch(`/api/schools?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log("School deleted successfully");
        // Optionally, you can add logic to remove the card from the UI
        sArray((prev: SchoolDocument[]) =>
          prev.filter((school) => school._id !== id),
        );
        setSchoolList((prev: SchoolDocument[]) =>
          prev.filter((school) => school._id !== id),
        );
      } else {
        console.error("Failed to delete school");
      }
    } catch (error) {
      console.error("Error deleting school:", error);
    }
  };

  return (
    <div className="flex flex-row items-center justify-between gap-0 border border-gray-300 bg-white rounded-lg p-4">
      <div className="flex flex-col gap-2">
        <div>
          {editable ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-gray-200 p-1 rounded lg:w-50 outline-[var(--primary)]"
            />
          ) : (
            <p className="font-bold">{formData.name}</p>
          )}
        </div>
        <div className="flex flex-row gap-2 flex-wrap">
          {editable ? (
            <>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="bg-gray-200 p-1 rounded w-32 w-80 outline-[var(--primary)]"
              />
            </>
          ) : (
            <div className="flex flex-row gap-1 items-center">
              <Image src={location} alt="Location" className="h-4 w-4" />
              <p className="">{formData.address}</p>
            </div>
          )}

          {editable ? (
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="bg-gray-200 p-1 rounded outline-[var(--primary)]"
            />
          ) : (
            <div className="flex flex-row gap-1 items-center">
              <Image src={phoneIcon} alt="Phone" className="h-4 w-4" />
              <p>{formData.contact}</p>
            </div>
          )}
        </div>
      </div>
      <div className="hidden md:block">
        {editable ? (
          <div className="flex flex-row-reverse gap-2">
            <button
              onClick={handleSave}
              className="bg-[var(--primary)] cursor-pointer text-white px-3 py-1 rounded"
              value={_id}
            >
              Save
            </button>
            <button
              onClick={handleDelete}
              className="border border-[var(--primary)] cursor-pointer  px-3 py-1 rounded"
              name="delete"
              value={_id}
            >
              Eliminate
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditable(true)}
            className="bg-[var(--primary)] cursor-pointer text-white px-3 py-1 rounded"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
