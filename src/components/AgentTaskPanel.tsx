import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AgentTask {
  id: string;
  task_type: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export function AgentTaskPanel() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
      
      // Subscribe to task updates
      const channel = supabase
        .channel('agent_tasks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_tasks',
            filter: `user_id=eq.${user.id}`
          },
          () => loadTasks()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    setTasks(data || []);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      case 'running': return 'default';
      default: return 'secondary';
    }
  };

  const formatTaskType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const viewResult = (task: AgentTask) => {
    if (!task.result) return;
    setSelectedTask(task);
    setResultDialogOpen(true);
  };

  const formatResult = (result: any) => {
    if (typeof result === 'string') {
      return result;
    }
    if (result?.content) {
      // Remove markdown code blocks if present
      let content = result.content;
      if (content.includes('```json')) {
        content = content.replace(/```json\n/g, '').replace(/```/g, '');
      }
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
    }
    return JSON.stringify(result, null, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Agent Tasks</CardTitle>
        </div>
        <CardDescription>
          Your automated study assistant tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tasks yet. Try using the AI assistant to create some!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="font-medium text-sm">
                        {formatTaskType(task.task_type)}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(task.status) as any}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.prompt}
                  </p>

                  {task.error_message && (
                    <p className="text-sm text-destructive">
                      Error: {task.error_message}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.created_at).toLocaleString()}
                    </span>
                    
                    {task.status === 'completed' && task.result && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewResult(task)}
                      >
                        View Result
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedTask && formatTaskType(selectedTask.task_type)}</DialogTitle>
            <DialogDescription>
              {selectedTask?.prompt}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {selectedTask && formatResult(selectedTask.result)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
