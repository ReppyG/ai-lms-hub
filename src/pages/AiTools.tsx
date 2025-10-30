import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { StudyToolsGrid } from "@/components/StudyToolsGrid";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const AiTools = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Study Tools
          </h1>
          <p className="text-muted-foreground">
            Supercharge your learning with AI-powered study assistants
          </p>
        </div>

        <StudyToolsGrid />
      </div>
    </Layout>
  );
};

export default AiTools;
