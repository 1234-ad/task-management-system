const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Task, User, Document } = require('../models');
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const taskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'completed'])
    .withMessage('Status must be one of: todo, in_progress, review, completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('Assigned to must be a valid user ID'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 999.99 })
    .withMessage('Estimated hours must be between 0 and 999.99'),
  body('actualHours')
    .optional()
    .isFloat({ min: 0, max: 999.99 })
    .withMessage('Actual hours must be between 0 and 999.99'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const listValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'completed'])
    .withMessage('Status must be one of: todo, in_progress, review, completed'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  query('assignedTo')
    .optional()
    .isUUID()
    .withMessage('Assigned to must be a valid user ID'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, dueDate, priority, status, title'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

// Helper function to build where clause for filtering
const buildWhereClause = (query, userId, userRole) => {
  const where = {};

  // Non-admin users can only see their own tasks or tasks assigned to them
  if (userRole !== 'admin') {
    where[Op.or] = [
      { createdBy: userId },
      { assignedTo: userId }
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.assignedTo) {
    where.assignedTo = query.assignedTo;
  }

  if (query.createdBy) {
    where.createdBy = query.createdBy;
  }

  if (query.search) {
    where[Op.or] = [
      ...(where[Op.or] || []),
      { title: { [Op.iLike]: `%${query.search}%` } },
      { description: { [Op.iLike]: `%${query.search}%` } }
    ];
  }

  if (query.dueDateFrom || query.dueDateTo) {
    where.dueDate = {};
    if (query.dueDateFrom) {
      where.dueDate[Op.gte] = new Date(query.dueDateFrom);
    }
    if (query.dueDateTo) {
      where.dueDate[Op.lte] = new Date(query.dueDateTo);
    }
  }

  if (query.overdue === 'true') {
    where.dueDate = {
      [Op.lt]: new Date()
    };
    where.status = {
      [Op.ne]: 'completed'
    };
  }

  return where;
};

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with filtering and pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of tasks per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, review, completed]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, priority, status, title]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/', authenticateToken, listValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    const where = buildWhereClause(req.query, req.user.id, req.user.role);

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'originalName', 'fileSize', 'mimeType'],
          where: { isActive: true },
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       404:
 *         description: Task not found
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'originalName', 'fileName', 'fileSize', 'mimeType', 'uploadedBy', 'createdAt'],
          where: { isActive: true },
          required: false,
          include: [{
            model: User,
            as: 'uploader',
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (req.user.role !== 'admin' && 
        task.createdBy !== req.user.id && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               estimatedHours:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', authenticateToken, taskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Validate assignedTo user exists if provided
    if (taskData.assignedTo) {
      const assignee = await User.findByPk(taskData.assignedTo);
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    const task = await Task.create(taskData);

    // Fetch the created task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('taskCreated', createdTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: createdTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               actualHours:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 */
router.put('/:id', authenticateToken, taskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to update this task
    if (req.user.role !== 'admin' && 
        task.createdBy !== req.user.id && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate assignedTo user exists if provided
    if (req.body.assignedTo && req.body.assignedTo !== task.assignedTo) {
      const assignee = await User.findByPk(req.body.assignedTo);
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    await task.update(req.body);

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('taskUpdated', updatedTask);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to delete this task
    if (req.user.role !== 'admin' && task.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only task creator or admin can delete tasks.'
      });
    }

    await task.destroy();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('taskDeleted', { id: req.params.id });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

module.exports = router;