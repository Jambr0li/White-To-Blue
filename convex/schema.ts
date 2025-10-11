import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User information synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Predefined techniques (shared across all users)
  techniques: defineTable({
    name: v.string(),
    note: v.optional(v.string()),
    category: v.string(),
    videoUrl: v.optional(v.string()),
  }),

  // User-specific progress tracking
  userProgress: defineTable({
    userId: v.string(), // Clerk user ID
    techniqueId: v.id("techniques"),
    learned: v.boolean(),
    learnedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_technique", ["userId", "techniqueId"]),
});
