type MessageHandler = (data: any) => void;
type MessageTypes = 'matchmaking' | 'matchFound' | 'yourTurn' | 'debateComplete';

class SocketClient {
  private socket: WebSocket | null = null;
  private connected = false;
  private messageHandlers: Map<MessageTypes, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private userId: number | null = null;
  
  connect() {
    // If already connected or connecting, no need to reconnect
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket already connected or connecting");
      return;
    }
    
    // Close any existing socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Create WebSocket URL with the correct protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    // Create new WebSocket connection
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      this.connected = true;
      console.log("WebSocket connected successfully");
      
      // If userId exists, authenticate
      if (this.userId) {
        console.log(`Authenticating user: ${this.userId}`);
        this.authenticate(this.userId);
      }
      
      // Clear any reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;
        
        console.log(`WebSocket message received: ${type}`, data);
        
        // Handle connection acknowledgment separately
        if (type === 'connectionAck') {
          console.log("WebSocket connection acknowledged by server", data);
          return;
        }
        
        const handlers = this.messageHandlers.get(type as MessageTypes);
        if (handlers && handlers.size > 0) {
          console.log(`Executing ${handlers.size} handlers for message type: ${type}`);
          handlers.forEach(handler => handler(data));
        } else {
          console.log(`No handlers registered for message type: ${type}`);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    this.socket.onclose = (event) => {
      this.connected = false;
      this.socket = null;
      console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason || "No reason provided"}. Reconnecting in 3 seconds...`);
      
      // Attempt to reconnect after a delay
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
    
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.log("Closing socket due to error");
      this.socket?.close();
    };
  }
  
  disconnect() {
    if (this.socket && this.connected) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  authenticate(userId: number) {
    this.userId = userId;
    
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({
        type: 'authenticate',
        payload: { userId }
      }));
    }
  }
  
  joinMatchmaking(userId: number, options: { minLevel?: number, maxLevel?: number, preferredTopicIds?: number[] } = {}) {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({
        type: 'joinMatchmaking',
        payload: {
          userId,
          ...options
        }
      }));
    }
  }
  
  leaveMatchmaking(userId: number) {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({
        type: 'leaveMatchmaking',
        payload: { userId }
      }));
    }
  }
  
  subscribeToDebate(debateId: number) {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({
        type: 'subscribeToDebate',
        payload: { debateId }
      }));
    }
  }
  
  on(type: MessageTypes, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
  }
  
  off(type: MessageTypes, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

export const socketClient = new SocketClient();
export default socketClient;
