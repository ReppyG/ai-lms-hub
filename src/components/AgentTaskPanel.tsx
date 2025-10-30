import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Result copied to clipboard!");
      
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // Set new timeout
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const parseResultForDisplay = (result: any) => {
    const formattedResult = formatResult(result);
    try {
      const parsed = JSON.parse(formattedResult);
      return { type: 'json', content: parsed, raw: formattedResult };
    } catch {
      return { type: 'text', content: formattedResult, raw: formattedResult };
    }
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
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {selectedTask && formatTaskType(selectedTask.task_type)}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {selectedTask?.prompt}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedTask && copyToClipboard(parseResultForDisplay(selectedTask.result).raw)}
                className="ml-4"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          
          {selectedTask && (() => {
            const displayData = parseResultForDisplay(selectedTask.result);
            
            return (
              <Tabs defaultValue="formatted" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="formatted">Formatted View</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="formatted" className="mt-4">
                  <ScrollArea className="h-[55vh]">
                    {displayData.type === 'json' && displayData.content && typeof displayData.content === 'object' ? (
                      <div className="space-y-3 pr-4">
                        {Object.entries(displayData.content).map(([key, value]) => (
                          <div key={key} className="border rounded-lg p-4 bg-card">
                            <div className="font-semibold text-sm text-primary mb-2 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm">
                              {typeof value === 'object' && value !== null ? (
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <div className="whitespace-pre-wrap break-words">
                                  {String(value)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none pr-4">
                        <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap break-words">
                          {displayData.content}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="raw" className="mt-4">
                  <ScrollArea className="h-[55vh]">
                    <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-lg font-mono pr-4">
                      {displayData.raw}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            );
          })()}
          
          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <span>
              Created: {selectedTask && new Date(selectedTask.created_at).toLocaleString()}
            </span>
            {selectedTask?.completed_at && (
              <span>
                Completed: {new Date(selectedTask.completed_at).toLocaleString()}
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
