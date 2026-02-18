import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen retro-desktop">
      <header className="sticky top-0 z-10 border-b-[3px] border-[#2a2334] bg-[#d8bde8] shadow-[0_4px_0_#2a2334]">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#2a2334]"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="text-[#2a2334]">Control Panel</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation links
                  </SheetDescription>
                </SheetHeader>
                <nav className="px-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <SheetClose asChild key={item.path}>
                        <button
                          onClick={() => navigate(item.path)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[10px] transition-colors w-full border-2 border-[#2a2334] ${
                            isActive
                              ? 'bg-[#b9df6b] text-[#2a2334]'
                              : 'bg-[#f6ebcf] text-[#2a2334] hover:bg-[#ffe7f3]'
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
            <div className="w-10 h-10 bg-[#f3a3cd] border-2 border-[#2a2334] rounded-[10px] flex items-center justify-center">
              <Heart className="w-6 h-6 text-[#2a2334] fill-[#2a2334]" />
            </div>
            <span className="font-bold text-xl text-[#2a2334]">NORMALIZACIJA OS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#2a2334] font-semibold">{currentUser}</span>
            <Avatar className="border-2 border-[#2a2334]">
              <AvatarFallback className="bg-[#b9df6b] text-[#2a2334]">
                {currentUser.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
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
