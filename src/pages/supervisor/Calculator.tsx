import React, { useState } from "react";
import Banner from "@/components/Reusable/Banner";
import PrimaryButton from "@/components/Reusable/PrimaryButton";

const cleaningTasks = {
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
    auditorium: [
        { task: "Vacuum/sweep, mop, garbage", minutes: 30 },
    ],
} as Record<string, { task: string; minutes: number }[]>;




interface AreaData {
    tasks: string[];
    rooms: number | string;
    freq: number | string;
    [key: string]: any;
}

export default function CleaningCalculator() {
    const [formData, setFormData] = useState<Record<string, AreaData>>({});

    const toggleTask = (area: string, task: string) => {
        setFormData((prev) => {
            const current = prev[area] || { tasks: [], rooms: 1, freq: 1 };
            const exists = current.tasks.includes(task);
            return {
                ...prev,
                [area]: {
                    ...current,
                    tasks: exists
                        ? current.tasks.filter((t: string) => t !== task)
                        : [...current.tasks, task],
                },
            };
        });
    };

    const updateInput = (area: string, field: string, value: unknown) => {
        setFormData((prev) => {
            const current = prev[area] || { tasks: [], rooms: 1, freq: 1 };
            return {
                ...prev,
                [area]: { ...current, [field]: value },
            };
        });
    };

    const toggleAllTasks = (area: string) => {
        setFormData((prev) => {
            const current = prev[area] || { tasks: [], rooms: 1, freq: 1 };
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


    const totals = Object.entries(formData).reduce(
        (acc, [area, { tasks, rooms, freq }]) => {
            tasks.forEach((taskName) => {
                const task = cleaningTasks[area].find((t) => t.task === taskName);
                if (task) {
                    const r = Number(rooms);
                    const f = Number(freq);
                    const perDay = task.minutes * r;
                    acc.day += perDay;
                    acc.week += perDay * f;
                    acc.month += perDay * f * 4;
                }
            });
            return acc;
        },
        { day: 0, week: 0, month: 0 }
    );

    return (
        <div className="">
            <Banner label="Cleaning Time Calculator" description="Estimate cleaning times based on selected tasks and frequencies." />
            <div className="mx-5 my-5">
                <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 bg-gray-200 rounded-lg lg:max-w-6xl mx-auto lg:overflow-y-auto lg:max-h-[500px]">
                    {Object.entries(cleaningTasks).map(([area, tasks]) => (
                        <div key={area} className="bg-white p-3 rounded mt-4 border border-2 border-gray-100">
                            <div className=" ">
                                <h2 className="font-semibold capitalize text-[var(--primary)]">{area}</h2>

                                <div className="flex flex-row justify-between mb-2 gap-3">
                                    <label className="flex flex-row gap-2 items-center">
                                        Quantity:{" "}
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData[area]?.rooms ?? ""}
                                            onChange={(e) => {
                                                updateInput(area, "rooms", e.target.value);
                                            }}
                                            className="w-16"
                                        />
                                    </label>
                                    <label className="flex-1 ">
                                        Times/week:{" "}
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData[area]?.freq ?? ""}
                                            onChange={(e) => {
                                                updateInput(area, "freq", e.target.value);
                                            }}
                                            className="w-16"
                                        />

                                    </label>
                                </div>

                            </div>
                            <div className="p-3">
                                <div className="flex justify-start mb-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleAllTasks(area)}
                                        className="cursor-pointer text-sm text-[var(--primary)] underline hover:text-[var(--accent)]"
                                    >
                                        Check/Uncheck All
                                    </button>
                                </div>

                                {tasks.map((t) => (
                                    <label key={t.task} className="flex items-center cursor-pointer mb-2 pb-2">
                                        <input
                                            type="checkbox"
                                            checked={formData[area]?.tasks?.includes(t.task) || false}
                                            onChange={() => toggleTask(area, t.task)}
                                            className="hidden peer w-20"

                                        />
                                        <span className="w-4 h-4 border-2 border-gray-300 rounded-sm flex-shrink-0
                   flex items-center justify-center peer-checked:bg-[var(--accent)] peer-checked:border-none transition-colors">
                                            <svg
                                                className="hidden w-3 h-3 text-white peer-checked:block"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                viewBox="0 0 24 25"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                        <span className="ml-2">{t.task} ({t.minutes} min)</span>
                                    </label>


                                ))}
                            </div>

                        </div>

                    ))}
                </div>
                <div className="my-10 rounded max-w-xl">
                    <div className="bg-[var(--primary)] rounded-lg ">
                        <h2 className="text-lg font-semibold mb-2 p-2 text-white ">Time nedeed:</h2>
                    </div>
                    <div className="flex flex-row justify-between gap-10 p-2 ">
                        <p><strong>Daily:</strong> {(totals.day / 60).toFixed(0)} hour</p>
                        <p><strong>Weekly:</strong> {(totals.week / 60).toFixed(0)} hour</p>
                        <p><strong>Monthly:</strong> {(totals.month / 60).toFixed(0)} hour</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
