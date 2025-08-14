const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Task = require('./Task')(sequelize, Sequelize.DataTypes);
const Document = require('./Document')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Task, { 
  foreignKey: 'assignedTo', 
  as: 'assignedTasks',
  onDelete: 'SET NULL'
});

User.hasMany(Task, { 
  foreignKey: 'createdBy', 
  as: 'createdTasks',
  onDelete: 'CASCADE'
});

Task.belongsTo(User, { 
  foreignKey: 'assignedTo', 
  as: 'assignee',
  allowNull: true
});

Task.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator',
  allowNull: false
});

Task.hasMany(Document, { 
  foreignKey: 'taskId', 
  as: 'documents',
  onDelete: 'CASCADE'
});

Document.belongsTo(Task, { 
  foreignKey: 'taskId', 
  as: 'task',
  allowNull: false
});

Document.belongsTo(User, { 
  foreignKey: 'uploadedBy', 
  as: 'uploader',
  allowNull: false
});

User.hasMany(Document, { 
  foreignKey: 'uploadedBy', 
  as: 'uploadedDocuments',
  onDelete: 'CASCADE'
});

const db = {
  sequelize,
  Sequelize,
  User,
  Task,
  Document
};

module.exports = db;