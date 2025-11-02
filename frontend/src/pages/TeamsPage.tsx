import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, Calendar, User } from 'lucide-react';
import { teamApi, Team } from '../services/api';

const TeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch teams on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    const response = await teamApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setTeams(response.data || []);
    }
    setLoading(false);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await teamApi.create(formData);
    if (response.error) {
      setError(response.error);
    } else {
      setTeams(prev => [...prev, response.data!]);
      setShowAddForm(false);
      setFormData({ name: '', description: '' });
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    
    const response = await teamApi.update(editingTeam.id, formData);
    if (response.error) {
      setError(response.error);
    } else {
      setTeams(prev => prev.map(team => 
        team.id === editingTeam.id ? response.data! : team
      ));
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    const response = await teamApi.delete(id);
    if (response.error) {
      setError(response.error);
    } else {
      setTeams(prev => prev.filter(team => team.id !== id));
    }
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || ''
    });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingTeam(null);
    setFormData({ name: '', description: '' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Teams</h1>
            <p className="text-gray-400">Manage your development teams</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Add Team
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingTeam ? 'Edit Team' : 'Add New Team'}
            </h3>
            <form onSubmit={editingTeam ? handleUpdateTeam : handleAddTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Team Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter team description"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  {editingTeam ? 'Update Team' : 'Add Team'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{team.name}</h3>
                    {team.description && (
                      <p className="text-gray-400 text-sm">{team.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(team)}
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Members</span>
                  <span className="text-indigo-400 text-sm flex items-center gap-1">
                    <User size={12} />
                    {team.members?.length || 0}
                  </span>
                </div>
                
                {team.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Created</span>
                    <span className="text-gray-300 text-sm flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {team.members && team.members.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-gray-300 text-sm font-medium mb-2">Team Members</h4>
                  <div className="flex flex-wrap gap-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 rounded-full text-xs text-indigo-300">
                        <User size={10} />
                        {member.name}
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <span className="text-gray-400 text-xs">+{team.members.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {teams.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Teams Found</h3>
            <p className="text-gray-500">Get started by creating your first team.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;