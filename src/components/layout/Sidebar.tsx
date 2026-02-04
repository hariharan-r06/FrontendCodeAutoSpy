import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertCircle, 
  Wrench, 
  ListTodo, 
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useState } from 'react';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: AlertCircle },
  { title: 'Fixes', url: '/fixes', icon: Wrench },
  { title: 'Queue', url: '/queue', icon: ListTodo },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { isOnline } = useServerStatus();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-foreground truncate">CodeAutoSpy</h1>
            <p className="text-xs text-muted-foreground">AI CI/CD Agent</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url !== '/' && location.pathname.startsWith(item.url));
          
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "sidebar-item-active text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Server Status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-2",
          collapsed && "justify-center"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            isOnline === null ? "bg-muted-foreground animate-pulse" :
            isOnline ? "bg-success" : "bg-destructive"
          )} />
          {!collapsed && (
            <span className="text-xs text-muted-foreground">
              {isOnline === null ? 'Checking...' : isOnline ? 'Server Online' : 'Server Offline'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
