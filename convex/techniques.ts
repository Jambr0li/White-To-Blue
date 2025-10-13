import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all techniques with user progress
export const getAllTechniques = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Get all techniques
    const techniques = await ctx.db.query("techniques").collect();
    
    // Get user's progress for all techniques
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    // Create a map of techniqueId -> progress
    const progressMap = new Map(
      progressRecords.map((p) => [p.techniqueId, p])
    );
    
    // Combine techniques with user progress
    return techniques.map((technique) => {
      const progress = progressMap.get(technique._id);
      return {
        _id: technique._id,
        name: technique.name,
        category: technique.category,
        videoUrl: technique.videoUrl,
        learned: progress?.learned ?? false,
        learnedAt: progress?.learnedAt,
        notes: progress?.notes,
        progressId: progress?._id,
      };
    });
  },
});

// Get techniques by category with user progress
export const getTechniquesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Get techniques by category
    const techniques = await ctx.db
      .query("techniques")
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
    
    // Get user's progress for these techniques
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    // Create a map of techniqueId -> progress
    const progressMap = new Map(
      progressRecords.map((p) => [p.techniqueId, p])
    );
    
    // Combine techniques with user progress
    return techniques.map((technique) => {
      const progress = progressMap.get(technique._id);
      return {
        _id: technique._id,
        name: technique.name,
        category: technique.category,
        videoUrl: technique.videoUrl,
        learned: progress?.learned ?? false,
        learnedAt: progress?.learnedAt,
        notes: progress?.notes,
        progressId: progress?._id,
      };
    });
  },
});

// Update user's progress for a technique
export const updateUserProgress = mutation({
  args: { 
    techniqueId: v.id("techniques"),
    learned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const now = Date.now();
    
    // Check if progress record exists
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_and_technique", (q) => 
        q.eq("userId", userId).eq("techniqueId", args.techniqueId)
      )
      .first();
    
    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        learned: args.learned,
        learnedAt: args.learned ? now : undefined,
        updatedAt: now,
      });
      return existingProgress._id;
    } else {
      // Create new progress record
      const progressId = await ctx.db.insert("userProgress", {
        userId,
        techniqueId: args.techniqueId,
        learned: args.learned,
        learnedAt: args.learned ? now : undefined,
        updatedAt: now,
      });
      return progressId;
    }
  },
});

// Update user's notes for a technique
export const updateUserNotes = mutation({
  args: {
    techniqueId: v.id("techniques"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const now = Date.now();
    
    // Check if progress record exists
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_and_technique", (q) => 
        q.eq("userId", userId).eq("techniqueId", args.techniqueId)
      )
      .first();
    
    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        notes: args.notes,
        updatedAt: now,
      });
      return existingProgress._id;
    } else {
      // Create new progress record with notes
      const progressId = await ctx.db.insert("userProgress", {
        userId,
        techniqueId: args.techniqueId,
        learned: false,
        notes: args.notes,
        updatedAt: now,
      });
      return progressId;
    }
  },
});

// Reset all user progress
export const resetAllProgress = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Get all user's progress records
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    // Update all progress records to not learned
    for (const progress of progressRecords) {
      await ctx.db.patch(progress._id, {
        learned: false,
        learnedAt: undefined,
        updatedAt: Date.now(),
      });
    }
    
    return { count: progressRecords.length };
  },
});

// Seed initial techniques data
export const seedTechniques = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if techniques already exist
    const existingTechniques = await ctx.db.query("techniques").collect();
    if (existingTechniques.length > 0) {
      return { message: "Techniques already seeded" };
    }

    const initialTechniques = [
      // Punch Defense
      {
        name: "Tuck/duck under to the back-belly to back",
        note: "Sacrifice/step behind",
        category: "Punch Defense",
      },
      // Cover Crash & Clinch to T-POSITION
      {
        name: "Single leg Wrestling takedown (run the pipe)",
        note: "Knee on belly finish",
        category: "Cover Crash & Clinch to T-POSITION",
      },
      {
        name: "Leg Reap (Ko-Soto-Gari) (end in mount)",
        note: "Control to the ground",
        category: "Cover Crash & Clinch to T-POSITION",
      },
      {
        name: "Single leg Wrestling takedown (run the pipe)",
        category: "Cover Crash & Clinch to T-POSITION",
      },
      // Head Lock Defense from the ground
      {
        name: "Frame face & sit up",
        note: "End in triple threat",
        category: "Head Lock Defense from the ground",
      },
      {
        name: "Hook Leg over face to sit up",
        note: "End in triple threat",
        category: "Head Lock Defense from the ground",
      },
      {
        name: "Face in Mud back door escape (leg over hip)",
        note: "End in triple threat",
        category: "Head Lock Defense from the ground",
      },
      {
        name: "Wrestler Head & Arm Bridge Roll (align hips)",
        note: "Use attackers motion",
        category: "Head Lock Defense from the ground",
      },
      // Head Lock Defense from standing
      {
        name: "Face push and Lift Leg",
        note: "End in triple threat",
        category: "Head Lock Defense from standing",
      },
      {
        name: "Leg scoop, drop step (Run the Pipe)",
        note: "Knee on belly finish",
        category: "Head Lock Defense from standing",
      },
      {
        name: "Against Punches",
        note: "Finish with take down",
        category: "Head Lock Defense from standing",
      },
      {
        name: "Bent Forward-roll forward grab the hip (roll through the legs)",
        note: "End in triple threat",
        category: "Head Lock Defense from standing",
      },
      {
        name: "Sacrifice backward (wide base)",
        note: "End in triple threat",
        category: "Head Lock Defense from standing",
      },
      // Choke Defense (rear attacks)
      {
        name: "Throw over shoulder",
        note: "Early",
        category: "Choke Defense (rear attacks)",
      },
      {
        name: "Foot trap Osoto Gari",
        note: "On time",
        category: "Choke Defense (rear attacks)",
      },
      {
        name: "Dumped to ground - far guard recovery",
        note: "Late",
        category: "Choke Defense (rear attacks)",
      },
      // Choke Defense (forward facing)
      {
        name: "Two Hand Throat grab 1 - Duck, parry, elbow strike",
        note: "Cross elbow strikes",
        category: "Choke Defense (forward facing)",
      },
      {
        name: "Two Hand Throat grab 2 - Duck, parry, double leg",
        note: "Cut angle double leg",
        category: "Choke Defense (forward facing)",
      },
      {
        name: "One handed lapel grab-wrist twist Osoto Gari",
        note: "Burrito grip",
        category: "Choke Defense (forward facing)",
      },
      {
        name: "Two Hand Throat/Lapel grab against wall",
        note: "Over/under grips",
        category: "Choke Defense (forward facing)",
      },
      {
        name: "One Hand Throat grab against wall",
        note: "Near elbow strikes",
        category: "Choke Defense (forward facing)",
      },
      {
        name: "Standing Guillotine Defense (high elbow rotate opposite of head)",
        category: "Choke Defense (forward facing)",
      },
      // Bear Hug Defense (forward facing)
      {
        name: "Arms pinned Frame/knee strike/guillotine",
        note: "Hands on hips",
        category: "Bear Hug Defense (forward facing)",
      },
      {
        name: "Arms free-Frame/knee strike/guillotine",
        note: "Hands on face",
        category: "Bear Hug Defense (forward facing)",
      },
      // Bear Hug Defense (rear attack)
      {
        name: "Arms pinned - Step behind/around, lift and tilt",
        category: "Bear Hug Defense (rear attack)",
      },
      {
        name: "Arms tree 1 - Ankle grab",
        note: "Finish with leg bar",
        category: "Bear Hug Defense (rear attack)",
      },
      {
        name: "Arms free 2 - Kimura",
        note: "North/South finish",
        category: "Bear Hug Defense (rear attack)",
      },
      // Back Mount (arm bars)
      {
        name: "Weakside Armlock from back W/proper head foot position control",
        category: "Back Mount (arm bars)",
      },
      // Back Mount (chokes)
      {
        name: "Rear naked choke",
        note: "Palm to palm",
        category: "Back Mount (chokes)",
      },
      {
        name: "Long short choke",
        note: "Flip the collar",
        category: "Back Mount (chokes)",
      },
      {
        name: "Chicken Wing choke",
        note: "Flip the collar",
        category: "Back Mount (chokes)",
      },
      {
        name: "Bow & arrow choke - Leg over shoulder",
        note: "Capture arm",
        category: "Back Mount (chokes)",
      },
      {
        name: "Bow & arrow choke - Power",
        note: "Knee on back",
        category: "Back Mount (chokes)",
      },
      // Back Mount (escape)
      {
        name: "Fingers point the way out - weak side to half guard",
        note: "Head to mat",
        category: "Back Mount (escape)",
      },
      // Fundamental Movements
      {
        name: "Bridge",
        category: "Fundamental Movements",
      },
      {
        name: "Shrimp",
        note: "Hips off the mat",
        category: "Fundamental Movements",
      },
      {
        name: "Forward Shrimp",
        category: "Fundamental Movements",
      },
      {
        name: "Seated Upright Shrimp",
        category: "Fundamental Movements",
      },
      {
        name: "Seated Upright Shrimp to Techincal Stand Up",
        category: "Fundamental Movements",
      },
      {
        name: "Back Roll/Forward Roll",
        note: "With break fall",
        category: "Fundamental Movements",
      },
      {
        name: "Wrestling pummel 101",
        note: "Standing pummel drill",
        category: "Fundamental Movements",
      },
      {
        name: "Osoto-Gari",
        note: "Leg Reap",
        category: "Fundamental Movements",
      },
      {
        name: "Double leg traditional or Blast double",
        category: "Fundamental Movements",
      },
      // Guard
      {
        name: "Straight Armbar",
        note: "Hook the leg",
        category: "Guard",
      },
      {
        name: "Kimura",
        note: "Cut the angle",
        category: "Guard",
      },
      // Guard Chokes
      {
        name: "Cross choke",
        category: "Guard Chokes",
      },
      {
        name: "Triangle choke - leg scoop",
        category: "Guard Chokes",
      },
      {
        name: "Guillotine choke",
        category: "Guard Chokes",
      },
      {
        name: "Arm Triangle",
        category: "Guard Chokes",
      },
      // Guard Sweeps
      {
        name: "Scissor",
        category: "Guard Sweeps",
      },
      {
        name: "Push Scissor",
        note: "Elbow to mat",
        category: "Guard Sweeps",
      },
      {
        name: "Sit-Up hip sweep",
        note: "Hand to mat",
        category: "Guard Sweeps",
      },
      // Guard Passes
      {
        name: "Posture Defense",
        note: "Head up eyes up",
        category: "Guard Passes",
      },
      {
        name: "Near knee staple -Long back step pass",
        category: "Guard Passes",
      },
      {
        name: "Near Knee staple Windshield wipe legs",
        category: "Guard Passes",
      },
      {
        name: "Knee slice pass (head down)",
        note: "Early under hook",
        category: "Guard Passes",
      },
      {
        name: "Arm under leg pass (triangle prevention)",
        category: "Guard Passes",
      },
      {
        name: "Standing pass (two on one)",
        note: "Hip thrust",
        category: "Guard Passes",
      },
      // Crossbody (side control) arm bars
      {
        name: "Americana",
        category: "Crossbody (side control) arm bars",
      },
      {
        name: "Kimura",
        note: "Leg over head",
        category: "Crossbody (side control) arm bars",
      },
      {
        name: "180 armbar - South Knee Up",
        note: "Hook the leg",
        category: "Crossbody (side control) arm bars",
      },
      // Crossbody (side control) Paths to Mount
      {
        name: "Walk the elbow - Knee across belly Position 1-3",
        category: "Crossbody (side control) Paths to Mount",
      },
      {
        name: "Position 1-4.5 flow & step over",
        category: "Crossbody (side control) Paths to Mount",
      },
      // Crossbody (side control) Escapes
      {
        name: "Blocking the far hip - Regain Guard",
        note: "Must have under hook",
        category: "Crossbody (side control) Paths to Mount",
      },
      {
        name: "Blocking the near hip - Single Leg to Cross Body",
        note: "Wrestle to the leg",
        category: "Crossbody (side control) Paths to Mount",
      },
      // Mount Arm Bars
      {
        name: "Americana",
        note: "Leg vine",
        category: "Mount Arm Bars",
      },
      {
        name: "'S' Mount armlock",
        category: "Mount Arm Bars",
      },
      // Mount Chokes
      {
        name: "Cross Choke",
        category: "Mount Chokes",
      },
      {
        name: "Ezekiel/sleeve choke",
        note: "Head down",
        category: "Mount Chokes",
      },
      // Mount Maintenance
      {
        name: "Swim",
        note: "Arms wide chest low",
        category: "Mount Maintenance",
      },
      {
        name: "Hook & wing",
        note: "Arms wide chest low",
        category: "Mount Maintenance",
      },
      {
        name: "Peel & Pick",
        note: "Arms wide chest low",
        category: "Mount Maintenance",
      },
      // Mount Escapes
      {
        name: "Shrimp to guard",
        category: "Mount Escapes",
      },
      {
        name: "Standard Bridge & roll to choke defense",
        note: "Bicep Check",
        category: "Mount Escapes",
      },
      {
        name: "Fore arm/throat bridge & roll",
        category: "Mount Escapes",
      },
      {
        name: "Hand under head bridge & roll",
        category: "Mount Escapes",
      },
      {
        name: "Double throat choke burrito grip bridge & roll",
        note: "in motion",
        category: "Mount Escapes",
      },
      // Mount punch defense
      {
        name: "Bridge to hand Post arm over extension push",
        note: "Burrito grip hand",
        category: "Mount punch defense",
      },
      {
        name: "Bridge to Hand Post-Gable Grip Bridge/Roll",
        category: "Mount punch defense",
      },
    ];

    // Insert all techniques
    for (const technique of initialTechniques) {
      await ctx.db.insert("techniques", technique);
    }

    return { message: `Seeded ${initialTechniques.length} techniques` };
  },
});
