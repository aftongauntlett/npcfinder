import Dexie, { type EntityTable } from "dexie";

// Define interfaces for our database tables
export interface Weight {
  id?: number;
  date: string;
  weight: number;
  note?: string;
  createdAt: Date;
}

export interface Measurement {
  id?: number;
  date: string;
  waist?: number;
  hip?: number;
  chest?: number;
  thigh?: number;
  arm?: number;
  note?: string;
  createdAt: Date;
}

export interface Workout {
  id?: number;
  date: string;
  type: string;
  duration: number;
  exercises?: string;
  notes?: string;
  createdAt: Date;
}

export interface Meal {
  id?: number;
  date: string;
  period: string;
  quality: number;
  notes?: string;
  createdAt: Date;
}

export interface Settings {
  id: number;
  goalWeight: number | null;
  weeklyWorkoutTarget: number;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the database with typed tables
export class FitnessDatabase extends Dexie {
  weights!: EntityTable<Weight, "id">;
  measurements!: EntityTable<Measurement, "id">;
  workouts!: EntityTable<Workout, "id">;
  meals!: EntityTable<Meal, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("FitnessTracker");

    this.version(1).stores({
      weights: "++id, date, weight, note, createdAt",
      measurements:
        "++id, date, waist, hip, chest, thigh, arm, note, createdAt",
      workouts: "++id, date, type, duration, exercises, notes, createdAt",
      meals: "++id, date, period, quality, notes, createdAt",
      settings:
        "id, goalWeight, weeklyWorkoutTarget, theme, createdAt, updatedAt",
    });
  }
}

export const db = new FitnessDatabase();

// Initialize default settings
db.on("ready", async () => {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 1,
      goalWeight: null,
      weeklyWorkoutTarget: 3,
      theme: "system",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
});

export default db;
