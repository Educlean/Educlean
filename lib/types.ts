
// ---------------- Accounts ----------------
export interface Account {
  _id?: string;           // MongoDB ObjectId as string
  employeeID: string;     // ID unique of the employee         // email of the employee
  passwordHash: string;   // hash of the password
  role: string;           // role of the employee (e.g. cleaner, supervisor)
}

// ---------------- Users ----------------
export interface Allergy {
  type: string;
  severity?: string;
}

export interface User {
  _id?: string;
  accountId: string;      // reference to Accounts._id
  name: string;
  email: string;
  mobile: string;
  DOB: Date | null;
  allergies: Allergy[];
  RH?: string;
  employeeID: string;
}

// ---------------- Schools ----------------
export interface SchoolAddress {
  street: string;
  city: string;
  zip: string;
}

export interface School {
  _id?: string;
  schoolName: string;
  schoolAddress: SchoolAddress;
  schoolPrimaryContact: string;
}

// ---------------- Requests ----------------
export type RequestStatus = "not started" | "started" | "finished";
export type RequestPriority = "low" | "medium" | "high";

export interface Request {
  _id?: string;
  schoolId: string;        // reference to Schools._id
  title: string;
  priority: RequestPriority;
  description: string;
  room?: string;
  status: RequestStatus;
}

// ---------------- Schedules ----------------
export interface Shift {
  startTime: string;       // start time "08:00"
  endTime: string;         // end time "12:00"
  schoolId: string;        // reference to Schools._id
}

export interface Schedule {
  _id?: string;
  userId: string;          // reference to Users._id
  weekStart: Date;
  shifts: Shift[];
}
