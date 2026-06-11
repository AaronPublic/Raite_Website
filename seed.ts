import { seedSchools } from "./scripts/seed-schools";

seedSchools().then(() => {
  console.log("Schools seeded successfully.");
  process.exit(0);
}).catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
