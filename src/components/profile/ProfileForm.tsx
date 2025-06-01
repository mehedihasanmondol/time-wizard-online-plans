
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/database";

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  editingProfile: Profile | null;
  loading: boolean;
}

export const ProfileForm = ({ isOpen, onClose, onSubmit, editingProfile, loading }: ProfileFormProps) => {
  const [formData, setFormData] = useState({
    full_name: editingProfile?.full_name || "",
    role: editingProfile?.role || "employee" as "admin" | "employee" | "accountant" | "operation" | "sales_manager",
    is_active: editingProfile?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingProfile ? "Edit Profile" : "Profile Information"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value: "admin" | "employee" | "accountant" | "operation" | "sales_manager") => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="operation">Operations</SelectItem>
                <SelectItem value="sales_manager">Sales Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="is_active">Status</Label>
            <Select value={formData.is_active ? "active" : "inactive"} onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingProfile ? "Update Profile" : "Save Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
