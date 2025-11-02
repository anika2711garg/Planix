import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  members: User[];
}

const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Fetch teams
  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Fetch available users (not in any team)
  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/available-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (teamId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/team-members?teamId=${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTeam(data.team);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Add user to team
  const addUserToTeam = async () => {
    if (!selectedTeam || !selectedUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/team-members', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          userId: parseInt(selectedUser)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'User added to team successfully!' });
        setSelectedUser('');
        fetchTeamMembers(selectedTeam.id);
        fetchAvailableUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add user to team' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding user to team' });
    } finally {
      setLoading(false);
    }
  };

  // Remove user from team
  const removeUserFromTeam = async (userId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/team-members', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'User removed from team successfully!' });
        if (selectedTeam) {
          fetchTeamMembers(selectedTeam.id);
        }
        fetchAvailableUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove user from team' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error removing user from team' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
      fetchAvailableUsers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access team management.</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'manager') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Only managers can access team management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Management</h1>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Teams List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Teams</h2>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => fetchTeamMembers(team.id)}
                    >
                      <h3 className="font-medium text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">
                        {team.members?.length || 0} members
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Details */}
              <div>
                {selectedTeam ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedTeam.name} - Members
                    </h2>

                    {/* Add User Section */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Add User to Team</h3>
                      <div className="flex gap-3">
                        <select
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          <option value="">Select a user...</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.username} ({user.email}) - {user.role}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={addUserToTeam}
                          disabled={!selectedUser || loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Adding...' : 'Add User'}
                        </button>
                      </div>
                    </div>

                    {/* Current Members */}
                    <div className="space-y-3">
                      {selectedTeam.members && selectedTeam.members.length > 0 ? (
                        selectedTeam.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">{member.username}</h4>
                              <p className="text-sm text-gray-500">{member.email}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                member.role === 'manager' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : member.role === 'leader'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <button
                              onClick={() => removeUserFromTeam(member.id)}
                              disabled={loading}
                              className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No members in this team yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Select a team to view and manage members</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;