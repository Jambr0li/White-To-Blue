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
        createdAt: technique.createdAt,
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
        createdAt: technique.createdAt,
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
      // Punch Defense techniques
      {
        name: "Parry and Counter",
        category: "Punch Defense",
        videoUrl: "https://www.youtube.com/watch?v=example1",
        createdAt: Date.now(),
      },
      {
        name: "Slip and Counter",
        category: "Punch Defense", 
        videoUrl: "https://www.youtube.com/watch?v=example2",
        createdAt: Date.now(),
      },
      {
        name: "Duck and Counter",
        category: "Punch Defense",
        videoUrl: "https://www.youtube.com/watch?v=example3", 
        createdAt: Date.now(),
      },
      {
        name: "Block and Counter",
        category: "Punch Defense",
        videoUrl: "https://www.youtube.com/watch?v=example4",
        createdAt: Date.now(),
      },
      
      // Cover Crash & Clinch to T-POSITION techniques
      {
        name: "Cover and Crash Entry",
        category: "Cover Crash & Clinch to T-POSITION",
        videoUrl: "https://www.youtube.com/watch?v=example5",
        createdAt: Date.now(),
      },
      {
        name: "Clinch Control",
        category: "Cover Crash & Clinch to T-POSITION",
        videoUrl: "https://www.youtube.com/watch?v=example6",
        createdAt: Date.now(),
      },
      {
        name: "T-Position Setup",
        category: "Cover Crash & Clinch to T-POSITION",
        videoUrl: "https://www.youtube.com/watch?v=example7",
        createdAt: Date.now(),
      },
      {
        name: "T-Position Takedown",
        category: "Cover Crash & Clinch to T-POSITION",
        videoUrl: "https://www.youtube.com/watch?v=example8",
        createdAt: Date.now(),
      },
    ];

    // Insert all techniques
    for (const technique of initialTechniques) {
      await ctx.db.insert("techniques", technique);
    }

    return { message: `Seeded ${initialTechniques.length} techniques` };
  },
});
