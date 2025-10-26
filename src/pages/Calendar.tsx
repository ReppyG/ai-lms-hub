import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const Calendar = () => {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
            <Button variant="outline" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold px-4">{monthName}</span>
            <Button variant="outline" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
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
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2; // Offset for month start
              const isCurrentMonth = day >= 1 && day <= 31;
              const isToday = day === currentDate.getDate();
              
              return (
                <div
                  key={i}
                  className={`aspect-square p-2 rounded-lg border ${
                    isToday
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border hover:bg-muted/30'
                  } ${!isCurrentMonth && 'opacity-30'} cursor-pointer transition-all`}
                >
                  <div className={`text-sm font-medium ${isToday && 'text-primary'}`}>
                    {isCurrentMonth ? day : ''}
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
