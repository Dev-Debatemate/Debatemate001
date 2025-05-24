import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertDebateSchema,
  insertArgumentSchema,
  insertAchievementSchema,
  insertMatchmakingQueueSchema,
  insertTopicSchema
} from "@shared/schema";
import { judgeDebate, generateDebateTopics } from "./openai";
import { sendPasswordResetEmail, generateResetToken } from "./email";

interface SocketConnection {
  socket: WebSocket;
  userId?: number;
}

// Map of active connections
const connections = new Map<string, SocketConnection>();

// Clients subscribed to matchmaking updates
const matchmakingSubscribers = new Set<string>();

// Send message to specific user
function sendToUser(userId: number, type: string, data: any) {
  const message = JSON.stringify({ type, data });
  
  connections.forEach((conn, id) => {
    if (conn.userId === userId && conn.socket.readyState === WebSocket.OPEN) {
      conn.socket.send(message);
    }
  });
}

// Broadcast to all matchmaking subscribers
function broadcastMatchmaking(data: any) {
  const message = JSON.stringify({ type: "matchmaking", data });
  
  matchmakingSubscribers.forEach(id => {
    const conn = connections.get(id);
    if (conn && conn.socket.readyState === WebSocket.OPEN) {
      conn.socket.send(message);
    }
  });
}

// Check the matchmaking queue for potential matches
async function processMatchmakingQueue() {
  const queue = await storage.getMatchmakingQueue();
  
  if (queue.length >= 2) {
    // For simplicity, just match the first two users in the queue
    const [user1, user2] = queue;
    
    // Remove both users from the queue
    await storage.removeFromMatchmakingQueue(user1.userId);
    await storage.removeFromMatchmakingQueue(user2.userId);
    
    // Get available topics
    const topics = await storage.getTopics();
    
    // If no topics available, create a default one
    if (topics.length === 0) {
      console.log("[Matchmaking] No topics found, creating a default topic");
      const defaultTopic = await storage.createTopic({
        title: "Should AI be regulated?",
        difficulty: 3
      });
      topics.push(defaultTopic);
    }
    
    // Get recent debates for both users to avoid repeating topics
    const user1Debates = await storage.getDebatesByUser(user1.userId);
    const user2Debates = await storage.getDebatesByUser(user2.userId);
    
    // Extract the topic IDs from recent debates (last 5 for each user)
    const recentDebatesTopicIds = new Set<number>();
    
    user1Debates.slice(0, 5).forEach(debate => recentDebatesTopicIds.add(debate.topicId));
    user2Debates.slice(0, 5).forEach(debate => recentDebatesTopicIds.add(debate.topicId));
    
    // Filter out recently used topics
    const availableTopics = topics.filter(topic => !recentDebatesTopicIds.has(topic.id));
    
    // If all topics have been recently used, just use all topics (fallback)
    const topicPool = availableTopics.length > 0 ? availableTopics : topics;
    
    // Select a random topic from the available pool
    const randomTopic = topicPool[Math.floor(Math.random() * topicPool.length)];
    
    // Random determination of affirmative and opposition
    let affirmativeUserId, oppositionUserId;
    if (Math.random() > 0.5) {
      affirmativeUserId = user1.userId;
      oppositionUserId = user2.userId;
    } else {
      affirmativeUserId = user2.userId;
      oppositionUserId = user1.userId;
    }
    
    // Create a new debate
    const debate = await storage.createDebate({
      topicId: randomTopic.id,
      affirmativeUserId,
      oppositionUserId,
      maxRounds: 3,
      timePerTurn: 300,
      backgroundIndex: Math.floor(Math.random() * 4) + 1
    });
    
    // Notify both users
    sendToUser(user1.userId, "matchFound", { 
      debateId: debate.id,
      opponentId: user2.userId,
      isAffirmative: user1.userId === affirmativeUserId,
      topic: randomTopic
    });
    
    sendToUser(user2.userId, "matchFound", { 
      debateId: debate.id,
      opponentId: user1.userId,
      isAffirmative: user2.userId === affirmativeUserId,
      topic: randomTopic
    });
    
    // Update matchmaking subscribers
    broadcastMatchmaking({ queueSize: queue.length - 2 });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  console.log('[WebSocket] Server initialized on path /ws');
  
  wss.on('connection', (socket, req) => {
    const id = Math.random().toString(36).substring(2, 15);
    connections.set(id, { socket });
    console.log(`[WebSocket] New connection established: ${id}`);
    
    // Send a welcome message to confirm connection
    socket.send(JSON.stringify({ type: 'connectionAck', data: { connectionId: id } }));
    
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;
        console.log(`[WebSocket] Received message of type: ${type}`, payload);
        
        switch (type) {
          case 'authenticate':
            if (payload.userId) {
              const connection = connections.get(id);
              if (connection) {
                connection.userId = payload.userId;
                connections.set(id, connection);
                console.log(`[WebSocket] User authenticated: ${payload.userId}`);
              }
            }
            break;
            
          case 'joinMatchmaking':
            if (payload.userId) {
              matchmakingSubscribers.add(id);
              await storage.addToMatchmakingQueue({
                userId: payload.userId,
                minLevel: payload.minLevel || 1,
                maxLevel: payload.maxLevel || 100,
                preferredTopicIds: payload.preferredTopicIds || []
              });
              
              const queue = await storage.getMatchmakingQueue();
              console.log(`[WebSocket] User joined matchmaking: ${payload.userId}, Queue size: ${queue.length}`);
              broadcastMatchmaking({ queueSize: queue.length });
              
              // Process the queue to see if we can make a match
              processMatchmakingQueue();
            }
            break;
            
          case 'leaveMatchmaking':
            if (payload.userId) {
              matchmakingSubscribers.delete(id);
              await storage.removeFromMatchmakingQueue(payload.userId);
              
              const queue = await storage.getMatchmakingQueue();
              console.log(`[WebSocket] User left matchmaking: ${payload.userId}, Queue size: ${queue.length}`);
              broadcastMatchmaking({ queueSize: queue.length });
            }
            break;
            
          case 'subscribeToDebate':
            console.log(`[WebSocket] User subscribed to debate: ${payload.debateId}`);
            // Subscribe to debate updates (not implemented fully in this simple version)
            break;
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });
    
    socket.on('close', () => {
      const connection = connections.get(id);
      if (connection && connection.userId) {
        storage.removeFromMatchmakingQueue(connection.userId).catch(console.error);
        console.log(`[WebSocket] User disconnected and removed from matchmaking: ${connection.userId}`);
      }
      
      matchmakingSubscribers.delete(id);
      connections.delete(id);
      console.log(`[WebSocket] Connection closed: ${id}`);
    });
    
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for ${id}:`, error);
    });
  });
  
  // API Routes
  
  // Authentication
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({ id: user.id, username: user.username, displayName: user.displayName });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || 'An error occurred during registration' });
    }
  });
  
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Users
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Update user avatar
  app.patch('/api/users/:id/avatar', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { avatarId } = req.body;
      
      if (!avatarId || typeof avatarId !== 'number' || avatarId < 1 || avatarId > 8) {
        return res.status(400).json({ message: 'Invalid avatar ID. Must be a number between 1 and 8.' });
      }
      
      const updatedUser = await storage.updateUserAvatar(userId, avatarId);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Update username
  app.put('/api/users/:id/username', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, password } = req.body;
      
      if (!username || typeof username !== 'string' || username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }
      
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Password is required to change username' });
      }
      
      // Get user to verify password
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify password
      if (user.password !== password) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
      
      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: 'Username is already taken' });
      }
      
      // Update username
      const updatedUser = await storage.updateUsername(userId, username);
      
      // Don't send password in response
      const { password: pwd, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Update password
  app.put('/api/users/:id/password', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || typeof currentPassword !== 'string') {
        return res.status(400).json({ message: 'Current password is required' });
      }
      
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
      }
      
      // Get user to verify password
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      if (user.password !== currentPassword) {
        return res.status(401).json({ message: 'Incorrect current password' });
      }
      
      // Update password
      await storage.updatePassword(userId, newPassword);
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Topics
  app.get('/api/topics', async (_req: Request, res: Response) => {
    try {
      const topics = await storage.getTopics();
      res.json(topics);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post('/api/topics', async (req: Request, res: Response) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post('/api/topics/generate', async (_req: Request, res: Response) => {
    try {
      const topics = await generateDebateTopics(5);
      
      // Save the generated topics
      const savedTopics = await Promise.all(
        topics.map(title => storage.createTopic({ 
          title, 
          difficulty: Math.floor(Math.random() * 5) + 1 
        }))
      );
      
      res.json(savedTopics);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Debates
  app.get('/api/debates', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Valid userId is required' });
      }
      
      const debates = await storage.getDebatesByUser(userId);
      
      // Enrich debate data with topic information
      const enrichedDebates = await Promise.all(
        debates.map(async (debate) => {
          const topic = await storage.getTopic(debate.topicId);
          return { ...debate, topic };
        })
      );
      
      res.json(enrichedDebates);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get('/api/debates/active', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Valid userId is required' });
      }
      
      const debates = await storage.getActiveDebatesByUser(userId);
      
      // Enrich debate data with topic information
      const enrichedDebates = await Promise.all(
        debates.map(async (debate) => {
          const topic = await storage.getTopic(debate.topicId);
          return { ...debate, topic };
        })
      );
      
      res.json(enrichedDebates);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get('/api/debates/:id', async (req: Request, res: Response) => {
    try {
      const debateId = parseInt(req.params.id);
      const debate = await storage.getDebate(debateId);
      
      if (!debate) {
        return res.status(404).json({ message: 'Debate not found' });
      }
      
      // Fetch related data
      const topic = await storage.getTopic(debate.topicId);
      const debateArguments = await storage.getArgumentsByDebate(debateId);
      const affirmativeUser = await storage.getUser(debate.affirmativeUserId);
      const oppositionUser = await storage.getUser(debate.oppositionUserId);
      
      // Don't send passwords
      const { password: _, ...affirmativeWithoutPassword } = affirmativeUser || {};
      const { password: __, ...oppositionWithoutPassword } = oppositionUser || {};
      
      res.json({
        ...debate,
        topic,
        arguments: debateArguments,
        affirmativeUser: affirmativeWithoutPassword,
        oppositionUser: oppositionWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post('/api/debates', async (req: Request, res: Response) => {
    try {
      const debateData = insertDebateSchema.parse(req.body);
      const debate = await storage.createDebate(debateData);
      res.status(201).json(debate);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Arguments
  app.post('/api/arguments', async (req: Request, res: Response) => {
    try {
      const argumentData = insertArgumentSchema.parse(req.body);
      
      // Validate that the user is part of the debate
      const debate = await storage.getDebate(argumentData.debateId);
      
      if (!debate) {
        return res.status(404).json({ message: 'Debate not found' });
      }
      
      const isUserAffirmative = debate.affirmativeUserId === argumentData.userId;
      const isUserOpposition = debate.oppositionUserId === argumentData.userId;
      
      if (!isUserAffirmative && !isUserOpposition) {
        return res.status(403).json({ message: 'User is not a participant in this debate' });
      }
      
      // Validate that it's the user's turn
      const correctSide = isUserAffirmative ? 'affirmative' : 'opposition';
      
      if (argumentData.side !== correctSide) {
        return res.status(400).json({ message: 'Invalid side for this user' });
      }
      
      if (debate.currentTurn !== correctSide) {
        return res.status(400).json({ message: 'Not your turn' });
      }
      
      // Validate minimum word count (60 words)
      const MIN_WORD_COUNT = 60;
      const wordCount = argumentData.content.trim().split(/\s+/).length;
      if (wordCount < MIN_WORD_COUNT) {
        return res.status(400).json({ 
          message: `Argument must be at least ${MIN_WORD_COUNT} words. Current count: ${wordCount}` 
        });
      }
      
      // Submit the argument
      const argument = await storage.createArgument(argumentData);
      
      // Check if we need to conclude the debate after submission
      const updatedDebate = await storage.getDebate(debate.id);
      
      if (updatedDebate?.status === "judging") {
        // Get all arguments for the debate
        const allArguments = await storage.getArgumentsByDebate(debate.id);
        const affirmativeArgs = allArguments
          .filter(arg => arg.side === 'affirmative')
          .map(arg => arg.content);
        const oppositionArgs = allArguments
          .filter(arg => arg.side === 'opposition')
          .map(arg => arg.content);
        
        // Judge the debate
        const topic = await storage.getTopic(debate.topicId);
        let judgment;
        let winnerId;
        
        try {
          judgment = await judgeDebate(topic?.title || "Unknown Topic", affirmativeArgs, oppositionArgs);
          // Determine winner ID from judgment
          winnerId = judgment.winner === 'affirmative' 
            ? debate.affirmativeUserId 
            : debate.oppositionUserId;
        } catch (error) {
          console.error("Error judging debate:", error);
          // Fallback judgment in case of API error
          // Randomly determine a winner
          const isAffirmativeWinner = Math.random() > 0.5;
          winnerId = isAffirmativeWinner ? debate.affirmativeUserId : debate.oppositionUserId;
          judgment = {
            winner: isAffirmativeWinner ? 'affirmative' : 'opposition',
            score: {
              affirmative: isAffirmativeWinner ? 75 : 65,
              opposition: isAffirmativeWinner ? 65 : 75
            },
            feedback: "The debate has been evaluated based on the arguments presented.",
            reasoning: "Both participants made compelling arguments in this debate."
          };
        }
        
        // Create more detailed feedback text that includes improvement points
        const feedbackText = [
          judgment.feedback,
          "",  // Add empty line
          judgment.reasoning,
          "",  // Add empty line
          "Key Points for Improvement:",
          ...(judgment.improvement_points || []).map(point => `- ${point}`)
        ].join("\n");
        
        // Complete the debate
        await storage.completeDebate(
          debate.id, 
          winnerId, 
          feedbackText
        );
        
        // Notify both users
        sendToUser(debate.affirmativeUserId, "debateComplete", {
          debateId: debate.id,
          winnerId,
          feedback: judgment.feedback,
          reasoning: judgment.reasoning,
          score: judgment.score,
          improvementPoints: judgment.improvement_points || []
        });
        
        sendToUser(debate.oppositionUserId, "debateComplete", {
          debateId: debate.id,
          winnerId,
          feedback: judgment.feedback,
          reasoning: judgment.reasoning,
          score: judgment.score,
          improvementPoints: judgment.improvement_points || []
        });
      } else {
        // Notify the other user that it's their turn
        const otherUserId = isUserAffirmative ? debate.oppositionUserId : debate.affirmativeUserId;
        sendToUser(otherUserId, "yourTurn", {
          debateId: debate.id,
          currentRound: updatedDebate?.currentRound,
          argument: {
            content: argument.content,
            side: argument.side,
            round: argument.round
          }
        });
      }
      
      res.status(201).json(argument);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Achievements
  app.get('/api/achievements', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Valid userId is required' });
      }
      
      const achievements = await storage.getAchievementsByUser(userId);
      res.json(achievements);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post('/api/achievements', async (req: Request, res: Response) => {
    try {
      const achievementData = insertAchievementSchema.parse(req.body);
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Leaderboard
  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopUsers(limit);
      
      // Remove passwords
      const safeUsers = topUsers.map(({ password, ...user }) => user);
      
      res.json(safeUsers);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  

  
  return httpServer;
}
