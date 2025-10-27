import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Settings as SettingsIcon, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [canvasUrl, setCanvasUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [sampleMode, setSampleMode] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const savedUrl = localStorage.getItem("canvas_url");
    const savedToken = localStorage.getItem("canvas_token");
    if (savedUrl) setCanvasUrl(savedUrl);
    if (savedToken) setApiToken(savedToken);
  }, []);

  const handleSave = () => {
    localStorage.setItem("canvas_url", canvasUrl);
    localStorage.setItem("canvas_token", apiToken);
    toast({
      title: "Settings saved!",
      description: "Your Canvas integration settings have been updated.",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your Canvas LMS connection and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Canvas Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Canvas LMS Integration
              </CardTitle>
              <CardDescription>
                Connect your Canvas account to sync courses and assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="canvas-url">Canvas URL</Label>
                <Input
                  id="canvas-url"
                  placeholder="https://your-institution.instructure.com"
                  value={canvasUrl}
                  onChange={(e) => setCanvasUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your institution's Canvas URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-token">API Access Token</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Enter your Canvas API token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Generate a token from Canvas Account → Settings → New Access Token
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="sample-mode">Sample Data Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Use sample data for testing without Canvas connection
                  </p>
                </div>
                <Switch
                  id="sample-mode"
                  checked={sampleMode}
                  onCheckedChange={setSampleMode}
                />
              </div>

              <Button onClick={handleSave} className="w-full gradient-primary">
                Save Canvas Settings
              </Button>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Settings</CardTitle>
              <CardDescription>
                Configure your AI study assistant preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label>Enable AI Grounding</Label>
                  <p className="text-xs text-muted-foreground">
                    Use web search for more accurate AI responses
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label>Auto-generate Study Plans</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically create study plans for new assignments
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
