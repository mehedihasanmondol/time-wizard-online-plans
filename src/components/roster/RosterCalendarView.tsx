
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users } from "lucide-react";
import { format, eachDayOfInterval, parseISO, isSameDay } from "date-fns";

interface RosterItem {
  id: string;
  name: string;
  date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  client_name?: string;
  project_name?: string;
  status: string;
  total_hours: number;
  expected_profiles: number;
  assigned_profiles?: number;
}

interface RosterCalendarViewProps {
  rosters: RosterItem[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export const RosterCalendarView = ({ rosters, onDateSelect, selectedDate }: RosterCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());

  // Split multi-day rosters into individual daily entries
  const expandedRosters = useMemo(() => {
    const expanded: (RosterItem & { displayDate: string })[] = [];

    rosters.forEach(roster => {
      if (roster.end_date && roster.end_date !== roster.date) {
        // Multi-day roster - split into individual days
        const startDate = parseISO(roster.date);
        const endDate = parseISO(roster.end_date);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        days.forEach(day => {
          expanded.push({
            ...roster,
            displayDate: format(day, 'yyyy-MM-dd'),
            id: `${roster.id}-${format(day, 'yyyy-MM-dd')}` // Unique ID for each day
          });
        });
      } else {
        // Single day roster
        expanded.push({
          ...roster,
          displayDate: roster.date
        });
      }
    });

    return expanded;
  }, [rosters]);

  // Get rosters for selected date
  const rostersForSelectedDate = expandedRosters.filter(roster => 
    selectedDate && isSameDay(parseISO(roster.displayDate), selectedDate)
  );

  // Get dates that have rosters for calendar highlighting
  const datesWithRosters = useMemo(() => {
    return expandedRosters.map(roster => parseISO(roster.displayDate));
  }, [expandedRosters]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      onDateSelect?.(date);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Roster Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={{
                hasRoster: datesWithRosters
              }}
              modifiersStyles={{
                hasRoster: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border"
            />
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Dates with roster items</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {rostersForSelectedDate.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No roster items for this date
                  </p>
                ) : (
                  rostersForSelectedDate.map((roster) => (
                    <div key={roster.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900">
                          {roster.name || 'Unnamed Roster'}
                        </h4>
                        <Badge className={getStatusColor(roster.status)}>
                          {roster.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {roster.start_time} - {roster.end_time} 
                            ({roster.total_hours}h)
                          </span>
                        </div>

                        {roster.client_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{roster.client_name}</span>
                          </div>
                        )}

                        {roster.project_name && (
                          <div className="text-sm">
                            <strong>Project:</strong> {roster.project_name}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {roster.assigned_profiles || 0} / {roster.expected_profiles} assigned
                          </span>
                        </div>

                        {/* Show if this is part of a multi-day roster */}
                        {roster.end_date && roster.end_date !== roster.date && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Part of multi-day roster: {roster.date} to {roster.end_date}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Click on a date to view roster details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
