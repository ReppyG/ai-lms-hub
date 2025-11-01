import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCanvasContext } from "@/contexts/CanvasContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const Calendar = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { assignments, loading: canvasLoading } = useCanvasContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getAssignmentsForDay = (day: number) => {
    return assignments.filter(assignment => {
      if (!assignment.due_at) return false;
      const dueDate = new Date(assignment.due_at);
      return dueDate.getDate() === day &&
             dueDate.getMonth() === month &&
             dueDate.getFullYear() === year;
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getColorForAssignment = (dueDate: string) => {
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return "bg-destructive"; // Overdue - red
    if (daysUntil <= 2) return "bg-warning"; // Due very soon - yellow/orange
    if (daysUntil <= 7) return "bg-secondary"; // Due soon - blue
    return "bg-success"; // Due later - green
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
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-5xl font-bold mb-2 flex items-center gap-3 text-gradient">
              <div className="p-3 rounded-2xl gradient-primary shadow-glow-lg animate-pulse-glow">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              Calendar
            </h1>
            <p className="text-lg text-muted-foreground">
              View your assignments and events in calendar view
            </p>
          </div>
          <div className="flex items-center gap-3 glass-card p-2 rounded-xl shadow-md">
            <Button 
              variant="outline" 
              size="icon"
              onClick={previousMonth}
              className="hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-xl font-bold px-6">{monthName}</span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={nextMonth}
              className="hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="mb-4 flex gap-4 items-center">
          <span className="text-sm font-medium">Color Legend:</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive"></div>
              <span className="text-xs">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning"></div>
              <span className="text-xs">Due in 1-2 days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary"></div>
              <span className="text-xs">Due in 3-7 days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success"></div>
              <span className="text-xs">Due later</span>
            </div>
          </div>
        </div>

        <Card className="p-6 glass-card shadow-lg">
          <div className="grid grid-cols-7 gap-4 mb-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-bold text-base text-muted-foreground tracking-wide">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: startingDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayAssignments = getAssignmentsForDay(day);
              const isToday = day === new Date().getDate() && 
                             month === new Date().getMonth() && 
                             year === new Date().getFullYear();
              
              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square p-3 rounded-xl border-2 transition-all duration-300 relative group cursor-pointer",
                    isToday
                      ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-glow'
                      : dayAssignments.length > 0
                      ? 'border-border/50 hover:border-primary/50 hover:bg-muted/50 hover-lift'
                      : 'border-border/30 hover:border-border hover:bg-muted/30'
                  )}
                >
                  {isToday && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
                  )}
                  <div className={cn(
                    "text-base font-bold mb-2 relative",
                    isToday ? 'text-primary' : 'text-foreground'
                  )}>
                    {day}
                    {dayAssignments.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shadow-glow animate-pulse">
                        {dayAssignments.length}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden relative">
                    {dayAssignments.slice(0, 2).map((assignment) => (
                      <div
                        key={assignment.id}
                        className={cn(
                          "text-xs px-2 py-1 rounded-lg text-white font-medium truncate cursor-pointer transition-all hover:scale-105 shadow-sm",
                          getColorForAssignment(assignment.due_at!)
                        )}
                        title={assignment.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/assignments', { state: { scrollToId: assignment.id } });
                        }}
                      >
                        {assignment.name}
                      </div>
                    ))}
                    {dayAssignments.length > 2 && (
                      <div 
                        className="text-xs text-primary font-semibold cursor-pointer hover:text-primary-dark transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/assignments');
                        }}
                      >
                        +{dayAssignments.length - 2} more →
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Calendar;
