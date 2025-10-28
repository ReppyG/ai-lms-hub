import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string | null;
  points_possible: number;
  course_id: number;
}

export const useCanvas = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    const canvasUrl = localStorage.getItem("canvas_url");
    const apiToken = localStorage.getItem("canvas_token");

    if (!canvasUrl || !apiToken) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("canvas-integration", {
        body: { canvasUrl, apiToken, action: "courses" },
      });

      if (error) {
        console.error("Error fetching Canvas courses:", error);
        toast({
          title: "Canvas Connection Error",
          description: "Please configure your Canvas URL and API token in Settings.",
          variant: "destructive",
        });
        return;
      }

      // Check if the response indicates an error
      if (data?.error) {
        console.error("Canvas API error:", data.error);
        toast({
          title: "Canvas Error",
          description: "Invalid Canvas credentials. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      setCourses(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching courses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    const canvasUrl = localStorage.getItem("canvas_url");
    const apiToken = localStorage.getItem("canvas_token");

    if (!canvasUrl || !apiToken) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("canvas-integration", {
        body: { canvasUrl, apiToken, action: "assignments" },
      });

      if (error) {
        console.error("Error fetching Canvas assignments:", error);
        toast({
          title: "Canvas Connection Error",
          description: "Please configure your Canvas URL and API token in Settings.",
          variant: "destructive",
        });
        return;
      }

      // Check if the response indicates an error
      if (data?.error) {
        console.error("Canvas API error:", data.error);
        toast({
          title: "Canvas Error",
          description: "Invalid Canvas credentials. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      // Canvas todo endpoint returns array of objects with 'assignment' property
      // Extract assignments from the todo items
      const extractedAssignments = data?.map((item: any) => item.assignment || item) || [];
      setAssignments(extractedAssignments);
    } catch (error: any) {
      toast({
        title: "Error fetching assignments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  return { courses, assignments, loading, refetch: () => { fetchCourses(); fetchAssignments(); } };
};
