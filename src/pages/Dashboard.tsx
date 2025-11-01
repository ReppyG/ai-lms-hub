import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Assignment } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCanvasContext } from "@/contexts/CanvasContext";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { assignments, courses, loading: canvasLoading } = useCanvasContext();
  const [canvasUrl, setCanvasUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const url = localStorage.getItem("canvas_url");
    if (url) {
      setCanvasUrl(url);
    }
  }, []);

  // Convert Canvas assignments to Assignment type and calculate stats
  const convertedAssignments: Assignment[] = useMemo(() => {
    return assignments.map((assignment) => {
      const course = courses.find((c) => c.id === assignment.course_id);
      const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
      const now = new Date();
      const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      let status: Assignment["status"] = "upcoming";
      if (daysUntil !== null) {
        if (daysUntil < 0) status = "overdue";
        else if (daysUntil <= 2) status = "todo";
      }

      return {
        id: assignment.id,
        name: assignment.name,
        description: assignment.description,
        due_at: assignment.due_at,
        points_possible: assignment.points_possible,
        course_id: assignment.course_id,
        courseName: course?.name || "Unknown Course",
        status,
      };
    });
  }, [assignments, courses]);

  const stats = useMemo(() => {
    const totalAssignments = convertedAssignments.length;
    const completedCount = convertedAssignments.filter((a) => a.status === "completed").length;
    const upcomingCount = convertedAssignments.filter(
      (a) => a.status === "todo" || a.status === "upcoming"
    ).length;

    return [
      {
        label: "Total Assignments",
        value: totalAssignments.toString(),
        icon: TrendingUp,
        color: "text-primary",
      },
      {
        label: "Upcoming",
        value: upcomingCount.toString(),
        icon: Clock,
        color: "text-warning",
      },
      {
        label: "Completed",
        value: completedCount.toString(),
        icon: CheckCircle2,
        color: "text-success",
      },
    ];
  }, [convertedAssignments]);

  const urgentAssignments = useMemo(() => {
    return convertedAssignments
      .filter((a) => a.status === "todo" || a.status === "overdue")
      .sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      })
      .slice(0, 6);
  }, [convertedAssignments]);

  if (loading || canvasLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-10 animate-fade-in">
        {/* Hero Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome back, Student! <span className="animate-float inline-block">👋</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}! 
              Ready to conquer your studies today?
            </p>
          </div>
          <Button 
            className="gradient-primary shadow-glow-lg hover:scale-105 transition-all duration-300 text-lg px-6 py-6 rounded-xl group" 
            onClick={() => navigate("/pricing")}
          >
            <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            AI Study Plan
          </Button>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.label} 
                className="border-border/50 hover-lift glass-card group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide uppercase">{stat.label}</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12",
                      stat.color,
                      "bg-gradient-to-br from-white/10 to-white/5 shadow-lg"
                    )}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Urgent Assignments */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                🔥 Urgent Assignments
              </h2>
              <p className="text-muted-foreground mt-1">Assignments that need your attention soon</p>
            </div>
            <Button 
              variant="outline" 
              className="hover-scale"
              onClick={() => navigate("/assignments")}
            >
              View All
            </Button>
          </div>
          {urgentAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urgentAssignments.map((assignment, index) => (
                <div 
                  key={assignment.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in"
                >
                  <AssignmentCard assignment={assignment} canvasUrl={canvasUrl} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 glass-card">
              <CardContent className="py-16 text-center">
                <div className="text-6xl mb-4 animate-float">🎉</div>
                <p className="text-xl font-semibold text-foreground mb-2">
                  {convertedAssignments.length === 0 
                    ? "No assignments found" 
                    : "All caught up!"}
                </p>
                <p className="text-muted-foreground">
                  {convertedAssignments.length === 0 
                    ? "Configure Canvas in Settings to sync your data." 
                    : "Great job staying on top of your work!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/20 glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg gradient-primary shadow-glow">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              AI-Powered Study Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 py-6 hover-lift glass-card border-primary/30 group"
              onClick={() => navigate("/pricing")}
            >
              <div className="p-3 rounded-xl gradient-primary shadow-glow group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold">Generate Study Plan</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 py-6 hover-lift glass-card border-secondary/30 group"
              onClick={() => navigate("/ai-tools")}
            >
              <div className="p-3 rounded-xl gradient-secondary shadow-glow group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold">AI Tools</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 py-6 hover-lift glass-card border-accent/30 group"
              onClick={() => navigate("/chat")}
            >
              <div className="p-3 rounded-xl gradient-accent shadow-glow group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold">AI Tutor Chat</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 py-6 hover-lift glass-card border-primary/30 group"
              onClick={() => navigate("/premium-chat")}
            >
              <div className="p-3 rounded-xl gradient-primary shadow-glow group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold">Premium Chat</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
