module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'review', 'completed'),
      defaultValue: 'todo',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        isAfter: {
          args: new Date().toISOString().split('T')[0],
          msg: 'Due date must be in the future'
        }
      }
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 999.99
      }
    },
    actualHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 999.99
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: true
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    hooks: {
      beforeUpdate: (task) => {
        if (task.changed('status') && task.status === 'completed') {
          task.completedAt = new Date();
        } else if (task.changed('status') && task.status !== 'completed') {
          task.completedAt = null;
        }
      }
    },
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['dueDate']
      },
      {
        fields: ['assignedTo']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance methods
  Task.prototype.isOverdue = function() {
    if (!this.dueDate || this.status === 'completed') {
      return false;
    }
    return new Date() > new Date(this.dueDate);
  };

  Task.prototype.getDaysUntilDue = function() {
    if (!this.dueDate) {
      return null;
    }
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Task.prototype.getProgressPercentage = function() {
    const statusProgress = {
      'todo': 0,
      'in_progress': 25,
      'review': 75,
      'completed': 100
    };
    return statusProgress[this.status] || 0;
  };

  // Class methods
  Task.getTasksByStatus = function(status, options = {}) {
    return this.findAll({
      where: { status },
      ...options
    });
  };

  Task.getOverdueTasks = function(options = {}) {
    return this.findAll({
      where: {
        dueDate: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        status: {
          [sequelize.Sequelize.Op.ne]: 'completed'
        }
      },
      ...options
    });
  };

  Task.getTasksByPriority = function(priority, options = {}) {
    return this.findAll({
      where: { priority },
      ...options
    });
  };

  return Task;
};