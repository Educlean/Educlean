import Image from "next/image";
import Banner from "../../components/Reusable/Banner";
import createAccount from "../../assets/Images/createAccount.png";
import PrimaryButton from "../../components/Reusable/PrimaryButton";
import React from "react";
import { useRouter } from "next/router";

export default function CreateAccount() {
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log({
      userId: formData.get("userId"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

    const response = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeID: formData.get("employeeID"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Error creating account");
      return;
    }

    alert("Account created successfully!");
    router.push("/supervisor/Dashboard");
  };

  return (
    <div className="mb-5 flex flex-col gap-8 min-h-screen">
      <Banner
        label="Create Account"
        description="Let's make your company grow!"
      />
      <div className="lg:max-w-full lg:bg-white lg:mx-5 lg:rounded-md">
        <Image
          src={createAccount}
          alt="create-account"
          className="max-w-full m-auto lg:max-w-[30rem] lg:h-[20rem] lg:m-auto"
        ></Image>
      </div>

      <form
        className="flex flex-col p-4 gap-5 w-full max-w-2xl mx-auto"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <label>UserID</label>
          <input
            name="employeeID"
            type="text"
            className="border border-gray-300 h-10 p-3 rounded-lg outline-[var(--primary)] "
            placeholder="Create ID"
          ></input>
        </div>
        <div className="flex flex-col gap-2">
          <label>Password</label>
          <input
            name="password"
            type="text"
            className="border border-gray-300 h-10 p-3 rounded-lg outline-[var(--primary)]"
            placeholder="Create Password"
          ></input>
        </div>
        <div className="flex flex-col gap-2">
          <label>Role</label>
          <select
            className="border h-10 border-gray-300 px-3 rounded-lg outline-[var(--primary)]"
            name="role"
          >
            <option value="" className="text-primary">
              Select role
            </option>
            <option>Cleaner</option>
            <option>Supervisor</option>
          </select>
        </div>
        <PrimaryButton label="Create account" type="submit" className="" />
      </form>
    </div>
  );
}