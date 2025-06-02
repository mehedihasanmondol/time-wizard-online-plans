
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types/database";

interface NotificationCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  onSuccess: () => Promise<void>;
}

export const NotificationCreateForm = ({ isOpen, onClose, profiles, onSuccess }: NotificationCreateFormProps) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || selectedProfiles.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one recipient",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const notifications = selectedProfiles.map(profileId => ({
        title: title.trim(),
        message: message.trim(),
        type: 'manual',
        recipient_profile_id: profileId,
        priority,
        action_type: 'none'
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification sent to ${selectedProfiles.length} recipient(s)`
      });

      // Reset form
      setTitle("");
      setMessage("");
      setPriority("medium");
      setSelectedProfiles([]);
      
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Notification</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              required
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Recipients * ({selectedProfiles.length} selected)</Label>
            <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <label key={profile.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.includes(profile.id)}
                      onChange={() => toggleProfile(profile.id)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {profile.full_name} ({profile.role})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
