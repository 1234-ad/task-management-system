import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Tasks = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API call
      setTimeout(() => {
        const mockTasks = [
          {
            id: 1,
            title: 'Update user authentication system',
            description: 'Implement JWT refresh tokens and improve security',
            status: 'in_progress',
            priority: 'high',
            dueDate: '2025-08-15',
            assignee: 'John Doe',
            createdAt: '2025-08-10',
            documents: 2
          },
          {
            id: 2,
            title: 'Design new landing page',
            description: 'Create responsive design for the new landing page',
            status: 'pending',
            priority: 'medium',
            dueDate: '2025-08-18',
            assignee: 'Jane Smith',
            createdAt: '2025-08-11',
            documents: 0
          },
          {
            id: 3,
            title: 'Fix payment gateway integration',
            description: 'Resolve issues with Stripe payment processing',
            status: 'completed',
            priority: 'high',
            dueDate: '2025-08-12',
            assignee: 'Mike Johnson',
            createdAt: '2025-08-08',
            documents: 1
          },
          {
            id: 4,
            title: 'Write API documentation',
            description: 'Document all REST API endpoints',
            status: 'pending',
            priority: 'low',
            dueDate: '2025-08-20',
            assignee: 'Sarah Wilson',
            createdAt: '2025-08-12',
            documents: 0
          },
          {
            id: 5,
            title: 'Implement real-time notifications',
            description: 'Add WebSocket support for live notifications',
            status: 'in_progress',
            priority: 'medium',
            dueDate: '2025-08-16',
            assignee: 'David Brown',
            createdAt: '2025-08-09',
            documents: 3
          }
        ];
        
        let filteredTasks = mockTasks;
        
        // Apply filters
        if (statusFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }
        
        if (priorityFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }
        
        if (searchTerm) {
          filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setTasks(filteredTasks);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        // Simulate API call
        setTasks(tasks.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>
        <Link
          to="/tasks/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tasks found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or create a new task</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.assignee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.documents} files
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/tasks/${task.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;