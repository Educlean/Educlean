import { useState } from "react";
import PrimaryButton from "./PrimaryButton";

export default function ASchoolForm({ isActive }: { isActive: boolean }) {
  const [warning, setWarning] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    lat: 0,
    lng: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // function to fetch lat lng from address using nominatim openstreetmap api
  const fetchLatLng = async (address: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const place = data[0];

      return {
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      };
    } else {
      return {
        lat: 0,
        lng: 0,
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // geocode the address before submitting
    try {
      const geoData = await fetchLatLng(formData.address);
      const finalData = { ...formData, ...geoData };

      console.log("Data to save in DB:", finalData);
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });
      const data = await response.json();
      if (!response.ok) {
        setWarning(data.message || "Error adding school");
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
      alert(`Error fetching location data ${error}`);
      return;
    }
  };
  return isActive ? (
    <div className="flex flex-col gap-5 w-full max-w-5xl rounded-lg mx-auto bg-white p-10">
      <div className="bg-red-500 flex-1 w-full"></div>
      <div className="flex-1 w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label>Name</label>
            <input
              name="name"
              type="text"
              className="border border-gray-300 h-10 p-3 rounded-lg outline-[var(--primary)]"
              placeholder="School name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label>School Address</label>
            <input
              name="address"
              type="text"
              className="border border-gray-300 h-10 p-3 rounded-lg outline-[var(--primary)]"
              placeholder="School Address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label>School Phone Number</label>
            <input
              name="phone"
              type="text"
              className="border border-gray-300 h-10 p-3 rounded-lg outline-[var(--primary)]"
              placeholder="School Phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          {warning ? <p className="text-red-500 text-sm">{warning}</p> : null}
          <PrimaryButton label="Add school" type="submit" className="" />
        </form>
      </div>

    </div>
  ) : null;
}
