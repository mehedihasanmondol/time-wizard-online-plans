
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationDateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export const NotificationDateFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear
}: NotificationDateFilterProps) => {
  const handleDateShortcut = (days: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    onStartDateChange(startDate.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    onStartDateChange(startOfWeek.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
  };

  const handleThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    onStartDateChange(startOfMonth.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="w-40"
        placeholder="Start Date"
      />
      <span className="text-gray-500 text-sm">to</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="w-40"
        placeholder="End Date"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Quick Select
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleDateShortcut(0)}>
            Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDateShortcut(7)}>
            Last 7 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDateShortcut(30)}>
            Last 30 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleThisWeek}>
            This Week
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleThisMonth}>
            This Month
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {(startDate || endDate) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="h-10 w-10 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
