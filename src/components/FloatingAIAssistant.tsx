import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCanvasContext } from "@/contexts/CanvasContext";

export const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const { toast } = useToast();
  const { courses, assignments } = useCanvasContext();

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setResponse("");

    try {
      // Agent mode uses the agent function for task execution
      if (agentMode) {
        const { data, error } = await supabase.functions.invoke('ai-agent', {
          body: {
            taskType: 'general_assistant',
            prompt: input,
            context: {
              courses,
              assignments
            }
          }
        });

        if (error) throw error;

        const resultText = typeof data.result === 'string' ? data.result : data.result.content;
        setResponse(resultText);
        toast({
          title: "Task completed!",
          description: "Check the Agent Dashboard for detailed results",
        });
        setInput("");
      } else {
        // Regular chat mode with streaming
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            messages: [
              {
                role: "user",
                content: input,
              },
            ],
            context: {
              courses,
              assignments
            }
          },
        });

        if (error) throw error;

        const reader = data.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  setResponse(fullResponse);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
        setInput("");
      }
    } catch (error: any) {
      console.error("AI chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl gradient-primary z-50 hover:scale-110 transition-transform"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Darkened Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Integrated Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 ml-64 transition-all">
          <div className="bg-card border-t border-border shadow-lg p-6 max-w-4xl mx-auto rounded-t-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Your Personal AI Assistant
                    {agentMode && (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        Agent Mode
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about your coursework
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Agent Mode</span>
                  <Switch 
                    checked={agentMode} 
                    onCheckedChange={setAgentMode}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Agent Mode Description */}
            {agentMode && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Premium Agent Mode: I can create assignments, organize your schedule, and perform background tasks automatically.
                </p>
              </div>
            )}

            {/* Response Area */}
            {response && (
              <div className="mb-4 bg-muted p-4 rounded-lg max-h-[200px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{response}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !response && (
              <div className="mb-4 flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-3">
              <Textarea
                placeholder={
                  agentMode
                    ? "Tell me what task to complete (e.g., 'Create a study schedule for next week' or 'Organize my assignments by priority')..."
                    : "Ask me to explain a concept, summarize your notes, or help with any assignment..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="w-full gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {agentMode ? "Working on it..." : "Thinking..."}
                  </>
                ) : (
                  <>
                    {agentMode ? <Zap className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {agentMode ? "Execute Task" : "Ask AI"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
