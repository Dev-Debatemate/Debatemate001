import { 
  User, InsertUser, 
  Topic, InsertTopic,
  Debate, InsertDebate,
  Argument, InsertArgument,
  Achievement, InsertAchievement,
  MatchmakingQueueEntry, InsertMatchmakingQueueEntry,
  users, topics, debates, debateArguments, achievements, matchmakingQueue
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, ne, desc, sql } from "drizzle-orm";

// Storage interface with all CRUD methods needed
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: number, wins?: number, losses?: number, points?: number): Promise<User>;
  updateUserAvatar(userId: number, avatarId: number): Promise<User>;
  updateUsername(userId: number, username: string): Promise<User>;
  updatePassword(userId: number, password: string): Promise<User>;
  
  // Topic operations
  getTopic(id: number): Promise<Topic | undefined>;
  getTopics(limit?: number): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Debate operations
  getDebate(id: number): Promise<Debate | undefined>;
  getDebatesByUser(userId: number): Promise<Debate[]>;
  getActiveDebatesByUser(userId: number): Promise<Debate[]>;
  createDebate(debate: InsertDebate): Promise<Debate>;
  updateDebateStatus(id: number, status: string, currentTurn?: string, currentRound?: number): Promise<Debate>;
  completeDebate(id: number, winnerId: number, judgingFeedback: string): Promise<Debate>;
  
  // Argument operations
  getArgumentsByDebate(debateId: number): Promise<Argument[]>;
  createArgument(argument: InsertArgument): Promise<Argument>;
  
  // Achievement operations
  getAchievementsByUser(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Matchmaking operations
  addToMatchmakingQueue(entry: InsertMatchmakingQueueEntry): Promise<MatchmakingQueueEntry>;
  removeFromMatchmakingQueue(userId: number): Promise<void>;
  getMatchmakingQueue(): Promise<MatchmakingQueueEntry[]>;
  
  // Leaderboard
  getTopUsers(limit: number): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private topics: Map<number, Topic>;
  private debates: Map<number, Debate>;
  private arguments: Map<number, Argument>;
  private achievements: Map<number, Achievement>;
  private matchmakingQueue: Map<number, MatchmakingQueueEntry>;
  
  private nextUserId: number;
  private nextTopicId: number;
  private nextDebateId: number;
  private nextArgumentId: number;
  private nextAchievementId: number;
  private nextQueueId: number;
  
  constructor() {
    this.users = new Map();
    this.topics = new Map();
    this.debates = new Map();
    this.arguments = new Map();
    this.achievements = new Map();
    this.matchmakingQueue = new Map();
    
    this.nextUserId = 1;
    this.nextTopicId = 1;
    this.nextDebateId = 1;
    this.nextArgumentId = 1;
    this.nextAchievementId = 1;
    this.nextQueueId = 1;
    
    // Add some default topics
    this.seedTopics();
  }
  
  private seedTopics() {
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
    
    defaultTopics.forEach(topic => {
      this.createTopic(topic);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      level: 1, 
      points: 0, 
      debates: 0, 
      wins: 0, 
      losses: 0,
      avatarId: Math.floor(Math.random() * 8) + 1  // Random avatar 1-8
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserStats(userId: number, wins: number = 0, losses: number = 0, points: number = 0): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      wins: user.wins + wins,
      losses: user.losses + losses,
      points: user.points + points,
      debates: user.debates + (wins + losses > 0 ? 1 : 0)
    };
    
    // Simple level calculation based on points
    updatedUser.level = Math.max(1, Math.floor(updatedUser.points / 100) + 1);
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserAvatar(userId: number, avatarId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Update only the avatarId field
    const updatedUser: User = {
      ...user,
      avatarId: avatarId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUsername(userId: number, username: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Update only the username field
    const updatedUser: User = {
      ...user,
      username: username
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updatePassword(userId: number, password: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Update only the password field
    const updatedUser: User = {
      ...user,
      password: password
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Topic operations
  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }
  
  async getTopics(limit?: number): Promise<Topic[]> {
    const allTopics = Array.from(this.topics.values());
    return limit ? allTopics.slice(0, limit) : allTopics;
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.nextTopicId++;
    const topic: Topic = { ...insertTopic, id };
    this.topics.set(id, topic);
    return topic;
  }
  
  // Debate operations
  async getDebate(id: number): Promise<Debate | undefined> {
    return this.debates.get(id);
  }
  
  async getDebatesByUser(userId: number): Promise<Debate[]> {
    return Array.from(this.debates.values()).filter(
      debate => debate.affirmativeUserId === userId || debate.oppositionUserId === userId
    );
  }
  
  async getActiveDebatesByUser(userId: number): Promise<Debate[]> {
    return Array.from(this.debates.values()).filter(
      debate => 
        (debate.affirmativeUserId === userId || debate.oppositionUserId === userId) && 
        debate.status !== 'completed'
    );
  }
  
  async createDebate(insertDebate: InsertDebate): Promise<Debate> {
    const id = this.nextDebateId++;
    const now = new Date();
    
    const debate: Debate = {
      ...insertDebate,
      id,
      status: "active",
      currentTurn: "affirmative",
      currentRound: 1,
      startTime: now,
      endTime: undefined,
      winnerId: undefined,
      judgingFeedback: undefined,
    };
    
    this.debates.set(id, debate);
    return debate;
  }
  
  async updateDebateStatus(id: number, status: string, currentTurn?: string, currentRound?: number): Promise<Debate> {
    const debate = await this.getDebate(id);
    if (!debate) throw new Error("Debate not found");
    
    const updatedDebate: Debate = {
      ...debate,
      status,
      currentTurn: currentTurn || debate.currentTurn,
      currentRound: currentRound || debate.currentRound
    };
    
    this.debates.set(id, updatedDebate);
    return updatedDebate;
  }
  
  async completeDebate(id: number, winnerId: number, judgingFeedback: string): Promise<Debate> {
    const debate = await this.getDebate(id);
    if (!debate) throw new Error("Debate not found");
    
    const now = new Date();
    const updatedDebate: Debate = {
      ...debate,
      status: "completed",
      endTime: now,
      winnerId,
      judgingFeedback
    };
    
    this.debates.set(id, updatedDebate);
    
    // Update user stats
    if (debate.affirmativeUserId === winnerId) {
      await this.updateUserStats(debate.affirmativeUserId, 1, 0, 20);
      await this.updateUserStats(debate.oppositionUserId, 0, 1, 5);
    } else {
      await this.updateUserStats(debate.oppositionUserId, 1, 0, 20);
      await this.updateUserStats(debate.affirmativeUserId, 0, 1, 5);
    }
    
    return updatedDebate;
  }
  
  // Argument operations
  async getArgumentsByDebate(debateId: number): Promise<Argument[]> {
    return Array.from(this.arguments.values())
      .filter(arg => arg.debateId === debateId)
      .sort((a, b) => {
        // Sort by round first, then by side (affirmative first)
        if (a.round !== b.round) return a.round - b.round;
        return a.side === 'affirmative' ? -1 : 1;
      });
  }
  
  async createArgument(insertArgument: InsertArgument): Promise<Argument> {
    const id = this.nextArgumentId++;
    const now = new Date();
    
    const argument: Argument = {
      ...insertArgument,
      id,
      submittedAt: now
    };
    
    this.arguments.set(id, argument);
    
    // Update debate turn
    const debate = await this.getDebate(argument.debateId);
    if (debate) {
      // Toggle between affirmative and opposition
      const nextTurn = argument.side === 'affirmative' ? 'opposition' : 'affirmative';
      
      // Check if we need to advance to the next round
      let nextRound = debate.currentRound;
      if (nextTurn === 'affirmative' && argument.side === 'opposition') {
        nextRound += 1;
      }
      
      // Check if debate is complete
      if (nextRound > debate.maxRounds) {
        await this.updateDebateStatus(debate.id, "judging");
      } else {
        await this.updateDebateStatus(debate.id, "active", nextTurn, nextRound);
      }
    }
    
    return argument;
  }
  
  // Achievement operations
  async getAchievementsByUser(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }
  
  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.nextAchievementId++;
    const now = new Date();
    
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      earnedAt: now
    };
    
    this.achievements.set(id, achievement);
    return achievement;
  }
  
  // Matchmaking operations
  async addToMatchmakingQueue(insertEntry: InsertMatchmakingQueueEntry): Promise<MatchmakingQueueEntry> {
    // Remove user from queue if they're already in it
    await this.removeFromMatchmakingQueue(insertEntry.userId);
    
    const id = this.nextQueueId++;
    const now = new Date();
    
    const entry: MatchmakingQueueEntry = {
      ...insertEntry,
      id,
      joinedAt: now
    };
    
    this.matchmakingQueue.set(entry.userId, entry);
    return entry;
  }
  
  async removeFromMatchmakingQueue(userId: number): Promise<void> {
    this.matchmakingQueue.delete(userId);
  }
  
  async getMatchmakingQueue(): Promise<MatchmakingQueueEntry[]> {
    return Array.from(this.matchmakingQueue.values())
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }
  
  // Leaderboard
  async getTopUsers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        level: 1,
        points: 0,
        debates: 0,
        wins: 0,
        losses: 0,
        avatarId: Math.floor(Math.random() * 8) + 1 // Random avatar 1-8
      })
      .returning();
    return user;
  }

  async updateUserStats(userId: number, wins: number = 0, losses: number = 0, points: number = 0): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    const debates = user.debates + (wins + losses > 0 ? 1 : 0);
    const newPoints = user.points + points;
    const level = Math.max(1, Math.floor(newPoints / 100) + 1);

    const [updatedUser] = await db
      .update(users)
      .set({
        wins: user.wins + wins,
        losses: user.losses + losses,
        points: newPoints,
        debates,
        level
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async updateUserAvatar(userId: number, avatarId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ avatarId })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }
  
  async updateUsername(userId: number, username: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }
  
  async updatePassword(userId: number, password: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic || undefined;
  }

  async getTopics(limit?: number): Promise<Topic[]> {
    const query = db.select().from(topics);
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db
      .insert(topics)
      .values(insertTopic)
      .returning();
    return topic;
  }

  async getDebate(id: number): Promise<Debate | undefined> {
    const [debate] = await db
      .select()
      .from(debates)
      .where(eq(debates.id, id));
    
    return debate || undefined;
  }

  async getDebatesByUser(userId: number): Promise<Debate[]> {
    return await db
      .select()
      .from(debates)
      .where(
        or(
          eq(debates.affirmativeUserId, userId),
          eq(debates.oppositionUserId, userId)
        )
      );
  }

  async getActiveDebatesByUser(userId: number): Promise<Debate[]> {
    return await db
      .select()
      .from(debates)
      .where(
        and(
          or(
            eq(debates.affirmativeUserId, userId),
            eq(debates.oppositionUserId, userId)
          ),
          ne(debates.status, 'completed')
        )
      );
  }

  async createDebate(insertDebate: InsertDebate): Promise<Debate> {
    const now = new Date();
    
    const [debate] = await db
      .insert(debates)
      .values({
        ...insertDebate,
        status: "active",
        currentTurn: "affirmative",
        currentRound: 1,
        startTime: now
      })
      .returning();
    
    return debate;
  }

  async updateDebateStatus(id: number, status: string, currentTurn?: string, currentRound?: number): Promise<Debate> {
    const [debate] = await db.select().from(debates).where(eq(debates.id, id));
    if (!debate) throw new Error("Debate not found");
    
    const [updatedDebate] = await db
      .update(debates)
      .set({
        status,
        currentTurn: currentTurn || debate.currentTurn,
        currentRound: currentRound || debate.currentRound
      })
      .where(eq(debates.id, id))
      .returning();
    
    return updatedDebate;
  }

  async completeDebate(id: number, winnerId: number, judgingFeedback: string): Promise<Debate> {
    const [debate] = await db.select().from(debates).where(eq(debates.id, id));
    if (!debate) throw new Error("Debate not found");
    
    const now = new Date();
    const [updatedDebate] = await db
      .update(debates)
      .set({
        status: "completed",
        endTime: now,
        winnerId,
        judgingFeedback
      })
      .where(eq(debates.id, id))
      .returning();
    
    // Update user stats
    if (debate.affirmativeUserId === winnerId) {
      await this.updateUserStats(debate.affirmativeUserId, 1, 0, 20);
      await this.updateUserStats(debate.oppositionUserId, 0, 1, 5);
    } else {
      await this.updateUserStats(debate.oppositionUserId, 1, 0, 20);
      await this.updateUserStats(debate.affirmativeUserId, 0, 1, 5);
    }
    
    return updatedDebate;
  }

  async getArgumentsByDebate(debateId: number): Promise<Argument[]> {
    return await db
      .select()
      .from(debateArguments)
      .where(eq(debateArguments.debateId, debateId))
      .orderBy(
        debateArguments.round,
        sql`CASE WHEN ${debateArguments.side} = 'affirmative' THEN 0 ELSE 1 END`
      );
  }

  async createArgument(insertArgument: InsertArgument): Promise<Argument> {
    const now = new Date();
    
    const [argument] = await db
      .insert(debateArguments)
      .values({
        ...insertArgument,
        submittedAt: now
      })
      .returning();
    
    // Update debate turn
    const [debate] = await db.select().from(debates).where(eq(debates.id, argument.debateId));
    if (debate) {
      // Toggle between affirmative and opposition
      const nextTurn = argument.side === 'affirmative' ? 'opposition' : 'affirmative';
      
      // Check if we need to advance to the next round
      let nextRound = debate.currentRound;
      if (nextTurn === 'affirmative' && argument.side === 'opposition') {
        nextRound += 1;
      }
      
      // Check if debate is complete
      if (nextRound > debate.maxRounds) {
        await this.updateDebateStatus(debate.id, "judging");
      } else {
        await this.updateDebateStatus(debate.id, "active", nextTurn, nextRound);
      }
    }
    
    return argument;
  }

  async getAchievementsByUser(userId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const now = new Date();
    
    const [achievement] = await db
      .insert(achievements)
      .values({
        ...insertAchievement,
        earnedAt: now
      })
      .returning();
    
    return achievement;
  }

  async addToMatchmakingQueue(insertEntry: InsertMatchmakingQueueEntry): Promise<MatchmakingQueueEntry> {
    // Remove user from queue if they're already in it
    await this.removeFromMatchmakingQueue(insertEntry.userId);
    
    const now = new Date();
    
    const [entry] = await db
      .insert(matchmakingQueue)
      .values({
        ...insertEntry,
        joinedAt: now
      })
      .returning();
    
    return entry;
  }

  async removeFromMatchmakingQueue(userId: number): Promise<void> {
    await db
      .delete(matchmakingQueue)
      .where(eq(matchmakingQueue.userId, userId));
  }

  async getMatchmakingQueue(): Promise<MatchmakingQueueEntry[]> {
    return await db
      .select()
      .from(matchmakingQueue)
      .orderBy(matchmakingQueue.joinedAt);
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit);
  }
}

// Use database storage instead of in-memory storage
export const storage = new DatabaseStorage();
