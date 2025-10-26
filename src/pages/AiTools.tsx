import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Clock,
  Image,
  Video,
  Mic,
  Wand2,
  BookOpen,
  Brain,
  Palette,
} from "lucide-react";

const aiTools = [
  {
    icon: Brain,
    title: "Generate Study Plan",
    description: "AI-powered personalized study schedules",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Summarize Content",
    description: "Quick summaries of lectures and readings",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: MessageSquare,
    title: "AI Tutor Chat",
    description: "Ask questions about your coursework",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Clock,
    title: "Time Estimator",
    description: "Predict how long assignments will take",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Image,
    title: "Image Analysis",
    description: "Analyze diagrams and visual content",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Video,
    title: "Video Analysis",
    description: "Extract key points from lecture videos",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Palette,
    title: "Image Generation",
    description: "Create visual aids for presentations",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Wand2,
    title: "Image Editing",
    description: "Edit and enhance your images",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Mic,
    title: "Voice Transcription",
    description: "Convert speech to text notes",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: BookOpen,
    title: "Text-to-Speech",
    description: "Listen to your study materials",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const AiTools = () => {
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
      </div>
    </Layout>
  );
};

export default AiTools;
