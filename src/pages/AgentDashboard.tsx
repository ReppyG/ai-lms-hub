import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { StudyToolsGrid } from "@/components/StudyToolsGrid";
import { WeeklyDigest } from "@/components/WeeklyDigest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, BookOpen, TrendingUp } from "lucide-react";

const AgentDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Agent Dashboard
          </h1>
          <p className="text-muted-foreground">
            Premium AI-powered study tools and automation
          </p>
        </div>

        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Study Tools
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Agent Tasks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-6">
            <StudyToolsGrid />
          </TabsContent>

          <TabsContent value="tasks">
            <AgentTaskPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <WeeklyDigest />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AgentDashboard;
