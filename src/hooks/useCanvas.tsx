import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./useAuth";

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
  const { user } = useAuth();
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("canvas-integration", {
        body: { action: "courses" },
      });

      if (error) {
        console.error("Error fetching Canvas courses:", error);
        toast({
          title: "Canvas Connection Error",
          description: "Failed to fetch Canvas data. Try reconfiguring your Canvas credentials or generating a new Canvas API key if your old one expired.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error("Canvas API error:", data.error);
        toast({
          title: "Canvas Error",
          description: "Invalid Canvas credentials. Try reconfiguring your Canvas credentials or generating a new Canvas API key.",
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
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("canvas-integration", {
        body: { action: "assignments" },
      });

      if (error) {
        console.error("Error fetching Canvas assignments:", error);
        toast({
          title: "Canvas Connection Error",
          description: "Failed to fetch Canvas assignments. Try reconfiguring your Canvas credentials or generating a new Canvas API key if your old one expired.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error("Canvas API error:", data.error);
        toast({
          title: "Canvas Error",
          description: "Invalid Canvas credentials. Try reconfiguring your Canvas credentials or generating a new Canvas API key.",
          variant: "destructive",
        });
        return;
      }

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
    if (user) {
      fetchCourses();
      fetchAssignments();
    }
  }, [user]);

  return { courses, assignments, loading, refetch: () => { fetchCourses(); fetchAssignments(); } };
};
