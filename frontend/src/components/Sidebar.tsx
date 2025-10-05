"use client";

import { useState } from 'react';
// FIX: Import the 'LucideIcon' type from the library.
// ADD: Import 'useNavigate' for redirection and 'LogOut' icon.
import { LayoutDashboard, ListTodo, Calendar, TrendingUp, FileText, Settings, ChevronsLeft, ChevronsRight, BrainCircuit, LogOut, type LucideIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// --- TYPE & DATA CONFIGURATION ---
interface NavItemData {
  path: string;
  // FIX: Use the specific 'LucideIcon' type instead of a generic one.
  icon: LucideIcon;
  label: string;
}

const navItems: NavItemData[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/backlog', icon: ListTodo, label: 'Backlog' },
  { path: '/sprint-planner', icon: Calendar, label: 'Sprint Planner' },
  { path: '/performance', icon: TrendingUp, label: 'Performance' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

// --- COMPONENT: NavItem ---
// A dedicated component for navigation links to keep the main component clean.
const NavItem = ({ item, isCollapsed, isActive }: { item: NavItemData; isCollapsed: boolean; isActive: boolean; }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={isCollapsed ? item.label : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative ${
        isActive
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      {/* Active indicator bar */}
      <div className={`absolute left-0 top-0 h-full w-1 bg-indigo-400 rounded-r-full transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`} />
      
      <Icon size={22} />
      <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
        {item.label}
      </span>
    </Link>
  );
};

// --- MAIN SIDEBAR COMPONENT ---
const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // ADD: Initialize navigate for programmatic routing
  const navigate = useNavigate();

  // ADD: Handler for logout action
  const handleLogout = () => {
    // In a real app, you'd also clear auth tokens, user state, etc.
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-900/80 backdrop-blur-lg border-r border-slate-700/50 flex flex-col z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Header */}
      <div className="flex items-center h-20 px-4 border-b border-slate-700/50">
        <div className={`flex items-center gap-2 transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <BrainCircuit className="text-indigo-400 flex-shrink-0" size={28} />
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                <h1 className="text-xl font-bold text-white whitespace-nowrap">Planix</h1>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.path}
          />
        ))}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={`https://placehold.co/40x40/818cf8/ffffff?text=A`} 
            alt="User Avatar" 
            className="rounded-full flex-shrink-0"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/334155/ffffff?text=U'; }}
          />
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <p className="text-sm font-semibold text-white whitespace-nowrap">Anika Garg</p>
            <p className="text-xs text-gray-400 whitespace-nowrap">Admin</p>
          </div>
        </div>
        
        {/* ADD: Logout Button */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
        >
          <LogOut size={22} />
          <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            Logout
          </span>
        </button>
      </div>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white hover:bg-indigo-600 rounded-full p-1.5 transition-all duration-300 border-2 border-slate-700/80 shadow-md"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>

    </aside>
  );
};

export default Sidebar;