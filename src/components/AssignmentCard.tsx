import { Assignment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignmentCardProps {
  assignment: Assignment;
  canvasUrl?: string;
}

const statusConfig = {
  todo: { label: "To Do", className: "bg-muted text-muted-foreground" },
  upcoming: { label: "Upcoming", className: "bg-secondary/20 text-secondary" },
  submitted: { label: "Submitted", className: "bg-primary/20 text-primary" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  overdue: { label: "Overdue", className: "bg-destructive/20 text-destructive" },
};

export const AssignmentCard = ({ assignment, canvasUrl }: AssignmentCardProps) => {
  const status = statusConfig[assignment.status];
  const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canvasUrl && assignment.id) {
      window.open(`${canvasUrl}/courses/${assignment.course_id}/assignments/${assignment.id}`, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-all border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {assignment.name}
          </CardTitle>
          <Badge variant="secondary" className={cn("shrink-0", status.className)}>
            {status.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {dueDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Due: {dueDate.toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{assignment.points_possible} points</span>
        </div>
        {canvasUrl && assignment.id && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={handleCanvasClick}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Canvas
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
