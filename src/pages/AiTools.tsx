import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIToolDialog } from "@/components/AIToolDialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Clock,
  Brain,
} from "lucide-react";

const aiTools = [
  {
    icon: Brain,
    title: "Generate Study Plan",
    description: "AI-powered personalized study schedules",
    color: "text-primary",
    bgColor: "bg-primary/10",
    systemPrompt: "You are a study planning assistant. Create a detailed, personalized study plan based on the user's request. Include specific time blocks, subjects, and break periods. Make it realistic and achievable.",
  },
  {
    icon: FileText,
    title: "Summarize Content",
    description: "Quick summaries of lectures and readings",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    systemPrompt: "You are a content summarization expert. Provide clear, concise summaries that capture the key points and main ideas. Use bullet points when appropriate and highlight important concepts.",
  },
  {
    icon: MessageSquare,
    title: "AI Tutor Chat",
    description: "Ask questions about your coursework",
    color: "text-accent",
    bgColor: "bg-accent/10",
    systemPrompt: "You are a helpful tutor who explains concepts clearly and patiently. Break down complex topics into understandable parts, provide examples, and encourage learning.",
  },
  {
    icon: Clock,
    title: "Time Estimator",
    description: "Predict how long assignments will take",
    color: "text-warning",
    bgColor: "bg-warning/10",
    systemPrompt: "You are a time estimation expert for academic work. Based on the assignment description, provide realistic time estimates broken down by task. Consider research, writing, editing, and review time.",
  },
];

const AiTools = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<typeof aiTools[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Study Tools
          </h1>
          <p className="text-muted-foreground">
            Supercharge your learning with AI-powered study assistants
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.title}
                className="cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/50"
                onClick={() => {
                  setSelectedTool(tool);
                  setDialogOpen(true);
                }}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {selectedTool && (
          <AIToolDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title={selectedTool.title}
            description={selectedTool.description}
            systemPrompt={selectedTool.systemPrompt}
          />
        )}
      </div>
    </Layout>
  );
};

export default AiTools;
