import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  BookOpen,
  Languages,
  Clapperboard,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Wallet,
  CheckSquare,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useApp();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Daily Tasks', path: '/daily-tasks', icon: CheckSquare },
    { label: 'Spending', path: '/spending', icon: Wallet },
    { label: 'Library', path: '/library', icon: BookOpen },
    { label: 'Cinema', path: '/cinema', icon: Clapperboard },
    { label: 'Language Learning', path: '/language-learning', icon: Languages },
    { label: 'Workout History', path: '/events', icon: ListChecks },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-sm border-b-4 border-pink-300 sticky top-0 z-10">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-100"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-r-4 border-pink-300 bg-white">
                <SheetHeader>
                  <SheetTitle className="text-pink-700">Menu</SheetTitle>
                </SheetHeader>
                <nav className="px-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <SheetClose asChild key={item.path}>
                        <button
                          onClick={() => navigate(item.path)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${
                            isActive
                              ? 'bg-gradient-to-r from-pink-200 to-purple-200 text-pink-700'
                              : 'text-purple-700 hover:bg-pink-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{item.label}</span>
                        </button>
                      </SheetClose>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="font-bold text-xl text-pink-600">✨ Workout Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-purple-600 font-medium">{currentUser}</span>
            <Avatar className="border-2 border-pink-300">
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white">
                {currentUser.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-100"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
