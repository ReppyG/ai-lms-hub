import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  Settings, 
  MessageSquare,
  FileText,
  GraduationCap
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Assignments", path: "/assignments" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Sparkles, label: "AI Tools", path: "/ai-tools" },
  { icon: FileText, label: "Notes", path: "/notes" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Canvas Pro</h1>
            <p className="text-xs text-sidebar-foreground/60">AI Study Assistant</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/30">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Student</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">student@edu.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
