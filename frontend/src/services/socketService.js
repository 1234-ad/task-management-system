import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      // Initialize socket connection
      this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('user:online', { userId: this.getCurrentUserId() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    // Task-related events
    this.socket.on('task:created', (data) => {
      this.notifyListeners('task:created', data);
    });

    this.socket.on('task:updated', (data) => {
      this.notifyListeners('task:updated', data);
    });

    this.socket.on('task:deleted', (data) => {
      this.notifyListeners('task:deleted', data);
    });

    this.socket.on('task:assigned', (data) => {
      this.notifyListeners('task:assigned', data);
    });

    // User-related events
    this.socket.on('user:online', (data) => {
      this.notifyListeners('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      this.notifyListeners('user:offline', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.notifyListeners('notification:new', data);
      this.showNotification(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('Socket disconnected manually');
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket event listener:', error);
        }
      });
    }
  }

  // Task-specific methods
  joinTaskRoom(taskId) {
    this.emit('task:join', { taskId });
  }

  leaveTaskRoom(taskId) {
    this.emit('task:leave', { taskId });
  }

  updateTaskStatus(taskId, status) {
    this.emit('task:status:update', { taskId, status });
  }

  // User-specific methods
  joinUserRoom(userId) {
    this.emit('user:join', { userId });
  }

  leaveUserRoom(userId) {
    this.emit('user:leave', { userId });
  }

  // Notification methods
  showNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || 'Task Management System', {
        body: data.message,
        icon: '/favicon.ico',
        tag: data.id || 'task-notification'
      });
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  // Utility methods
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.id || null;
    } catch (error) {
      return null;
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  // Real-time collaboration methods
  startTyping(taskId, userId) {
    this.emit('task:typing:start', { taskId, userId });
  }

  stopTyping(taskId, userId) {
    this.emit('task:typing:stop', { taskId, userId });
  }

  sendComment(taskId, comment) {
    this.emit('task:comment:new', { taskId, comment });
  }

  // Presence methods
  updatePresence(status) {
    this.emit('user:presence:update', { 
      userId: this.getCurrentUserId(), 
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Heartbeat to maintain connection
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isSocketConnected()) {
        this.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create and export a singleton instance
const socketService = new SocketService();

export default socketService;