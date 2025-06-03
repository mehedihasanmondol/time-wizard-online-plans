
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Clock, Users, DollarSign, TrendingUp } from "lucide-react";
import { Roster as RosterType } from "@/types/database";

interface EnhancedRosterCalendarViewProps {
  rosters: RosterType[];
}

interface RosterCard {
  roster: RosterType;
  date: string;
  assignedProfiles: number;
  expectedProfiles: number;
  totalHours: number;
  estimatedValue: number;
  progressPercentage: number;
}

export const EnhancedRosterCalendarView = ({ rosters }: EnhancedRosterCalendarViewProps) => {
  // Split multi-day rosters into individual date entries
  const expandedRosters: RosterCard[] = [];
  
  rosters.forEach((roster) => {
    const startDate = new Date(roster.date);
    const endDate = roster.end_date ? new Date(roster.end_date) : startDate;
    
    // Loop through each date in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      const assignedProfiles = roster.roster_profiles?.length || 0;
      const expectedProfiles = roster.expected_profiles || 1;
      const progressPercentage = expectedProfiles > 0 ? (assignedProfiles / expectedProfiles) * 100 : 0;
      const estimatedValue = roster.total_hours * (roster.per_hour_rate || 0);
      
      expandedRosters.push({
        roster,
        date: dateString,
        assignedProfiles,
        expectedProfiles,
        totalHours: roster.total_hours,
        estimatedValue,
        progressPercentage
      });
    }
  });

  // Group by date and sort
  const rostersByDate = expandedRosters.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, RosterCard[]>);

  // Sort dates
  const sortedDates = Object.keys(rostersByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-3">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <Badge variant="outline" className="ml-auto">
              {rostersByDate[date].length} roster{rostersByDate[date].length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {rostersByDate[date].map((item, index) => (
            <Card key={`${item.roster.id}-${item.date}-${index}`} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-base text-gray-900 line-clamp-2">
                      {item.roster.name || 'Unnamed Roster'}
                    </h4>
                    <Badge variant={
                      item.roster.status === "confirmed" ? "default" : 
                      item.roster.status === "pending" ? "secondary" : "outline"
                    } className="ml-2 shrink-0">
                      {item.roster.status}
                    </Badge>
                  </div>

                  {/* Project & Client */}
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-gray-900">
                      {item.roster.projects?.name || 'No Project'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.roster.clients?.company || 'No Client'}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{item.roster.start_time} - {item.roster.end_time}</span>
                  </div>

                  {/* Team Assignment Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Team Assignment</span>
                      <span className="text-gray-600">
                        {item.assignedProfiles}/{item.expectedProfiles}
                      </span>
                    </div>
                    <Progress 
                      value={item.progressPercentage} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      {item.progressPercentage.toFixed(0)}% staffed
                    </div>
                  </div>

                  {/* Assigned Team Members */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Assigned Team</div>
                    <div className="flex flex-wrap gap-1">
                      {item.roster.roster_profiles?.slice(0, 3).map((rp) => (
                        <Badge key={rp.id} variant="secondary" className="text-xs">
                          {rp.profiles?.full_name}
                        </Badge>
                      ))}
                      {(item.roster.roster_profiles?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(item.roster.roster_profiles?.length || 0) - 3} more
                        </Badge>
                      )}
                      {item.assignedProfiles === 0 && (
                        <span className="text-xs text-gray-500 italic">No assignments yet</span>
                      )}
                    </div>
                  </div>

                  {/* Financial & Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-purple-600" />
                        <span className="text-xs text-gray-600">Total Hours</span>
                      </div>
                      <div className="font-semibold text-sm text-purple-700">
                        {item.totalHours}h
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-gray-600">Est. Value</span>
                      </div>
                      <div className="font-semibold text-sm text-green-700">
                        ${item.estimatedValue.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-gray-600">Assigned</span>
                      </div>
                      <div className="font-semibold text-sm text-blue-700">
                        {item.assignedProfiles} / {item.expectedProfiles}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-gray-600">Per Hour</span>
                      </div>
                      <div className="font-semibold text-sm text-orange-700">
                        ${(item.roster.per_hour_rate || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Notes if available */}
                  {item.roster.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-600 italic line-clamp-2">
                        {item.roster.notes}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {sortedDates.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No rosters found</h3>
          <p className="text-sm">Create your first roster to see it appear here</p>
        </div>
      )}
    </div>
  );
};
