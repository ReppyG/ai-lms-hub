import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCanvasContext } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Calculator, 
  Brain,
  Calendar,
  Loader2
} from "lucide-react";

interface StudyTool {
  id: string;
  title: string;
  description: string;
  icon: any;
  taskType: string;
  placeholder: string;
  color: string;
}

const studyTools: StudyTool[] = [
  {
    id: 'study_plan',
    title: 'Study Plan Generator',
    description: 'Create adaptive study plans based on your assignments',
    icon: Calendar,
    taskType: 'study_plan',
    placeholder: 'E.g., "Create a study plan for my upcoming Chemistry exam covering chapters 5-8"',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  {
    id: 'summarize',
    title: 'Assignment Summarizer',
    description: 'Get concise summaries with key points and examples',
    icon: FileText,
    taskType: 'summarize_notes',
    placeholder: 'Paste your notes or lecture content here to summarize...',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  },
  {
    id: 'quiz',
    title: 'Quiz Generator',
    description: 'Create quizzes and flashcards from your notes',
    icon: HelpCircle,
    taskType: 'generate_quiz',
    placeholder: 'E.g., "Create a 10-question quiz on photosynthesis"',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400'
  },
  {
    id: 'solver',
    title: 'Problem Solver',
    description: 'Step-by-step solutions for STEM problems',
    icon: Calculator,
    taskType: 'solve_problem',
    placeholder: 'Paste your math/science problem here...',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
  },
  {
    id: 'flashcards',
    title: 'Flashcard Creator',
    description: 'Generate study flashcards automatically',
    icon: Brain,
    taskType: 'create_flashcards',
    placeholder: 'E.g., "Create flashcards for World War II key events"',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
  },
  {
    id: 'analyze',
    title: 'Assignment Analyzer',
    description: 'Get priority rankings and study tips',
    icon: BookOpen,
    taskType: 'analyze_assignments',
    placeholder: 'Analyzing your current assignments...',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
  }
];

export function StudyToolsGrid() {
  const [selectedTool, setSelectedTool] = useState<StudyTool | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { assignments } = useCanvasContext();

  const handleSubmit = async () => {
    if (!input.trim() && selectedTool?.id !== 'analyze') {
      toast.error("Please enter your prompt");
      return;
    }

    setLoading(true);
    try {
      // Get context for certain task types
      let context = undefined;
      if (selectedTool?.id === 'analyze' || selectedTool?.id === 'study_plan') {
        context = { assignments };
      }

      const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: {
          taskType: selectedTool?.taskType,
          prompt: input || selectedTool?.placeholder,
          context
        }
      });

      if (error) throw error;

      toast.success(`${selectedTool?.title} task started!`, {
        description: "Check the Agent Tasks panel for results"
      });
      
      setSelectedTool(null);
      setInput("");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Failed to start task", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card 
              key={tool.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTool(tool)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Try Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTool?.title}</DialogTitle>
            <DialogDescription>
              {selectedTool?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTool?.id !== 'analyze' && (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedTool?.placeholder}
                rows={6}
                className="resize-none"
              />
            )}

            {selectedTool?.id === 'analyze' && (
              <div className="text-sm text-muted-foreground">
                <p>This will analyze all your current assignments from Canvas.</p>
                <p className="mt-2">Found: {assignments.length} assignments</p>
              </div>
            )}

            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
