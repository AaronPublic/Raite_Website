import { db } from "./src/lib/db";

async function inspectDb() {
  console.log("Inspecting db object models...");
  console.log("Keys in db:", Object.keys(db));
  
  const hasEntry = 'leaderboardEntry' in db || 'leaderboard_entry' in db;
  console.log("Has LeaderboardEntry?", hasEntry);
  
  process.exit(0);
}

inspectDb();
