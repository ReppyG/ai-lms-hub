import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCanvasContext } from "@/contexts/CanvasContext";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Calendar, Clock } from "lucide-react";

const Assignments = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { assignments, courses, loading: canvasLoading } = useCanvasContext();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const getCourseName = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.course_code} - ${course.name}` : "Unknown Course";
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (dueDate: string | null) => {
    if (!dueDate) return <Badge variant="secondary">No Due Date</Badge>;
    
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return <Badge variant="destructive">Overdue</Badge>;
    if (daysUntil === 0) return <Badge className="bg-warning text-white">Due Today</Badge>;
    if (daysUntil === 1) return <Badge className="bg-warning text-white">Due Tomorrow</Badge>;
    if (daysUntil <= 7) return <Badge className="bg-secondary text-white">Due in {daysUntil} days</Badge>;
    return <Badge className="bg-success text-white">Upcoming</Badge>;
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

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
          <h1 className="text-4xl font-bold mb-2">Assignments</h1>
          <p className="text-muted-foreground">
            View and manage all your course assignments from Canvas
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {canvasLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading assignments from Canvas...</p>
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No assignments found. Make sure you've configured your Canvas settings.
            </p>
            <Button onClick={() => navigate("/settings")}>
              Configure Canvas
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{assignment.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getCourseName(assignment.course_id)}
                    </p>
                  </div>

                  {assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {assignment.due_at 
                        ? new Date(assignment.due_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No due date'}
                    </span>
                  </div>

                  {assignment.due_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {new Date(assignment.due_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {getStatusBadge(assignment.due_at)}
                    <span className="text-sm font-medium">
                      {assignment.points_possible} pts
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Assignments;
