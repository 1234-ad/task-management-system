import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetail();
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API call
      setTimeout(() => {
        const mockTask = {
          id: parseInt(id),
          title: 'Update user authentication system',
          description: 'Implement JWT refresh tokens and improve security measures. This task involves updating the current authentication system to use refresh tokens for better security and user experience. The implementation should include proper token rotation, secure storage, and automatic token refresh mechanisms.',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2025-08-15',
          assignee: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
          },
          createdBy: {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          createdAt: '2025-08-10T10:30:00Z',
          updatedAt: '2025-08-12T14:20:00Z',
          documents: [
            {
              id: 1,
              name: 'authentication-requirements.pdf',
              size: 2048576,
              uploadedAt: '2025-08-10T11:00:00Z',
              uploadedBy: 'Jane Smith'
            },
            {
              id: 2,
              name: 'security-guidelines.pdf',
              size: 1536000,
              uploadedAt: '2025-08-11T09:15:00Z',
              uploadedBy: 'John Doe'
            }
          ],
          comments: [
            {
              id: 1,
              text: 'Started working on the JWT implementation. Will have the basic structure ready by tomorrow.',
              author: 'John Doe',
              createdAt: '2025-08-11T16:30:00Z'
            },
            {
              id: 2,
              text: 'Great! Make sure to follow the security guidelines document I uploaded.',
              author: 'Jane Smith',
              createdAt: '2025-08-11T17:00:00Z'
            }
          ]
        };
        setTask(mockTask);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching task:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/tasks');
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleDownloadDocument = (document) => {
    // Simulate document download
    console.log('Downloading document:', document.name);
    alert(`Downloading ${document.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Task not found</p>
        <Link to="/tasks" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Tasks
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDeleteTask}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Task Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                <FlagIcon className="h-4 w-4 inline mr-1" />
                {task.priority} priority
              </span>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>

              {/* Documents */}
              {task.documents && task.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Documents</h3>
                  <div className="space-y-3">
                    {task.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <DocumentIcon className="h-8 w-8 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.size)} • Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {task.comments && task.comments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Comments</h3>
                  <div className="space-y-4">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                          <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Task Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Task Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignee</dt>
                    <dd className="mt-1 flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{task.assignee.name}</span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</dt>
                    <dd className="mt-1 flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{task.dueDate}</span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By</dt>
                    <dd className="mt-1 flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{task.createdBy.name}</span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
                    <dd className="mt-1 flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(task.createdAt)}</span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
                    <dd className="mt-1 flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(task.updatedAt)}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    to={`/tasks/${task.id}/edit`}
                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Task
                  </Link>
                  <button
                    onClick={handleDeleteTask}
                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;