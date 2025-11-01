import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X, Zap, FileText, HelpCircle, Calendar, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCanvasContext } from "@/contexts/CanvasContext";
import { cn } from "@/lib/utils";

const quickActions = [
  { icon: FileText, label: "Summarize Notes", color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" },
  { icon: HelpCircle, label: "Create Quiz", color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20" },
  { icon: Sparkles, label: "Explain Concept", color: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20" },
  { icon: Calendar, label: "Study Plan", color: "bg-green-500/10 text-green-600 hover:bg-green-500/20" },
];

const placeholders = [
  "Explain photosynthesis in simple terms...",
  "Summarize my lecture notes from biology...",
  "Help me create a study guide for my exam...",
  "Generate practice questions for Chapter 5...",
];

export const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { toast } = useToast();
  const { courses, assignments } = useCanvasContext();

  // Rotate placeholder text
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

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
      {/* Enhanced Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-glow-lg z-50 group relative overflow-hidden"
        size="icon"
      >
        <div className="absolute inset-0 gradient-primary animate-pulse-glow" />
        <div className="absolute inset-0 animated-gradient opacity-50" />
        <Sparkles className="h-7 w-7 text-white relative z-10 group-hover:rotate-180 transition-transform duration-500 drop-shadow-lg" />
      </Button>

      {/* Enhanced Backdrop with Blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Enhanced Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ml-64 pointer-events-none">
          <div 
            className="pointer-events-auto w-full max-w-[1000px] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-b from-background to-muted/30 rounded-[1.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.1)] backdrop-blur-xl border border-border/50 overflow-hidden">
              {/* Gradient Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
              
              {/* Content */}
              <div className="relative p-8 space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl gradient-primary opacity-20 blur-xl animate-pulse-glow" />
                      <div className="relative h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-lg animate-float">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                        Your Personal AI Assistant
                      </h3>
                      <p className="text-base text-muted-foreground animate-fade-in">
                        Ask me anything about your coursework and studies
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Enhanced Agent Mode Toggle */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-card border border-border/50 hover-lift">
                      <span className="text-sm font-medium text-foreground">Agent Mode</span>
                      <div className="relative">
                        <Switch 
                          checked={agentMode} 
                          onCheckedChange={setAgentMode}
                          className={cn(
                            "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-secondary",
                            agentMode && "shadow-glow"
                          )}
                        />
                        {agentMode && (
                          <div className="absolute -top-1 -right-1">
                            <Zap className="h-3 w-3 text-primary animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Close Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:scale-110 hover:rotate-90 transition-all duration-300 group"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Agent Mode Info Banner */}
                {agentMode && (
                  <div className="p-4 rounded-xl glass-card border-l-4 border-primary shadow-md animate-fade-in bg-gradient-to-r from-primary/10 to-secondary/5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg gradient-primary shadow-glow">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary mb-1">Premium Agent Mode Active</p>
                        <p className="text-sm text-muted-foreground">
                          I can create assignments, organize your schedule, and perform complex background tasks automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Response Area */}
                {response && (
                  <div className="p-6 rounded-xl glass-card border border-border/50 max-h-[300px] overflow-y-auto animate-fade-in space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg gradient-secondary flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">AI Response</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{response}</p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && !response && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fade-in">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-xl animate-pulse" />
                      <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      {agentMode ? "Agent is working on your task..." : "Thinking deeply..."}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                {!isLoading && !response && (
                  <div className="space-y-3 animate-fade-in">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.label}
                            onClick={() => setInput(`Help me: ${action.label.toLowerCase()}`)}
                            className={cn(
                              "p-4 rounded-xl border border-border/50 transition-all duration-300 hover-lift text-left group",
                              action.color
                            )}
                          >
                            <Icon className="h-5 w-5 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-medium">{action.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enhanced Input Area */}
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder={placeholders[placeholderIndex]}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      className="min-h-[120px] text-base resize-none rounded-2xl border-2 border-border/50 focus:border-primary/50 bg-background/50 backdrop-blur-sm shadow-inner transition-all duration-300 focus:shadow-glow pr-20"
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                      {input.length > 0 && `${input.length} characters`}
                    </div>
                  </div>
                  
                  {/* Enhanced Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
                    className="w-full h-16 text-lg font-semibold rounded-2xl shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_100%] animate-shimmer" />
                    <div className="relative flex items-center justify-center gap-3">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{agentMode ? "Working on it..." : "Thinking..."}</span>
                        </>
                      ) : (
                        <>
                          {agentMode ? (
                            <Zap className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                          ) : (
                            <Sparkles className="w-5 h-5 group-hover:scale-110 group-hover:rotate-180 transition-transform duration-500" />
                          )}
                          <span>{agentMode ? "Execute Task" : "Ask AI"}</span>
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
