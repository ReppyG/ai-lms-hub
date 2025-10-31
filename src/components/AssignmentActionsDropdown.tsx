import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, BookOpen, FileText, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AssignmentActionsDropdownProps {
  assignment: {
    id: number;
    name: string;
    description?: string;
    course_id: number;
  };
  onComplete?: () => void;
}

export const AssignmentActionsDropdown = ({ assignment, onComplete }: AssignmentActionsDropdownProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAIAction = async (taskType: string, prompt: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: {
          taskType,
          prompt,
          context: {
            assignmentName: assignment.name,
            assignmentDescription: assignment.description || "",
          },
        },
      });

      if (error) throw error;

      toast({
        title: "AI Task Started",
        description: "Your request is being processed. Check the Agent Dashboard for results.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoNotes = () => {
    handleAIAction(
      "analyze",
      `Create comprehensive study notes for the assignment: "${assignment.name}". ${assignment.description ? `Description: ${assignment.description}` : ""}`
    );
  };

  const handleEstimateTime = () => {
    handleAIAction(
      "analyze",
      `Estimate how long it will take to complete this assignment: "${assignment.name}". ${assignment.description ? `Description: ${assignment.description}` : ""} Provide a realistic time estimate with breakdown.`
    );
  };

  const handleSummarize = () => {
    handleAIAction(
      "summarize",
      `Summarize this assignment: "${assignment.name}". ${assignment.description ? `Description: ${assignment.description}` : ""}`
    );
  };

  const handleGenerateOutline = () => {
    handleAIAction(
      "outline",
      `Generate an essay outline for this assignment: "${assignment.name}". ${assignment.description ? `Description: ${assignment.description}` : ""}`
    );
  };

  const handleMarkComplete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("assignment_completions")
        .upsert({
          user_id: user.id,
          assignment_id: assignment.id.toString(),
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Assignment Completed!",
        description: "Great job! Keep up the good work.",
      });
      
      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full" disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? "Processing..." : "AI Tools"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem onClick={handleAutoNotes}>
          <BookOpen className="w-4 h-4 mr-2" />
          Auto-Generate Notes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEstimateTime}>
          <Clock className="w-4 h-4 mr-2" />
          Estimate Time
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSummarize}>
          <FileText className="w-4 h-4 mr-2" />
          Summarize
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGenerateOutline}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Outline
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMarkComplete}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark Complete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
