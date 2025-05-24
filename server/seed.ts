import { db } from "./db";
import { topics } from "@shared/schema";

export async function seedTopics() {
  // Check if topics already exist
  const existingTopics = await db.select().from(topics);
  
  if (existingTopics.length === 0) {
    console.log('[Seed] No topics found, seeding default topics...');
    const defaultTopics = [
      { title: "Should AI be regulated?", difficulty: 3 },
      { title: "Is universal basic income a viable economic policy?", difficulty: 4 },
      { title: "Should social media platforms be held responsible for user content?", difficulty: 3 },
      { title: "Is nuclear energy the solution to climate change?", difficulty: 4 },
      { title: "Should voting be mandatory in democratic countries?", difficulty: 2 },
      { title: "Are standardized tests an effective measure of student ability?", difficulty: 3 },
      { title: "Should cryptocurrencies be regulated like traditional currencies?", difficulty: 4 },
      { title: "Is space exploration a worthwhile investment of public resources?", difficulty: 3 }
    ];
    
    // Insert topics in batches
    await db.insert(topics).values(defaultTopics);
    console.log('[Seed] Default topics added successfully');
  } else {
    console.log(`[Seed] ${existingTopics.length} topics already exist, skipping seed`);
  }
}