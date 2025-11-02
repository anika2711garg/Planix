import React, { useState, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { notificationApi, Notification } from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Fetch notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const response = await notificationApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setNotifications(response.data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const response = await notificationApi.update(id, { read: true });
    if (response.error) {
      setError(response.error);
    } else {
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    }
  };

  const markAsUnread = async (id: string) => {
    const response = await notificationApi.update(id, { read: false });
    if (response.error) {
      setError(response.error);
    } else {
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, read: false } : notification
      ));
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    const response = await notificationApi.delete(id);
    if (response.error) {
      setError(response.error);
    } else {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-400" size={20} />;
      case 'error': return <AlertCircle className="text-red-400" size={20} />;
      default: return <Info className="text-blue-400" size={20} />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30';
      case 'warning': return 'border-yellow-500/30';
      case 'error': return 'border-red-500/30';
      default: return 'border-blue-500/30';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-gray-400">Stay updated with your project activities</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Check size={20} />
              Mark All Read
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-black/20 p-1 rounded-lg">
            {(['all', 'unread', 'read'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {filterType === 'all' && `All (${notifications.length})`}
                {filterType === 'unread' && `Unread (${unreadCount})`}
                {filterType === 'read' && `Read (${notifications.length - unreadCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-black/30 backdrop-blur-lg rounded-xl p-6 border ${
                notification.read ? 'border-white/10' : `border-l-4 ${getNotificationBorderColor(notification.type)}`
              } hover:border-white/20 transition-colors ${
                !notification.read ? 'bg-opacity-80' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      )}
                    </div>
                    <p className={`${notification.read ? 'text-gray-400' : 'text-gray-300'} mb-3`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        {notification.read ? (
                          <button
                            onClick={() => markAsUnread(notification.id)}
                            className="text-gray-400 hover:text-indigo-400 text-sm"
                          >
                            Mark as unread
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-400 hover:text-green-400 text-sm"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-4"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {filter === 'unread' ? 'No Unread Notifications' : 
               filter === 'read' ? 'No Read Notifications' : 'No Notifications'}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You're all caught up! No notifications to show."
                : `No ${filter} notifications found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;