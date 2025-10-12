import Dexie from "dexie";

export const db = new Dexie("FitnessTracker");

db.version(1).stores({
  weights: "++id, date, weight, note, createdAt",
  measurements: "++id, date, waist, hip, chest, thigh, arm, note, createdAt",
  workouts: "++id, date, type, duration, exercises, notes, createdAt",
  meals: "++id, date, period, quality, notes, createdAt",
  settings: "id, goalWeight, weeklyWorkoutTarget, theme, createdAt, updatedAt",
});

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
