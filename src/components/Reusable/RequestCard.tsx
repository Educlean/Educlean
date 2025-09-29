import { useState } from "react";
import ArrowUp from "../../assets/icons/ArrowUp.svg";
import ArrowDown from "../../assets/icons/ArrowDown.svg";
import Image from "next/image";
import React from "react";

type Status = "Pending" | "In progress" | "Completed";

export interface CardProps {
  school?: string;
  className?: string;
  status?: Status;
  title?: string;
  time?: string | Date;
  description?: string;
  room?: string;
}

function Card({
  school,
  className,
  status,
  title,
  time,
  description,
  room,
}: CardProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className={`${className} p-4 bg-white mt-4 rounded-md lg:bg-gray-50`}
      style={{ boxShadow: "inset 6px 0 0px -2px #39B52D" }}
    >
      <div>
        <div className="flex flex-row justify-between">
          <p className="font-bold">{school}</p>
          <p>
            {typeof time === "string"
              ? new Date(time).toLocaleTimeString()
              : time?.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-3">
            <p>{`${title} (${room})`}</p>
            <p
              className={`${
                status === "Pending"
                  ? "text-red-500 bg-red-100 rounded px-1"
                  : status === "In progress"
                    ? "text-blue-900 bg-blue-50 rounded px-1"
                    : "text-primary bg-green-100 rounded px-1"
              } font-bold`}
            >
              {status}
            </p>
          </div>

          <Image
            src={show ? ArrowDown : ArrowUp}
            alt="arrow"
            onClick={() => setShow((prev) => !prev)}
            className={`cursor-pointer transition-transform duration-300 
    ${show ? "rotate-180" : "rotate-180"}`}
          ></Image>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 border border-gray-300 rounded-lg mt-1
    ${show ? "max-h-90 opacity-100 p-4" : "max-h-0 opacity-0 p-0"}`}
      >
        <p className="whitespace-pre-wrap">{description}</p>
      </div>
    </div>
  );
}


export default React.memo(Card);