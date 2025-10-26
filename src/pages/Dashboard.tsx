import { Layout } from "@/components/Layout";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Assignment } from "@/types";

// Sample data for demonstration
const sampleAssignments: Assignment[] = [
  {
    id: 1,
    name: "Data Structures Final Project",
    description: "Implement a balanced binary search tree",
    due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 100,
    course_id: 101,
    courseName: "CS 201 - Data Structures",
    status: "todo",
  },
  {
    id: 2,
    name: "Machine Learning Assignment 3",
    description: "Neural network implementation",
    due_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 75,
    course_id: 102,
    courseName: "CS 301 - Machine Learning",
    status: "upcoming",
  },
  {
    id: 3,
    name: "Database Design Quiz",
    description: "SQL and normalization",
    due_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 50,
    course_id: 103,
    courseName: "CS 250 - Database Systems",
    status: "overdue",
  },
];

const Dashboard = () => {
  const stats = [
    {
      label: "Active Assignments",
      value: "8",
      icon: Clock,
      color: "text-secondary",
    },
    {
      label: "Completed This Week",
      value: "5",
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Average Score",
      value: "92%",
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

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
          <Button className="gradient-primary shadow-glow">
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
            <Button variant="ghost">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
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
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">Generate Study Plan</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">Summarize Content</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">AI Tutor Chat</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">Estimate Time</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
