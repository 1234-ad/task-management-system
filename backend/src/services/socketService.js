const jwt = require('jsonwebtoken');
const { User } = require('../models');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.userId = user.id;
    socket.userRole = user.role;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.email} connected with socket ID: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Join user to admin room if they're an admin
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
    }

    // Handle joining task-specific rooms
    socket.on('joinTask', (taskId) => {
      socket.join(`task_${taskId}`);
      console.log(`User ${socket.user.email} joined task room: task_${taskId}`);
    });

    // Handle leaving task-specific rooms
    socket.on('leaveTask', (taskId) => {
      socket.leave(`task_${taskId}`);
      console.log(`User ${socket.user.email} left task room: task_${taskId}`);
    });

    // Handle task status updates
    socket.on('taskStatusUpdate', (data) => {
      const { taskId, status, userId } = data;
      
      // Broadcast to all users in the task room
      socket.to(`task_${taskId}`).emit('taskStatusChanged', {
        taskId,
        status,
        updatedBy: userId,
        timestamp: new Date()
      });
    });

    // Handle task assignment updates
    socket.on('taskAssignmentUpdate', (data) => {
      const { taskId, assignedTo, assignedBy } = data;
      
      // Notify the assigned user
      if (assignedTo) {
        socket.to(`user_${assignedTo}`).emit('taskAssigned', {
          taskId,
          assignedBy,
          timestamp: new Date()
        });
      }
      
      // Broadcast to task room
      socket.to(`task_${taskId}`).emit('taskAssignmentChanged', {
        taskId,
        assignedTo,
        assignedBy,
        timestamp: new Date()
      });
    });

    // Handle typing indicators for task comments
    socket.on('typing', (data) => {
      const { taskId, isTyping } = data;
      socket.to(`task_${taskId}`).emit('userTyping', {
        userId: socket.userId,
        userName: socket.user.getFullName(),
        taskId,
        isTyping,
        timestamp: new Date()
      });
    });

    // Handle real-time notifications
    socket.on('sendNotification', (data) => {
      const { targetUserId, type, message, taskId } = data;
      
      // Send notification to specific user
      socket.to(`user_${targetUserId}`).emit('notification', {
        type,
        message,
        taskId,
        from: {
          id: socket.userId,
          name: socket.user.getFullName()
        },
        timestamp: new Date()
      });
    });

    // Handle user presence updates
    socket.on('updatePresence', (status) => {
      socket.broadcast.emit('userPresenceUpdate', {
        userId: socket.userId,
        status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.email} disconnected: ${reason}`);
      
      // Broadcast user offline status
      socket.broadcast.emit('userPresenceUpdate', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.email}:`, error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to task management system',
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Helper functions for emitting events from other parts of the application
  io.emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  io.emitToTask = (taskId, event, data) => {
    io.to(`task_${taskId}`).emit(event, data);
  };

  io.emitToAdmins = (event, data) => {
    io.to('admin_room').emit(event, data);
  };

  io.emitTaskUpdate = (task, action) => {
    const eventData = {
      task,
      action,
      timestamp: new Date()
    };

    // Emit to task room
    io.to(`task_${task.id}`).emit('taskUpdate', eventData);

    // Emit to assigned user if exists
    if (task.assignedTo) {
      io.to(`user_${task.assignedTo}`).emit('taskUpdate', eventData);
    }

    // Emit to task creator
    if (task.createdBy) {
      io.to(`user_${task.createdBy}`).emit('taskUpdate', eventData);
    }

    // Emit to admins
    io.to('admin_room').emit('taskUpdate', eventData);
  };

  io.emitDocumentUpdate = (document, taskId, action) => {
    const eventData = {
      document,
      taskId,
      action,
      timestamp: new Date()
    };

    // Emit to task room
    io.to(`task_${taskId}`).emit('documentUpdate', eventData);
  };

  io.emitUserUpdate = (user, action) => {
    const eventData = {
      user,
      action,
      timestamp: new Date()
    };

    // Emit to all admins
    io.to('admin_room').emit('userUpdate', eventData);

    // Emit to the user themselves
    io.to(`user_${user.id}`).emit('userUpdate', eventData);
  };

  return io;
};

module.exports = setupSocketHandlers;