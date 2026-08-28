import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, PlaySquare, CheckSquare, Users, Settings, LogOut, Infinity } from 'lucide-react';

interface PlatformLayoutProps {
  children: ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const location = useLocation();

  const navItems = [
    { name: 'דאשבורד', path: '/dashboard', icon: LayoutDashboard },
    { name: 'ספרייה', path: '/library', icon: PlaySquare },
    { name: 'משימות', path: '/assignments', icon: CheckSquare },
    { name: 'הפוד שלי', path: '/pod', icon: Users },
  ];

  const adminItems = [
    { name: 'ניהול אדמין', path: '/admin', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#010308] text-white flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-l border-white/[0.05] bg-white/[0.01] backdrop-blur-xl h-screen sticky top-0">
        <div className="p-8 flex items-center justify-center border-b border-white/[0.05]">
          <Link to="/" className="text-white flex items-center gap-2 group">
            <Infinity className="w-8 h-8 text-[#C8A24C] group-hover:rotate-180 transition-transform duration-700" strokeWidth={1} />
            <span className="font-heading text-xl tracking-wide">Masterpiece</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#C8A24C]/10 text-[#F7E7B5] border border-[#C8A24C]/20' 
                    : 'text-white/50 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1} />
                <span className="font-light">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-8 pb-2">
            <p className="px-4 text-[11px] uppercase tracking-widest text-white/20 mb-2">ניהול</p>
            {adminItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-purple-900/20 text-purple-300 border border-purple-500/20' 
                      : 'text-white/50 hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1} />
                  <span className="font-light">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-white/[0.05]">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/50 hover:bg-white/[0.03] hover:text-white transition-all text-right">
            <LogOut className="w-5 h-5" strokeWidth={1} />
            <span className="font-light">התנתק</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-0 min-w-0">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (PWA-ready) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#010308]/90 backdrop-blur-2xl border-t border-white/[0.1] z-50 px-6 py-4 flex justify-between items-center pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1.5 p-2 ${
                isActive ? 'text-[#C8A24C]' : 'text-white/40'
              }`}
            >
              <item.icon className="w-6 h-6" strokeWidth={isActive ? 1.5 : 1} />
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
