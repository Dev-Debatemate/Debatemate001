import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  level: integer("level").notNull().default(1),
  points: integer("points").notNull().default(0),
  debates: integer("debates").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  avatarId: integer("avatar_id").notNull().default(1),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
});

// Password reset tokens
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

// Topics
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  difficulty: integer("difficulty").notNull().default(1) // 1-5 stars
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  title: true,
  difficulty: true,
});

// Debates
export const debates = pgTable("debates", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  affirmativeUserId: integer("affirmative_user_id").notNull(),
  oppositionUserId: integer("opposition_user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed
  currentTurn: text("current_turn").notNull().default("affirmative"), // affirmative, opposition
  currentRound: integer("current_round").notNull().default(1),
  maxRounds: integer("max_rounds").notNull().default(3),
  timePerTurn: integer("time_per_turn").notNull().default(300), // in seconds
  winnerId: integer("winner_id"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  judgingFeedback: text("judging_feedback"),
  backgroundIndex: integer("background_index").notNull().default(1) // 1-4 for different backgrounds
});

export const insertDebateSchema = createInsertSchema(debates).pick({
  topicId: true,
  affirmativeUserId: true,
  oppositionUserId: true,
  maxRounds: true,
  timePerTurn: true,
  backgroundIndex: true,
});

// Arguments
export const debateArguments = pgTable("arguments", {
  id: serial("id").primaryKey(),
  debateId: integer("debate_id").notNull(),
  userId: integer("user_id").notNull(),
  round: integer("round").notNull(),
  side: text("side").notNull(), // affirmative, opposition
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").notNull()
});

export const insertArgumentSchema = createInsertSchema(debateArguments).pick({
  debateId: true,
  userId: true,
  round: true,
  side: true,
  content: true,
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  earnedAt: timestamp("earned_at").notNull()
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  type: true,
  title: true,
  description: true,
});

// Matchmaking queue
export const matchmakingQueue = pgTable("matchmaking_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  joinedAt: timestamp("joined_at").notNull(),
  minLevel: integer("min_level").notNull().default(1),
  maxLevel: integer("max_level").notNull().default(100),
  preferredTopicIds: jsonb("preferred_topic_ids").notNull().default([])
});

export const insertMatchmakingQueueSchema = createInsertSchema(matchmakingQueue).pick({
  userId: true,
  minLevel: true,
  maxLevel: true,
  preferredTopicIds: true,
});

// Types for inferred schema selections
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Debate = typeof debates.$inferSelect;
export type InsertDebate = z.infer<typeof insertDebateSchema>;

export type Argument = typeof debateArguments.$inferSelect;
export type InsertArgument = z.infer<typeof insertArgumentSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type MatchmakingQueueEntry = typeof matchmakingQueue.$inferSelect;
export type InsertMatchmakingQueueEntry = z.infer<typeof insertMatchmakingQueueSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  debates: many(debates),
  arguments: many(debateArguments),
  achievements: many(achievements),
  matchmakingEntries: many(matchmakingQueue),
  passwordResets: many(passwordResets)
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id]
  })
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  debates: many(debates)
}));

export const debatesRelations = relations(debates, ({ one, many }) => ({
  topic: one(topics, {
    fields: [debates.topicId],
    references: [topics.id]
  }),
  affirmativeUser: one(users, {
    fields: [debates.affirmativeUserId],
    references: [users.id]
  }),
  oppositionUser: one(users, {
    fields: [debates.oppositionUserId],
    references: [users.id]
  }),
  winner: one(users, {
    fields: [debates.winnerId],
    references: [users.id]
  }),
  arguments: many(debateArguments)
}));

export const debateArgumentsRelations = relations(debateArguments, ({ one }) => ({
  debate: one(debates, {
    fields: [debateArguments.debateId],
    references: [debates.id]
  }),
  user: one(users, {
    fields: [debateArguments.userId],
    references: [users.id]
  })
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id]
  })
}));

export const matchmakingQueueRelations = relations(matchmakingQueue, ({ one }) => ({
  user: one(users, {
    fields: [matchmakingQueue.userId],
    references: [users.id]
  })
}));
