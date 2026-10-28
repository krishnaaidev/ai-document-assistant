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
  LogOut,
  ChevronRight,
  Brain,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Footer } from '../components/common/Footer';
import { ThemeToggle } from '../components/common/ThemeToggle';

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
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
          isActive
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-950/60 dark:to-purple-950/40 dark:text-indigo-300 dark:border dark:border-indigo-800/50 shadow-2xs font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={clsx(
              'w-5 h-5 flex-shrink-0 transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && isActive && (
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-500 dark:text-indigo-400" />
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
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
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-xs">
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {currentUser?.displayName || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 backdrop-blur-md">
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </NavLink>
            <hr className="my-1 border-slate-100 dark:border-slate-800" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full text-left transition-colors"
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-white dark:bg-[#0D111D] border-r border-slate-200/80 dark:border-slate-800/80 z-40 flex flex-col transition-all duration-200',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={clsx('flex items-center h-16 border-b border-slate-100 dark:border-slate-800/60 flex-shrink-0', collapsed ? 'px-3 justify-center' : 'px-4 gap-3')}>
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">AI Document</h1>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Assistant</p>
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
        <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
          <UserMenu collapsed={collapsed} />
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            className={clsx('w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform', collapsed ? '' : 'rotate-180')}
          />
        </button>
      </aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-[#0D111D] border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-2.5 ml-3">
              <div className="w-7 h-7 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Document Assistant</span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop top header bar */}
        <header className="hidden lg:flex items-center justify-between h-14 px-8 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/60 dark:bg-[#0D111D]/60 backdrop-blur-md sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Knowledge Engine: Ready
            </span>
            <span className="hidden xl:inline text-slate-400 dark:text-slate-600">•</span>
            <span className="hidden xl:inline">Pinecone + Supabase + Gemini 1.5</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabel />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export { AppLayout };
