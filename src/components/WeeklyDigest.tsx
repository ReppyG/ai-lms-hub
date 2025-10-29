import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, Clock, Target, Lightbulb, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DigestData {
  weekOf: string;
  statistics: {
    totalStudyTime: number;
    aiToolsUsed: number;
    topicsCovered: string[];
    completedTasks: number;
  };
  insights: string;
  generatedAt: string;
}

export function WeeklyDigest() {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateDigest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-digest');
      
      if (error) throw error;
      
      setDigest(data);
      toast.success("Weekly digest generated!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Failed to generate digest", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Study Digest
            </CardTitle>
            <CardDescription>
              Your personalized study insights and recommendations
            </CardDescription>
          </div>
          <Button 
            onClick={generateDigest} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Digest'
            )}
          </Button>
        </div>
      </CardHeader>
      
      {digest && (
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Study Time
              </div>
              <p className="text-2xl font-bold">
                {Math.round(digest.statistics.totalStudyTime / 60)}h
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Tasks Done
              </div>
              <p className="text-2xl font-bold">
                {digest.statistics.completedTasks}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                AI Tools
              </div>
              <p className="text-2xl font-bold">
                {digest.statistics.aiToolsUsed}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Topics
              </div>
              <p className="text-2xl font-bold">
                {digest.statistics.topicsCovered.length}
              </p>
            </div>
          </div>

          {/* Topics Covered */}
          {digest.statistics.topicsCovered.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Topics Covered</h4>
              <div className="flex flex-wrap gap-2">
                {digest.statistics.topicsCovered.map((topic, i) => (
                  <Badge key={i} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Insights & Recommendations
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {digest.insights}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Generated {new Date(digest.generatedAt).toLocaleString()}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
