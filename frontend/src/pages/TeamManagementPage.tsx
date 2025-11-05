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
      <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
          <p className="text-gray-300">Please log in to access team management.</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'manager') {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-300">Only managers can access team management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
      {/* Animated Aurora Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 shadow-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-3xl font-bold text-white mb-8">Team Management</h1>

              {/* Message Display */}
              {message && (
                <div className={`mb-6 p-4 rounded-md backdrop-blur-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {message.text}
                </div>
              )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Teams List */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Teams</h2>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors backdrop-blur-sm ${
                        selectedTeam?.id === team.id
                          ? 'border-blue-500/50 bg-blue-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                      onClick={() => fetchTeamMembers(team.id)}
                    >
                      <h3 className="font-medium text-white">{team.name}</h3>
                      <p className="text-sm text-gray-400">
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
                    <h2 className="text-xl font-semibold text-white mb-4">
                      {selectedTeam.name} - Members
                    </h2>

                    {/* Add User Section */}
                    <div className="mb-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-3">Add User to Team</h3>
                      <div className="flex gap-3">
                        <select
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="flex-1 px-3 py-2 border border-white/10 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ backgroundColor: '#000000', color: '#ffffff' }}
                          disabled={loading}
                        >
                          <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Select a user...</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                              {user.username} ({user.email}) - {user.role}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={addUserToTeam}
                          disabled={!selectedUser || loading}
                          className="px-4 py-2 bg-blue-600/80 text-white rounded-md hover:bg-blue-600 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="flex items-center justify-between p-3 border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-white">{member.username}</h4>
                              <p className="text-sm text-gray-400">{member.email}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                member.role === 'manager' 
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : member.role === 'leader'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <button
                              onClick={() => removeUserFromTeam(member.id)}
                              disabled={loading}
                              className="px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">No members in this team yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>Select a team to view and manage members</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;