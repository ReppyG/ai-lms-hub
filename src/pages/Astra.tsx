import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Astra() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExecutiveBriefing();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadExecutiveBriefing = async () => {
    if (!user) return;

    try {
      const { data: config } = await supabase
        .from('astra_config')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'last_autonomous_run_summary')
        .single();

      const { data: priorityTasks } = await supabase
        .from('event_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_type', 'PRIORITY_TASK')
        .eq('is_read', false)
        .order('priority', { ascending: false })
        .limit(5);

      const { data: briefingItems } = await supabase
        .from('event_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_type', 'BRIEFING')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (config || priorityTasks?.length || briefingItems?.length) {
        const briefingMessage = formatExecutiveBriefing(
          config?.value,
          priorityTasks || [],
          briefingItems || []
        );

        setMessages([{ role: 'assistant', content: briefingMessage }]);
        setShowWelcome(false);

        // Clear the autonomous run summary
        if (config) {
          await supabase
            .from('astra_config')
            .delete()
            .eq('user_id', user.id)
            .eq('key', 'last_autonomous_run_summary');
        }
      }
    } catch (error) {
      console.error('Failed to load briefing:', error);
    }
  };

  const formatExecutiveBriefing = (summary: any, priorityTasks: any[], briefingItems: any[]) => {
    let briefing = "👑 **Executive Briefing**\n\n";

    if (summary) {
      briefing += "**Autonomous Actions Completed:**\n";
      if (summary.booked?.length) {
        briefing += `✅ Scheduled ${summary.booked.length} study sessions\n`;
      }
      if (summary.researched?.length) {
        briefing += `🔍 Researched ${summary.researched.length} assignments\n`;
      }
      if (summary.created_docs?.length) {
        briefing += `📄 Created ${summary.created_docs.length} documents\n`;
      }
      if (summary.drafted?.length) {
        briefing += `✉️ Drafted ${summary.drafted.length} professor emails\n`;
      }
      briefing += "\n";
    }

    if (priorityTasks.length > 0) {
      briefing += "🔴 **Priority Tasks (Due Today):**\n";
      priorityTasks.forEach(task => {
        briefing += `• ${task.data.title || 'Unnamed task'}\n`;
      });
      briefing += "\n";
    }

    if (briefingItems.length > 0) {
      briefing += "🔵 **Astra Briefing (New Updates):**\n";
      briefingItems.forEach(item => {
        briefing += `• ${item.data.message || 'New notification'}\n`;
      });
      briefing += "\n";
    }

    briefing += "How can I assist you today?";
    return briefing;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowWelcome(false);

    try {
      const { data, error } = await supabase.functions.invoke('astra-agent', {
        body: {
          messages: [...messages, userMessage],
          conversationId
        }
      });

      if (error) throw error;

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error: any) {
      console.error('Astra error:', error);
      toast.error(error.message || 'Failed to get response');
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-2rem)] flex flex-col p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold">Astra</h1>
          </div>
          <span className="text-sm text-muted-foreground">Autonomous Academic Agent</span>
        </div>

        {/* Welcome Screen */}
        {showWelcome && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-2xl">
              <Sparkles className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <h2 className="text-2xl font-semibold">Welcome to Astra</h2>
              <p className="text-muted-foreground">
                Your autonomous academic chief of staff. I proactively manage your courses,
                schedule study sessions, monitor grades, and provide AI-powered insights.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleQuickPrompt("What's on my dashboard today?")}
                >
                  📊 What's on my dashboard?
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickPrompt("How am I doing in my classes?")}
                >
                  📈 How am I doing?
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickPrompt("What assignments are due soon?")}
                >
                  📝 Upcoming assignments
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
            <div className="space-y-4 pr-4">
              {messages.map((message, index) => (
                <Card
                  key={index}
                  className={`p-4 ${
                    message.role === 'user'
                      ? 'bg-primary/10 ml-12'
                      : 'bg-muted mr-12'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <Sparkles className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 whitespace-pre-wrap">{message.content}</div>
                  </div>
                </Card>
              ))}
              {loading && (
                <Card className="p-4 bg-muted mr-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Astra is thinking...</span>
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Astra anything about your academics..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
