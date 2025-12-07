import { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import Modal from "./Modal";
// IMPORTAR SchoolDocument desde donde sea que esté definido
import type { SchoolDocument } from "../../../lib/types"; // <-- ¡Asegura esta ruta!

// Definimos la interfaz para la estructura de datos que se guarda/manipula.
interface SchoolData {
  // 1. AÑADIR _id como opcional para compatibilidad con el tipo SchoolDocument del padre.
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
  // 2. CORREGIR el tipo de la prop setSArray para usar el tipo del padre.
  setSArray: React.Dispatch<React.SetStateAction<SchoolDocument[]>>;
};

export default function ASchoolForm({ isActive, setSArray }: ASchoolFormProps) {
  const [warning, setWarning] = useState<string>("");
  const [formData, setFormData] = useState<SchoolData>({
    // ... (el estado inicial es compatible)
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

  // Función para obtener lat lng de la dirección usando la API de Nominatim
  const fetchLatLng = async (address: string) => {
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
      const finalData: SchoolData = { ...formData, ...geoData }; // finalData ahora tiene _id?: string

      console.log("Data to save in DB:", finalData);
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      // Asegúrate de que la respuesta de la API incluya el _id generado
      const data: { message?: string, _id?: string } = await response.json(); 

      if (!response.ok) {
        setWarning(data.message || "Error adding school");
      } else {
        setFormData({ name: "", address: "", phone: "", lat: 0, lng: 0 });
        
        // 3. CAST EXPLÍCITO para compatibilidad: 
        // Aunque finalData tiene _id?, lo tratamos como SchoolDocument.
        const schoolWithId = { ...finalData, _id: data._id || 'temp-id' }; // Aseguramos el _id si viene de la API
        
        // El cast final permite añadir SchoolData a SchoolDocument[]
        setSArray((prev) => [...prev, schoolWithId as SchoolDocument]); 
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
