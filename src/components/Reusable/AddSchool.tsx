import { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import Modal from "./Modal";
// IMPORTAR SchoolDocument desde el path correcto
import { SchoolDocument } from "../../../lib/types";

// Definimos la interfaz para la estructura de datos que se guarda/manipula.
interface SchoolData {
  // CORRECCIÓN 1: Hacemos _id opcional para compatibilidad local.
  _id?: string; 
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

// Definimos la interfaz para las props del componente
type ASchoolFormProps = {
  isActive: boolean;
  // CORRECCIÓN 2: Usamos el tipo SchoolDocument[] para el setter,
  // ya que este es el tipo que el componente padre (School.tsx) espera.
  setSArray: React.Dispatch<React.SetStateAction<SchoolDocument[]>>;
};

export default function ASchoolForm({ isActive, setSArray }: ASchoolFormProps) {
  const [warning, setWarning] = useState<string>("");
  const [formData, setFormData] = useState<SchoolData>({
    name: "",
    address: "",
    phone: "",
    lat: 0,
    lng: 0,
  });
  const [activeModal, setActiveModal] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchLatLng = async (address: string) => {
    // ... (función fetchLatLng permanece igual)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
    );
    const data: Array<{ lat: string, lon: string }> = await res.json();
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
    
    try {
      const geoData = await fetchLatLng(formData.address);
      const finalData: SchoolData = { ...formData, ...geoData };

      console.log("Data to save in DB:", finalData);
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      // Aseguramos que la respuesta devuelva el _id
      const data: { message?: string, _id?: string } = await response.json(); 

      if (!response.ok) {
        setWarning(data.message || "Error adding school");
      } else {
        setFormData({ name: "", address: "", phone: "", lat: 0, lng: 0 });
        
        // Creamos el objeto final asegurando que tenga _id (aunque sea temporal)
        const schoolWithId: SchoolDocument = { 
            ...finalData, 
            _id: data._id || 'temp-' + Date.now().toString(), // CORRECCIÓN 3: Aseguramos la existencia de _id
            // TypeScript ahora sabe que este objeto es un SchoolDocument
        };
        
        // El cast final se puede simplificar si schoolWithId ya es SchoolDocument
        setSArray((prev) => [...prev, schoolWithId]); 
        setActiveModal(true);
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
      alert(`Error fetching location data ${error}`);
      return;
    }
  };
  
  return isActive ? (
    <div className="flex flex-col gap-5 w-full max-w-5xl rounded-lg mx-auto bg-white p-10">
      {/* ... (el resto del JSX) ... */}
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
              required
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
              required
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
              required
            />
          </div>
          {warning ? <p className="text-red-500 text-sm">{warning}</p> : null}
          <PrimaryButton label="Add school" type="submit" className="" />
        </form>
      </div>
      {activeModal && <Modal text="New School Added Sucessfully" title="School Added" isOpen={true} onClose={() => setActiveModal(false)} />}
    </div>
  ) : null;
}
