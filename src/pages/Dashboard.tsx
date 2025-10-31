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
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, Student! 👋</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your courses today
            </p>
          </div>
          <Button className="gradient-primary shadow-glow" onClick={() => navigate("/pricing")}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Study Plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Urgent Assignments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Urgent Assignments</h2>
            <Button variant="ghost" onClick={() => navigate("/assignments")}>View All</Button>
          </div>
          {urgentAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} canvasUrl={canvasUrl} />
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {convertedAssignments.length === 0 
                    ? "No assignments found. Configure Canvas in Settings to sync your data." 
                    : "No urgent assignments. Great job staying on top of your work! 🎉"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Powered Study Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/pricing")}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">Generate Study Plan</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/ai-tools")}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">AI Tools</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/chat")}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">AI Tutor Chat</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/pricing")}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">AI Assistant</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
