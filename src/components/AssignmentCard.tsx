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
  
  const getDaysUntil = () => {
    if (!dueDate) return null;
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };
  
  const daysUntil = getDaysUntil();

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canvasUrl && assignment.id) {
      window.open(`${canvasUrl}/courses/${assignment.course_id}/assignments/${assignment.id}`, '_blank');
    }
  };

  const getBorderColor = () => {
    if (assignment.status === "overdue") return "border-l-4 border-l-destructive";
    if (assignment.status === "todo") return "border-l-4 border-l-warning";
    if (assignment.status === "upcoming") return "border-l-4 border-l-secondary";
    return "border-l-4 border-l-success";
  };

  return (
    <Card className={cn(
      "hover-lift glass-card group relative overflow-hidden",
      getBorderColor()
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {assignment.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium">
                {assignment.courseName}
              </Badge>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "shrink-0 shadow-sm",
              status.className,
              assignment.status === "overdue" && "animate-pulse-glow"
            )}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 relative">
        {dueDate && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">{dueDate.toLocaleDateString()}</span>
            </div>
            {daysUntil !== null && (
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                daysUntil < 0 ? "bg-destructive/20 text-destructive" :
                daysUntil <= 2 ? "bg-warning/20 text-warning" :
                "bg-success/20 text-success"
              )}>
                {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : 
                 daysUntil === 0 ? "Due today" :
                 daysUntil === 1 ? "Due tomorrow" :
                 `${daysUntil}d left`}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{assignment.points_possible} points</span>
        </div>
        
        {canvasUrl && assignment.id && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            onClick={handleCanvasClick}
          >
            <ExternalLink className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
            Open in Canvas
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
