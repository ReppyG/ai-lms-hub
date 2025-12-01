import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  Settings, 
  MessageSquare,
  FileText,
  GraduationCap,
  Workflow,
  BarChart3,
  Zap
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Sparkles, label: "Astra", path: "/astra", premium: true },
  { icon: BookOpen, label: "Assignments", path: "/assignments" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Sparkles, label: "AI Tools", path: "/ai-tools" },
  { icon: GraduationCap, label: "AI Agent", path: "/agent" },
  { icon: FileText, label: "Notes", path: "/notes" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Zap, label: "Premium Chat", path: "/premium-chat", premium: true },
  { icon: Workflow, label: "Workflows", path: "/workflows", premium: true },
  { icon: BarChart3, label: "Analytics", path: "/analytics", premium: true },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; user_id: string; email: string } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, user_id, email")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 animate-pulse-glow">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground group-hover:text-gradient transition-colors">Canvas Pro</h1>
            <p className="text-xs text-sidebar-foreground/60">AI Study Assistant</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-md border-l-4 border-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent animate-shimmer" />
              )}
              <Icon className={cn(
                "w-5 h-5 transition-all duration-200",
                isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-12"
              )} />
              <span className="relative">{item.label}</span>
              {item.premium && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-gradient-accent text-white rounded-full animate-pulse-glow">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors group">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-glow group-hover:scale-110 transition-transform">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              ID: {profile?.user_id || "Loading..."}
            </p>
          </div>
        </div>
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
