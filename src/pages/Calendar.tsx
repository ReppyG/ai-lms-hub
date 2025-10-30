import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCanvasContext } from "@/contexts/CanvasContext";
import { useNavigate } from "react-router-dom";
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              Calendar
            </h1>
            <p className="text-muted-foreground">
              View your assignments and events in calendar view
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold px-4">{monthName}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
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

        <Card className="p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground">
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
                  className={`aspect-square p-2 rounded-lg border ${
                    isToday
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border hover:bg-muted/30'
                  } transition-all relative`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday && 'text-primary'}`}>
                    {day}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dayAssignments.slice(0, 3).map((assignment) => (
                      <div
                        key={assignment.id}
                        className={`text-xs px-1 py-0.5 rounded ${getColorForAssignment(assignment.due_at!)} text-white truncate cursor-pointer hover:opacity-80 transition-opacity`}
                        title={assignment.name}
                        onClick={() => navigate('/assignments', { state: { scrollToId: assignment.id } })}
                      >
                        {assignment.name}
                      </div>
                    ))}
                    {dayAssignments.length > 3 && (
                      <div 
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => navigate('/assignments')}
                      >
                        +{dayAssignments.length - 3} more
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
