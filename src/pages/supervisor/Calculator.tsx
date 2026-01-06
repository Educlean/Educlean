"use client";

import React, { useState, useMemo } from "react";
import Banner from "@/components/Reusable/Banner";

interface TaskDef {
  task: string;
  minutes: number;
}

interface AreaState {
  tasks: string[];
  rooms: number;
  freq: number; // times per week
}

type FormData = Partial<Record<string, AreaState>>;

const cleaningTasks: Record<string, TaskDef[]> = {
  classrooms: [
    { task: "Desk wiping", minutes: 5 },
    { task: "Dusting", minutes: 4 },
    { task: "Garbage/recycling", minutes: 3 },
    { task: "Sweeping", minutes: 7 },
    { task: "Mopping", minutes: 5 },
    { task: "Vacuuming", minutes: 3 },
    { task: "Supplies refill / sink wipe", minutes: 3 },
    { task: "Whiteboards", minutes: 3 },
  ],
  offices: [
    { task: "Desk wiping", minutes: 1 },
    { task: "Dusting", minutes: 1 },
    { task: "Garbage/recycling", minutes: 1 },
    { task: "Sweeping", minutes: 1 },
    { task: "Mopping", minutes: 1 },
    { task: "Vacuuming", minutes: 1 },
  ],
  gym: [
    { task: "Sweep", minutes: 25 },
    { task: "Auto-scrub / Wet Tacking", minutes: 60 },
    { task: "Spot mopping", minutes: 10 },
    { task: "Garbage/recycling", minutes: 3 },
    { task: "Coach's room", minutes: 5 },
    { task: "Vacuum carpets", minutes: 2 },
  ],
  library: [
    { task: "Wipe tables", minutes: 10 },
    { task: "Dusting", minutes: 10 },
    { task: "Garbage/recycling", minutes: 3 },
    { task: "Vacuuming", minutes: 20 },
  ],
  musicRoom: [
    { task: "Vacuuming", minutes: 20 },
    { task: "Garbage/recycling", minutes: 3 },
    { task: "Dusting", minutes: 4 },
  ],
  cafeteria: [
    { task: "Wipe tables", minutes: 25 },
    { task: "Sweep floor", minutes: 20 },
    { task: "Mop floor / autoscrub", minutes: 30 },
  ],
  weightRoom: [
    { task: "Wipe equipment", minutes: 20 },
    { task: "Vacuum floors", minutes: 20 },
    { task: "Mop floors", minutes: 20 },
  ],
  staffRoom: [
    { task: "Garbage/recycling/compost", minutes: 2 },
    { task: "Wipe tables and countertops", minutes: 2 },
    { task: "Refill supplies and wipe sink", minutes: 2 },
    { task: "Wipe outside of appliances", minutes: 2 },
    { task: "Sweep floor", minutes: 4 },
    { task: "Mop floor", minutes: 3 },
  ],
  stairwells: [
    { task: "Vacuum", minutes: 2 },
    { task: "Mop", minutes: 2 },
  ],
  washrooms: [
    { task: "Small (1 stall)", minutes: 5 },
    { task: "Medium (2-3 stalls)", minutes: 10 },
    { task: "Large (4-5 stalls)", minutes: 15 },
    { task: "XL (+5 stalls)", minutes: 20 },
  ],
  elevator: [{ task: "Wipe, vacuum, mop", minutes: 10 }],
  largerRoom: [
    {
      task: "Wipe tables/chairs, sweep and mop floors, garbage removal",
      minutes: 25,
    },
  ],
  itLab: [
    {
      task: "Wiping desks, dusting monitors, sweeping/vacuuming, mopping",
      minutes: 20,
    },
  ],
  kitchen: [
    {
      task: "Dusting hood fans, garbage/recycling, sweeping and mopping floors",
      minutes: 25,
    },
  ],
  commons: [
    {
      task: "Wipe tables/chairs, sweep and mop floors, garbage removal",
      minutes: 30,
    },
  ],
  auditorium: [{ task: "Vacuum/sweep, mop, garbage", minutes: 30 }],
};

export default function CleaningCalculator() {
  const [formData, setFormData] = useState<FormData>({});

  const toggleTask = (area: string, task: string) => {
    setFormData((prev) => {
      const current = prev[area] ?? { tasks: [], rooms: 1, freq: 1 };
      const exists = current.tasks.includes(task);

      return {
        ...prev,
        [area]: {
          ...current,
          tasks: exists
            ? current.tasks.filter((t) => t !== task)
            : [...current.tasks, task],
        },
      };
    });
  };

  const updateInput = (
    area: string,
    field: keyof Omit<AreaState, "tasks">,
    value: number
  ) => {
    setFormData((prev) => {
      const current = prev[area] ?? { tasks: [], rooms: 1, freq: 1 };
      return {
        ...prev,
        [area]: { ...current, [field]: value },
      };
    });
  };

  const toggleAllTasks = (area: string) => {
    setFormData((prev) => {
      const current = prev[area] ?? { tasks: [], rooms: 1, freq: 1 };
      const allTasks = cleaningTasks[area].map((t) => t.task);
      const allSelected = allTasks.every((t) => current.tasks.includes(t));

      return {
        ...prev,
        [area]: {
          ...current,
          tasks: allSelected ? [] : allTasks,
        },
      };
    });
  };

  // 🔴 CALCULO CORRECTO CON REDONDEO DIARIO
  const totals = useMemo(() => {
    let dailyHours = 0;
    let weeklyHours = 0;

    Object.entries(formData).forEach(([area, areaState]) => {
      if (!areaState) return;

      const areaMinutes = areaState.tasks.reduce((sum, taskName) => {
        const task = cleaningTasks[area]?.find((t) => t.task === taskName);
        return task ? sum + task.minutes * areaState.rooms : sum;
      }, 0);

      const roundedDailyHours = Math.round(areaMinutes / 60);

      dailyHours += roundedDailyHours;
      weeklyHours += roundedDailyHours * areaState.freq;
    });

    return {
      daily: dailyHours,
      weekly: weeklyHours,
      monthly: weeklyHours * 4,
    };
  }, [formData]);

  return (
    <div>
      <Banner
        label="Cleaning Time Calculator"
        description="Estimate cleaning times based on selected tasks and frequencies."
      />

      <div className="mx-5 my-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 bg-gray-200 rounded-lg lg:max-w-6xl mx-auto">
          {Object.entries(cleaningTasks).map(([area, tasks]) => (
            <div key={area} className="bg-white p-3 rounded ">
              <h2 className="font-semibold capitalize text-[var(--primary)]">
                {area}
              </h2>

              <div className="flex justify-between gap-3 my-2">
                <label>
                  Quantity:
                  <input
                    type="number"
                    min={1}
                    value={formData[area]?.rooms ?? 1}
                    onChange={(e) =>
                      updateInput(area, "rooms", Number(e.target.value))
                    }
                    className="w-16 ml-2"
                  />
                </label>

                <label>
                  Times/week:
                  <input
                    type="number"
                    min={1}
                    value={formData[area]?.freq ?? 1}
                    onChange={(e) =>
                      updateInput(area, "freq", Number(e.target.value))
                    }
                    className="w-16 ml-2"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => toggleAllTasks(area)}
                className="text-sm underline text-[var(--primary)] mb-2"
              >
                Check/Uncheck All
              </button>

              {tasks.map((t) => (
                <label key={t.task} className="block text-sm">
                  <input
                    type="checkbox"
                    checked={formData[area]?.tasks.includes(t.task) ?? false}
                    onChange={() => toggleTask(area, t.task)}
                    className="mr-2"
                  />
                  {t.task} ({t.minutes} min)
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="my-10 max-w-6xl mx-auto">
          <div className="bg-[var(--primary)] rounded-lg p-2 text-white font-semibold">
            Time needed:
          </div>
          <div className="flex justify-between p-2">
            <p><strong>Daily:</strong> {totals.daily} hour</p>
            <p><strong>Weekly:</strong> {totals.weekly} hour</p>
            <p><strong>Monthly:</strong> {totals.monthly} hour</p>
          </div>
        </div>
      </div>
    </div>
  );
}
