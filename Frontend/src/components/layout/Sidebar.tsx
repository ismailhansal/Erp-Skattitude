import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Settings, 
  Calculator,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
  { icon: Calculator, label: 'Comptabilité', path: '/comptabilite' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: FileText, label: 'Devis', path: '/devis' },
  { icon: Receipt, label: 'Factures', path: '/factures' },
  { icon: Settings, label: 'Configuration', path: '/configuration' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-border px-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="Skattitude" className="h-10 w-10 object-contain" />
          {!collapsed && (
            <span className="font-serif text-xl font-semibold text-foreground">
              Skattitude
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'hover:bg-primary/10 hover:text-primary',
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn('w-full justify-start gap-3', collapsed && 'justify-center')}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          {!collapsed && <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn('w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10', collapsed && 'justify-center')}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>

        {/* Collapse button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
};
