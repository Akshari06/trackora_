import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  BookOpen, 
  LogOut, 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  TrendingUp, 
  Zap, 
  Inbox 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import GalaxyBackground from './GalaxyBackground';
import AIChatbot from './AIChatbot';

export default function DashboardLayout() {
  const { teacher, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/app' },
    { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance' },
    { icon: TrendingUp, label: 'Progress', path: '/app/progress' },
    { icon: Zap, label: 'Skills', path: '/app/skills' },
    { icon: Users, label: 'Students', path: '/app/students' },
    { icon: BookOpen, label: 'Lessons', path: '/app/lessons' },
    { icon: Inbox, label: 'Requests', path: '/app/requests' },
  ];

  return (
    <div className={cn("min-h-screen flex", theme === 'dark' ? "text-white" : "text-slate-900")}>
      <GalaxyBackground />
      <AIChatbot />
      
      {/* Sidebar */}
      <aside className={cn(
        "w-72 border-r flex flex-col fixed inset-y-0 z-50 transition-all duration-300",
        theme === 'dark' ? "bg-white/5 backdrop-blur-xl border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-10">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold",
              theme === 'dark' ? "bg-purple-600 shadow-lg shadow-purple-500/50" : "bg-brand-primary"
            )}>P</div>
            <span className={cn(
              "font-display text-xl font-bold tracking-tight uppercase",
              theme === 'dark' && "text-white neon-text"
            )}>PATHMARK</span>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium",
                  theme === 'dark' 
                    ? "text-white/60 hover:bg-white/5 hover:text-white" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  isActive && (
                    theme === 'dark'
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                      : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                  )
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className={cn(
          "mt-auto p-8 border-t space-y-4",
          theme === 'dark' ? "border-white/10" : "border-slate-100"
        )}>
          <div className="flex items-center gap-3 p-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden border",
              theme === 'dark' ? "bg-white/10 border-white/20" : "bg-slate-100 border-slate-200"
            )}>
               {user?.photoURL ? <img src={user.photoURL} alt="" /> : teacher?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{teacher?.name}</p>
              <p className={cn("text-xs truncate", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium",
              theme === 'dark' ? "text-white/60 hover:bg-red-500/10 hover:text-red-400" : "text-slate-600 hover:bg-red-50 hover:text-red-600"
            )}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        "ml-72"
      )}>
        {/* Top Navbar */}
        <header className={cn(
          "h-20 border-b sticky top-0 z-40 px-8 flex items-center justify-between transition-all duration-300",
          theme === 'dark' ? "bg-black/50 backdrop-blur-md border-white/10" : "bg-white/80 backdrop-blur-md border-slate-200"
        )}>
          <div className={cn(
            "flex items-center gap-4 px-4 py-2 rounded-2xl w-96 border transition-all",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
          )}>
             <Search className="w-4 h-4 text-slate-400" />
             <input 
              type="search" 
              placeholder="Search students, classes..." 
              className={cn(
                "bg-transparent border-none text-sm w-full focus:outline-none",
                theme === 'dark' ? "text-white placeholder:text-white/20" : "text-slate-900"
              )} 
             />
          </div>
          
          <div className="flex items-center gap-4">
             <button
                onClick={toggleTheme}
                className={cn(
                  "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
             >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             
             <div className={cn(
              "border px-4 py-2 rounded-2xl text-sm font-medium flex items-center gap-2",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
             )}>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                Galaxy Mode
             </div>
             
             <button className={cn(
                "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
             )}>
                <Bell className="w-5 h-5" />
             </button>
          </div>
        </header>
        
        <div className="p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
