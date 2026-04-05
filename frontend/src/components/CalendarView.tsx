
import { useState } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  venueName?: string;
  eventType: string;
}

interface CalendarViewProps {
  events: Event[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get days of the week for display
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      return (date >= start && date <= end) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Main Calendar Card */}
      <div className="lg:col-span-8 bento-card p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-on-surface">{format(currentDate, "MMMM yyyy")}</h2>
            <p className="text-sm text-muted-foreground mt-1">Select a date to view scheduled events</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container rounded-xl p-1 border border-border/50">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-bright text-muted-foreground hover:text-on-surface transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-xs font-bold text-on-surface hover:bg-surface-bright rounded-lg transition-colors"
            >
              Today
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-bright text-muted-foreground hover:text-on-surface transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-border/20 border border-border/40">
          {weekDays.map(day => (
            <div key={day} className="bg-surface-container/50 py-3 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{day}</span>
            </div>
          ))}
          
          {/* Empty cells for previous month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`prev-${i}`} className="bg-surface-low/30 h-24 sm:h-32 p-2 opacity-30" />
          ))}

          {/* Actual month days */}
          {monthDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "bg-surface-low h-24 sm:h-32 p-2 border-t border-l border-border/10 cursor-pointer transition-all duration-200 group relative",
                  isSelected ? "bg-primary/5 ring-2 ring-primary/40 ring-inset z-10" : "hover:bg-surface-container/40"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                    isToday ? "bg-primary text-primary-foreground" : isSelected ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map(event => (
                    <div 
                      key={event.id}
                      className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary truncate leading-tight"
                    >
                      {event.name}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-bold text-muted-foreground pl-1">
                      + {dayEvents.length - 2} more
                    </div>
                  )}
                </div>
                
                {dayEvents.length > 0 && !isSelected && (
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                )}
              </div>
            );
          })}

          {/* Empty cells for next month */}
          {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
            <div key={`next-${i}`} className="bg-surface-low/30 h-24 sm:h-32 p-2 opacity-30" />
          ))}
        </div>
      </div>

      {/* Sidebar: Selected Day Details */}
      <div className="lg:col-span-4 space-y-6 animate-slide-in">
        <div className="bento-card p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
              <span className="text-[10px] font-black uppercase text-primary leading-none">{selectedDate ? format(selectedDate, "MMM") : "-"}</span>
              <span className="text-lg font-black text-primary leading-tight">{selectedDate ? format(selectedDate, "d") : "-"}</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface">{selectedDate ? format(selectedDate, "EEEE") : "Select a date"}</h3>
              <p className="text-xs text-muted-foreground">{selectedDayEvents.length} events scheduled</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
            {selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <CalendarIcon className="w-12 h-12 mb-4" />
                <p className="text-sm font-medium">No events for this day</p>
              </div>
            ) : (
              selectedDayEvents.map(event => (
                <div key={event.id} className="group p-4 rounded-2xl border border-border/40 bg-surface-bright/30 hover:border-primary/30 hover:bg-surface-bright transition-all duration-300">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                      {event.eventType}
                    </span>
                    <button className="text-muted-foreground hover:text-primary transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors">{event.name}</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{event.startDate} — {event.endDate}</span>
                    </div>
                    {event.venueName && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{event.venueName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedDayEvents.length > 0 && (
            <button className="mt-8 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              View All Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
