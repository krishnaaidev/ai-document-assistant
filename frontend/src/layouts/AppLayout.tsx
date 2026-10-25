import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  BookOpen,
  Activity,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Brain,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Documents', path: '/documents', icon: FileText },
  { label: 'Collections', path: '/collections', icon: FolderOpen },
  { label: 'AI Chat', path: '/chat', icon: MessageSquare },
  { label: 'Summaries', path: '/summaries', icon: BookOpen },
  { label: 'Recent Activity', path: '/activity', icon: Activity },
];

const bottomNavItems = [
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Help', path: '/help', icon: HelpCircle },
];

function NavItem({ item, collapsed }: { item: typeof navItems[0]; collapsed: boolean }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-neutral-500 group-hover:text-neutral-700')}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && isActive && (
            <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : currentUser?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-indigo-700">{initials}</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {currentUser?.displayName || 'User'}
            </p>
            <p className="text-xs text-neutral-500 truncate">{currentUser?.email}</p>
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 py-1">
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
            <hr className="my-1 border-neutral-100" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-40 flex flex-col transition-all duration-200',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={clsx('flex items-center h-16 border-b border-neutral-100 flex-shrink-0', collapsed ? 'px-3 justify-center' : 'px-4 gap-3')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-neutral-900">AI Document</h1>
              <p className="text-xs text-neutral-500">Assistant</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 py-3 border-t border-neutral-100 space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
          <UserMenu collapsed={collapsed} />
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center absolute -right-3 top-20 w-6 h-6 bg-white border border-neutral-200 rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronRight
            className={clsx('w-3 h-3 text-neutral-500 transition-transform', collapsed ? '' : 'rotate-180')}
          />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-16 px-4 bg-white border-b border-neutral-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-neutral-100"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">AI Document Assistant</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { AppLayout };
