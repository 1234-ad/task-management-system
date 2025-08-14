const path = require('path');

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255],
        notEmpty: true
      }
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 255],
        notEmpty: true
      }
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 500],
        notEmpty: true
      }
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5242880 // 5MB in bytes
      }
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['application/pdf']]
      }
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'documents',
    timestamps: true,
    indexes: [
      {
        fields: ['taskId']
      },
      {
        fields: ['uploadedBy']
      },
      {
        fields: ['fileName']
      },
      {
        fields: ['mimeType']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Instance methods
  Document.prototype.getFileExtension = function() {
    return path.extname(this.originalName).toLowerCase();
  };

  Document.prototype.getFileSizeInMB = function() {
    return (this.fileSize / (1024 * 1024)).toFixed(2);
  };

  Document.prototype.incrementDownloadCount = async function() {
    this.downloadCount += 1;
    await this.save();
    return this.downloadCount;
  };

  Document.prototype.isValidPDF = function() {
    return this.mimeType === 'application/pdf' && 
           this.getFileExtension() === '.pdf';
  };

  // Class methods
  Document.getDocumentsByTask = function(taskId, options = {}) {
    return this.findAll({
      where: { 
        taskId,
        isActive: true
      },
      ...options
    });
  };

  Document.getDocumentsByUser = function(uploadedBy, options = {}) {
    return this.findAll({
      where: { 
        uploadedBy,
        isActive: true
      },
      ...options
    });
  };

  Document.getTotalFileSize = async function(taskId) {
    const result = await this.findOne({
      where: { 
        taskId,
        isActive: true
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('fileSize')), 'totalSize']
      ]
    });
    return result ? parseInt(result.dataValues.totalSize) || 0 : 0;
  };

  Document.getDocumentCount = async function(taskId) {
    return this.count({
      where: { 
        taskId,
        isActive: true
      }
    });
  };

  // Validation method for max documents per task
  Document.validateMaxDocuments = async function(taskId, maxCount = 3) {
    const count = await this.getDocumentCount(taskId);
    return count < maxCount;
  };

  return Document;
};