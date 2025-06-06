
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";

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
