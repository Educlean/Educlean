import React from "react";
import userIcon from "../../assets/icons/user.svg";
import Image from "next/image";

export interface EmployeeProps {
  name: string;
  className: string;
}

function employeeCard ({ name, className }: EmployeeProps) {
  console.log("Rendering EmployeeCard for:", name, "with className:", className);
  const initials: string[] = name?.split(" ") || [];

  return (
    <div className="flex flex-row justify-between items-center border-b border-gray-300 pb-3">
      <div className={`${className} flex flex-row gap-3 items-center`}>
        <div className="rounded-full bg-[var(--accent)] w-6 h-6 flex items-center justify-center">
          {initials.map((p, i) => (
            <span className="text-white text-sm text-center" key={i}>
              {p[0]}
            </span>
          ))}
        </div>
        <p className="text-xl">{name}</p>
      </div>
      <div className="cursor-pointer">
        <Image src={userIcon} alt="user-icon" />
      </div>
    </div>
  );
}


export default React.memo(employeeCard);