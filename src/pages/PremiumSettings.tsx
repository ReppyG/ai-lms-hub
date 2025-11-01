import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function PremiumSettings() {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [preferredModel, setPreferredModel] = useState('google/gemini-2.5-flash');
  const [preferredVoice, setPreferredVoice] = useState('9BWtsMINqrJLrRacOk9x');
  const [enableMemory, setEnableMemory] = useState(true);
  const [enableProactive, setEnableProactive] = useState(false);
  const [maxTokens, setMaxTokens] = useState(4000);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading preferences:', error);
      return;
    }

    if (data) {
      setPreferences(data);
      setCustomInstructions(data.custom_instructions || '');
      setPreferredModel(data.preferred_model || 'google/gemini-2.5-flash');
      setPreferredVoice(data.preferred_voice || '9BWtsMINqrJLrRacOk9x');
      setEnableMemory(data.enable_memory ?? true);
      setEnableProactive(data.enable_proactive_suggestions ?? false);
      setMaxTokens(data.max_tokens || 4000);
    }
  };

  const savePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const preferencesData = {
      user_id: user.id,
      custom_instructions: customInstructions,
      preferred_model: preferredModel,
      preferred_voice: preferredVoice,
      enable_memory: enableMemory,
      enable_proactive_suggestions: enableProactive,
      max_tokens: maxTokens
    };

    let error;
    if (preferences) {
      const result = await supabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('user_preferences')
        .insert(preferencesData);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Preferences saved successfully'
    });

    loadPreferences();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Premium Settings</h1>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card className="p-6 space-y-6">
              <div>
                <Label htmlFor="model">Preferred Model</Label>
                <Select value={preferredModel} onValueChange={setPreferredModel}>
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Most capable)</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fast)</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5 (Advanced reasoning)</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (Cost-effective)</SelectItem>
                    <SelectItem value="openai/gpt-5-nano">GPT-5 Nano (Ultra-fast)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the AI model that best fits your needs
                </p>
              </div>

              <div>
                <Label htmlFor="custom">Custom Instructions</Label>
                <Textarea
                  id="custom"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Enter custom instructions for the AI assistant..."
                  rows={6}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Add context about yourself, preferences, or special requirements
                </p>
              </div>

              <div>
                <Label htmlFor="tokens">Max Tokens per Response</Label>
                <Input
                  id="tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  min={1000}
                  max={8000}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Higher values allow longer responses (1000-8000)
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="behavior">
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memory">Long-term Memory</Label>
                  <p className="text-sm text-muted-foreground">
                    Remember context across conversations
                  </p>
                </div>
                <Switch
                  id="memory"
                  checked={enableMemory}
                  onCheckedChange={setEnableMemory}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="proactive">Proactive Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    AI suggests actions based on context
                  </p>
                </div>
                <Switch
                  id="proactive"
                  checked={enableProactive}
                  onCheckedChange={setEnableProactive}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="voice">
            <Card className="p-6 space-y-6">
              <div>
                <Label htmlFor="voice">Preferred Voice</Label>
                <Select value={preferredVoice} onValueChange={setPreferredVoice}>
                  <SelectTrigger id="voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9BWtsMINqrJLrRacOk9x">Aria (Female, Warm)</SelectItem>
                    <SelectItem value="CwhRBWXzGAHq8TQ4Fs17">Roger (Male, Professional)</SelectItem>
                    <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah (Female, Friendly)</SelectItem>
                    <SelectItem value="FGY2WhTYpPnrIDTdsKH5">Laura (Female, Clear)</SelectItem>
                    <SelectItem value="IKne3meq5aSn9XLyUdCD">Charlie (Male, Casual)</SelectItem>
                    <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George (Male, Deep)</SelectItem>
                    <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam (Male, Young)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Voice for text-to-speech features
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button onClick={savePreferences} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}