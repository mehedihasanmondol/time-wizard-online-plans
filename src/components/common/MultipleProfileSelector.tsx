
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Profile } from "@/types/database";

interface MultipleProfileSelectorProps {
  profiles: Profile[];
  selectedProfileIds: string[];
  onProfileSelect: (profileIds: string[]) => void;
  label?: string;
  placeholder?: string;
  showRoleFilter?: boolean;
  className?: string;
  disabled?: boolean;
}

export const MultipleProfileSelector = ({ 
  profiles, 
  selectedProfileIds, 
  onProfileSelect, 
  label = "Select Profiles",
  placeholder = "Choose profiles",
  showRoleFilter = false,
  className = "",
  disabled = false
}: MultipleProfileSelectorProps) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredProfiles = showRoleFilter && roleFilter !== 'all' 
    ? profiles.filter(profile => profile.role === roleFilter)
    : profiles;

  const selectedProfiles = profiles.filter(profile => 
    selectedProfileIds.includes(profile.id)
  );

  const handleProfileAdd = (profileId: string) => {
    if (!selectedProfileIds.includes(profileId)) {
      onProfileSelect([...selectedProfileIds, profileId]);
    }
  };

  const handleProfileRemove = (profileId: string) => {
    onProfileSelect(selectedProfileIds.filter(id => id !== profileId));
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {showRoleFilter && !disabled && (
        <div className="mt-2 mb-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
              <SelectItem value="operation">Operation</SelectItem>
              <SelectItem value="sales_manager">Sales Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-2 space-y-2">
        {!disabled && (
          <Select onValueChange={handleProfileAdd}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filteredProfiles
                .filter(profile => !selectedProfileIds.includes(profile.id))
                .map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} ({profile.role})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {selectedProfiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedProfiles.map((profile) => (
              <Badge key={profile.id} variant="secondary" className="flex items-center gap-1">
                {profile.full_name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleProfileRemove(profile.id)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
