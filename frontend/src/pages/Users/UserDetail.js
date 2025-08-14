import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API call
      setTimeout(() => {
        const mockUser = {
          id: parseInt(id),
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2025-01-15T10:30:00Z',
          lastLogin: '2025-08-14T09:15:00Z',
          phone: '+1 (555) 123-4567',
          department: 'Engineering',
          bio: 'Senior software developer with 5+ years of experience in full-stack development. Passionate about creating efficient and scalable solutions.',
          stats: {
            totalTasks: 15,
            completedTasks: 12,
            pendingTasks: 2,
            overdueTasks: 1
          }
        };

        const mockTasks = [
          {
            id: 1,
            title: 'Update user authentication system',
            status: 'in_progress',
            priority: 'high',
            dueDate: '2025-08-15',
            createdAt: '2025-08-10'
          },
          {
            id: 2,
            title: 'Fix payment gateway integration',
            status: 'completed',
            priority: 'high',
            dueDate: '2025-08-12',
            createdAt: '2025-08-08'
          },
          {
            id: 3,
            title: 'Implement real-time notifications',
            status: 'in_progress',
            priority: 'medium',
            dueDate: '2025-08-16',
            createdAt: '2025-08-09'
          },
          {
            id: 4,
            title: 'Code review for new features',
            status: 'pending',
            priority: 'low',
            dueDate: '2025-08-18',
            createdAt: '2025-08-11'
          },
          {
            id: 5,
            title: 'Database optimization',
            status: 'completed',
            priority: 'medium',
            dueDate: '2025-08-10',
            createdAt: '2025-08-05'
          }
        ];

        setUser(mockUser);
        setUserTasks(mockTasks);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching user:', error);
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteUser = async () => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/users');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleUserStatus = async () => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      setUser(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">User not found</p>
        <Link to="/users" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
          Back to Users
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
            onClick={() => navigate('/users')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Users
          </button>
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => alert('Edit user functionality would be implemented here')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleToggleUserStatus}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
              user.status === 'active' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {user.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDeleteUser}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-16 w-16">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {user.email}
                  </dd>
                </div>
                
                {user.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
                  </div>
                )}
                
                {user.department && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.department}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Joined</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(user.lastLogin)}
                  </dd>
                </div>
              </dl>
              
              {user.bio && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-2 text-sm text-gray-900">{user.bio}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.totalTasks}</div>
                <div className="text-sm text-gray-500">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.stats.completedTasks}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{user.stats.pendingTasks}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{user.stats.overdueTasks}</div>
                <div className="text-sm text-gray-500">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Assigned Tasks</h3>
                <Link
                  to="/tasks"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all tasks
                </Link>
              </div>
            </div>
            
            <div className="overflow-hidden">
              {userTasks.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 text-lg mt-4">No tasks assigned</p>
                </div>
              ) : (
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
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {formatDate(task.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.dueDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/tasks/${task.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;