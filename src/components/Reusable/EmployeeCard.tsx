import React from "react";
import userIcon from "../../assets/icons/user.svg";
import Image from "next/image";

export interface EmployeeProps {
  name: string;
  className: string;
}

function EmployeeCard({ name, className }: EmployeeProps) {
  console.log("Rendering EmployeeCard for:", name, "with className:", className);


 const nameParts = (name?.split(" ") || []).filter(Boolean); // elimina strings vacíos
let initials = "";

if (nameParts.length >= 2) {
  initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
} else if (nameParts.length === 1) {
  initials = nameParts[0][0];
}


  return (
    <div className="flex flex-row justify-between items-center border-b border-gray-300 pb-3">
      <div className={`${className} flex flex-row gap-3 items-center`}>
        <div className="rounded-full bg-[var(--accent)] w-6 h-6 flex items-center justify-center">
          <span className="text-white text-sm text-center">{initials}</span>
        </div>
        <p className="text-xl">{name}</p>
      </div>
      <div className="cursor-pointer">
        <Image src={userIcon} alt="user-icon" />
      </div>
    </div>
  );
}

export default React.memo(EmployeeCard);
