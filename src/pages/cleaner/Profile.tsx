'use client';

import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from '@/context/UserContext';
import Banner from '../../components/Reusable/Banner';
import PrimaryButton from '../../components/Reusable/PrimaryButton';
import type { Allergy } from '../../../lib/types';

function CleanerFormContent() {
  const { user, setUser } = useUser();

  interface FormData {
    name: string;
    email: string;
    mobile: string;
    DOB: string;
    RH: string;
    allergies: Allergy[];
  }

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    DOB: user?.DOB
      ? user.DOB instanceof Date
        ? user.DOB.toISOString().split('T')[0]
        : (user.DOB as string)
      : '',
    RH: user?.RH || '',
    allergies: (user?.allergies as Allergy[]) || [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        mobile: user.mobile || '',
        email: user.email || '',
        DOB: user.DOB
          ? user.DOB instanceof Date
            ? user.DOB.toISOString().split('T')[0]
            : (user.DOB as string)
          : '',
        RH: user.RH || '',
        allergies: (user.allergies as Allergy[]) || [],
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      const newA: Allergy = { type: newAllergy.trim() };
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newA],
      }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.accountId) {
      alert('Error: No se pudo identificar el usuario');
      return;
    }

    setIsSaving(true);

    try {
      const userResponse = await fetch(`/api/users?accountId=${user.accountId}`);
      if (!userResponse.ok) {
        alert('Error al obtener información del usuario');
        setIsSaving(false);
        return;
      }

      const userData = await userResponse.json();
      const userId = userData._id;

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: formData.name,
            mobile: formData.mobile,
            email: formData.email,
            DOB: formData.DOB,
            RH: formData.RH,
            allergies: formData.allergies,
          }),
      });

      const responseData = await response.json();

      if (response.ok) {
        const dobValue: Date | null = formData.DOB ? new Date(formData.DOB) : null;

        setUser({
          ...user,
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          DOB: dobValue,
          RH: formData.RH,
          allergies: formData.allergies,
        });

        alert('Profile updated successfully');
        setIsEditing(false);
      } else {
        alert(`Error updating profile: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to the server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      mobile: user?.mobile || '',
      DOB: user?.DOB
        ? user.DOB instanceof Date
          ? user.DOB.toISOString().split('T')[0]
          : (user.DOB as string)
        : '',
      email: user?.email || '',
      RH: user?.RH || '',
      allergies: (user?.allergies as Allergy[]) || [],
    });
    setIsEditing(false);
  };

  if (!user) return <p>Loading...</p>;

  if (!user.accountId) {
    return (
      <div className="md:max-w-2xl md:m-auto lg:max-w-full lg:mx-5 mb-5 flex flex-col gap-8 min-h-screen p-4">
        <Banner label="My Profile" description="Update your personal information" />
        <div className="border border-red-300 bg-red-50 text-red-700 p-4 rounded-lg">
          <p className="font-bold">Configuration Error</p>
          <p>Could not retrieve account ID. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:max-w-2xl md:m-auto lg:max-w-full lg:mx-5 mb-5 flex flex-col gap-8 min-h-screen">
      <Banner label="My Profile" description="Update your personal information" />

      <form onSubmit={handleSubmit} className="flex flex-col p-4 gap-5">
        {/* Employee ID (Read-only) */}
        <div className="flex flex-col gap-2">
          <label htmlFor="EmployeeID">Employee ID</label>
          <input
            id="EmployeeID"
            value={user.employeeID ?? ''}
            className="border border-gray-300 h-10 p-3 rounded-lg bg-gray-100"
            disabled
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`border border-gray-300 h-10 p-3 rounded-lg ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="Your full name"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`border border-gray-300 h-10 p-3 rounded-lg ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="you@example.com"
          />
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-2">
          <label htmlFor="mobile">Mobile</label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`border border-gray-300 h-10 p-3 rounded-lg ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* DOB */}
        <div className="flex flex-col gap-2">
          <label htmlFor="DOB">Date of birth</label>
          <input
            id="DOB"
            name="DOB"
            type="date"
            value={formData.DOB}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`border border-gray-300 h-10 p-3 rounded-lg ${!isEditing ? 'bg-gray-100' : ''}`}
          />
        </div>

        {/* RH */}
        <div className="flex flex-col gap-2">
          <label htmlFor="RH">RH</label>
          <select
            id="RH"
            name="RH"
            value={formData.RH}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`border h-10 px-3 rounded-lg border-gray-300 ${!isEditing ? 'bg-gray-100' : ''}`}
          >
            <option value="">Select</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

        {/* Allergies */}
        <div className="flex flex-col gap-2">
          <label>Allergies</label>

          {formData.allergies.length > 0 ? (
            <ul className="space-y-2">
              {formData.allergies.map((allergy, index) => (
                <li
                  key={`${allergy.type}-${index}`}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                >
                  <span>{allergy.type}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(index)}
                      className="text-red-600 font-semibold"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No allergies registered</p>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="New allergy"
                className="border border-gray-300 h-10 p-3 rounded-lg flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
              />
              <PrimaryButton
                type="button"
                label="Add"
                onClick={handleAddAllergy}
                className='mt-[-5px]'
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing ? (
          <div className="flex items-center justify-center">
            <PrimaryButton
              type="button"
              label="Edit profile"
              onClick={() => setIsEditing(true)}
            />
          </div>
        ) : (
          <div className="justify-center  flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-[150px] rounded-lg p-3 text-white mt-2 ${
                isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--primary)]'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="w-[150px] border border-gray-300 rounded-lg p-3 flex items-center justify-center text-gray-700 disabled:bg-gray-200 mt-2"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function CleanerForm() {
  return (
    <UserProvider>
      <CleanerFormContent />
    </UserProvider>
  );
}
