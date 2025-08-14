const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { Document, Task, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 3 // Maximum 3 files per request
  }
});

/**
 * @swagger
 * /api/documents/upload/{taskId}:
 *   post:
 *     summary: Upload documents to a task
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID to upload documents to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 3
 *                 description: PDF documents to upload (max 3 files, 5MB each)
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 *       400:
 *         description: Invalid file or task not found
 *       403:
 *         description: Access denied
 */
router.post('/upload/:taskId', authenticateToken, upload.array('documents', 3), async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists and user has access
    const task = await Task.findByPk(taskId);
    if (!task) {
      // Clean up uploaded files if task doesn't exist
      if (req.files) {
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      }
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (req.user.role !== 'admin' && 
        task.createdBy !== req.user.id && 
        task.assignedTo !== req.user.id) {
      // Clean up uploaded files
      if (req.files) {
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      }
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Check current document count for this task
    const currentDocCount = await Document.getDocumentCount(taskId);
    const newDocCount = currentDocCount + req.files.length;

    if (newDocCount > 3) {
      // Clean up uploaded files
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${req.files.length} files. Task can have maximum 3 documents. Current count: ${currentDocCount}`
      });
    }

    // Create document records
    const documentPromises = req.files.map(file => {
      return Document.create({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        taskId,
        uploadedBy: req.user.id
      });
    });

    const documents = await Promise.all(documentPromises);

    // Fetch documents with uploader info
    const documentsWithUploader = await Document.findAll({
      where: { 
        id: documents.map(doc => doc.id) 
      },
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('documentsUploaded', {
      taskId,
      documents: documentsWithUploader
    });

    res.status(201).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      data: {
        documents: documentsWithUploader
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB per file.'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 3 files allowed per upload.'
      });
    }

    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/documents/{documentId}:
 *   get:
 *     summary: Download a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID to download
 *     responses:
 *       200:
 *         description: Document downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.get('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findByPk(documentId, {
      include: [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'createdBy', 'assignedTo']
      }]
    });

    if (!document || !document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document's task
    const task = document.task;
    if (req.user.role !== 'admin' && 
        task.createdBy !== req.user.id && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await document.incrementDownloadCount();

    // Set headers for file download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.fileSize);

    // Stream the file
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/documents/{documentId}/view:
 *   get:
 *     summary: View document inline (without download)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID to view
 *     responses:
 *       200:
 *         description: Document viewed successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.get('/:documentId/view', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findByPk(documentId, {
      include: [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'createdBy', 'assignedTo']
      }]
    });

    if (!document || !document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document's task
    const task = document.task;
    if (req.user.role !== 'admin' && 
        task.createdBy !== req.user.id && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers for inline viewing
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.fileSize);

    // Stream the file
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to view document',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/documents/{documentId}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID to delete
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findByPk(documentId, {
      include: [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'createdBy', 'assignedTo']
      }]
    });

    if (!document || !document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to delete this document
    const task = document.task;
    if (req.user.role !== 'admin' && 
        task.createdBy !== req.user.id && 
        document.uploadedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only document uploader, task creator, or admin can delete documents.'
      });
    }

    // Mark document as inactive instead of deleting
    await document.update({ isActive: false });

    // Optionally delete the physical file (uncomment if you want to delete files immediately)
    // try {
    //   await fs.unlink(document.filePath);
    // } catch (error) {
    //   console.error('Failed to delete physical file:', error);
    // }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('documentDeleted', {
      taskId: task.id,
      documentId
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/documents/task/{taskId}:
 *   get:
 *     summary: Get all documents for a task
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID to get documents for
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       404:
 *         description: Task not found
 *       403:
 *         description: Access denied
 */
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists and user has access
    const task = await Task.findByPk(taskId);
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

    const documents = await Document.findAll({
      where: { 
        taskId,
        isActive: true
      },
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        documents,
        count: documents.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message
    });
  }
});

module.exports = router;