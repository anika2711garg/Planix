"use client";

import { useState, FormEvent } from 'react';
import { User, Users, Bell, Link2, PlusCircle, Save, X, LucideProps } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type TabId = 'profile' | 'team' | 'notifications' | 'integrations';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ForwardRefExoticComponent<LucideProps>;
}

interface TeamMember {
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

// --- CONFIGURATION FOR TABS ---
const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'team', label: 'Team Management', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
];

// --- SUB-COMPONENTS FOR EACH TAB ---

const ProfileSettings = () => (
  <div className="animate-fadeIn">
    <h3 className="text-xl font-semibold text-white mb-6">Profile Settings</h3>
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
        <input
          type="text"
          defaultValue="Alex Johnson"
          className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
        <input
          type="email"
          defaultValue="alex@example.com"
          className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Change Password</label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
        />
      </div>
      <div className="pt-2">
        <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

// --- MODAL COMPONENT FOR INVITING MEMBERS ---
const InviteMemberModal = ({ isOpen, onClose, onInvite }: { isOpen: boolean; onClose: () => void; onInvite: (member: TeamMember) => void; }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'Admin' | 'Member'>('Member');

    if (!isOpen) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (name && email) {
            onInvite({ name, email, role });
            // Reset form and close
            setName('');
            setEmail('');
            setRole('Member');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="relative bg-slate-800 border border-white/10 rounded-2xl shadow-xl w-full max-w-md p-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-bold text-white mb-6">Invite New Member</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')} className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                            <option value="Member">Member</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors">Cancel</button>
                        <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all">
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TeamManagement = () => {
    const initialMembers: TeamMember[] = [
        { name: 'Alex Johnson', email: 'alex@example.com', role: 'Admin' },
        { name: 'Sarah Williams', email: 'sarah@example.com', role: 'Member' },
        { name: 'John Davis', email: 'john@example.com', role: 'Member' },
    ];

    const [members, setMembers] = useState<TeamMember[]>(initialMembers);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddMember = (newMember: TeamMember) => {
        setMembers(prevMembers => [...prevMembers, newMember]);
    };

    return (
    <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Team Management</h3>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <PlusCircle size={18} />
                Invite Member
            </button>
        </div>
        <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {members.map((member, index) => (
                             <tr key={index} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{member.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{member.email}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${member.role === 'Admin' ? 'text-indigo-400' : 'text-gray-400'}`}>{member.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <InviteMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onInvite={handleAddMember} />
    </div>
    );
};

const NotificationToggle = ({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0">
        <div>
            <p className="text-white font-medium">{label}</p>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);

const NotificationSettings = () => (
  <div className="animate-fadeIn">
    <h3 className="text-xl font-semibold text-white mb-4">Notification Preferences</h3>
    <div className="space-y-2">
      <NotificationToggle label="Email Notifications" description="Receive email updates about sprint progress" defaultChecked />
      <NotificationToggle label="AI Recommendations" description="Get notified about AI-generated insights" defaultChecked />
      <NotificationToggle label="Sprint Completion" description="Alerts when sprints are completed" defaultChecked />
      <NotificationToggle label="Task Assignments" description="Notifications when tasks are assigned to you" />
    </div>
  </div>
);

const IntegrationCard = ({ icon, name, description }: { icon: string; name: string; description: string; }) => (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg hover:border-indigo-500/50 transition-all duration-300">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center text-2xl">
                {icon}
            </div>
            <div>
                <p className="text-white font-medium">{name}</p>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
            Connect
        </button>
    </div>
);

const IntegrationsSettings = () => (
    <div className="animate-fadeIn">
        <h3 className="text-xl font-semibold text-white mb-2">Integrations</h3>
        <p className="text-gray-400 mb-6">Connect your workspace with your favorite tools</p>
        <div className="space-y-4 max-w-2xl">
            <IntegrationCard icon="📧" name="Slack" description="Team communication and notifications" />
            <IntegrationCard icon="🐙" name="GitHub" description="Code repository and version control" />
            <IntegrationCard icon="📊" name="Jira" description="Project management and issue tracking" />
        </div>
    </div>
);

// --- MAIN SETTINGS PAGE COMPONENT ---
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'team': return <TeamManagement />;
      case 'notifications': return <NotificationSettings />;
      case 'integrations': return <IntegrationsSettings />;
      default: return <ProfileSettings />;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
        {/* Animated Aurora Background */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-1">Settings</h1>
                <p className="text-indigo-300">Manage your account and workspace preferences</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-64">
                    <nav className="space-y-1 bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                        {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 bg-black/30 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/10">
                    {renderContent()}
                </main>
            </div>
        </div>
        
        {/* Adding keyframes for the fadeIn animation */}
        <style>
            {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-in-out forwards;
                }
            `}
        </style>
    </div>
  );
};

export default SettingsPage;