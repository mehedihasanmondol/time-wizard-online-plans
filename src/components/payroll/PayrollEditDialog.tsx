
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Payroll, WorkingHour } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PayrollEditDialogProps {
  payroll: Payroll | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const PayrollEditDialog = ({ payroll, isOpen, onClose, onSave }: PayrollEditDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  
  const [formData, setFormData] = useState({
    total_hours: 0,
    hourly_rate: 0,
    gross_pay: 0,
    deductions: 0,
    net_pay: 0,
    status: 'pending' as 'pending' | 'approved' | 'paid'
  });

  useEffect(() => {
    if (payroll && isOpen) {
      setFormData({
        total_hours: payroll.total_hours,
        hourly_rate: payroll.hourly_rate,
        gross_pay: payroll.gross_pay,
        deductions: payroll.deductions,
        net_pay: payroll.net_pay,
        status: payroll.status || 'pending'
      });
      fetchWorkingHours();
    }
  }, [payroll, isOpen]);

  const fetchWorkingHours = async () => {
    if (!payroll) return;

    try {
      const { data, error } = await supabase
        .from('payroll_working_hours')
        .select(`
          working_hours_id,
          working_hours (
            *,
            clients (id, company),
            projects (id, name)
          )
        `)
        .eq('payroll_id', payroll.id);

      if (error) throw error;
      
      // Extract working hours from the join table
      const workingHoursData = (data || []).map((item: any) => item.working_hours).filter(Boolean);
      setWorkingHours(workingHoursData);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payroll) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          total_hours: formData.total_hours,
          hourly_rate: formData.hourly_rate,
          gross_pay: formData.gross_pay,
          deductions: formData.deductions,
          net_pay: formData.net_pay,
          status: formData.status
        })
        .eq('id', payroll.id);

      if (error) throw error;

      toast({ title: "Success", description: "Payroll updated successfully" });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payroll</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_hours">Total Hours</Label>
              <Input
                id="total_hours"
                type="number"
                step="0.01"
                value={formData.total_hours}
                onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="hourly_rate">Hourly Rate</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gross_pay">Gross Pay</Label>
              <Input
                id="gross_pay"
                type="number"
                step="0.01"
                value={formData.gross_pay}
                onChange={(e) => setFormData({ ...formData, gross_pay: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="deductions">Deductions</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="net_pay">Net Pay</Label>
              <Input
                id="net_pay"
                type="number"
                step="0.01"
                value={formData.net_pay}
                onChange={(e) => setFormData({ ...formData, net_pay: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'pending' | 'approved' | 'paid') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {workingHours.length > 0 && (
            <div>
              <Label>Associated Working Hours</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                {workingHours.map((wh) => (
                  <div key={wh.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="text-sm">
                      <div>{format(new Date(wh.date), 'MMM dd, yyyy')}</div>
                      <div className="text-gray-500">{wh.start_time} - {wh.end_time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{wh.total_hours}h</Badge>
                      <Badge variant={
                        wh.status === "approved" ? "default" : 
                        wh.status === "paid" ? "default" : 
                        wh.status === "pending" ? "secondary" : "outline"
                      }>
                        {wh.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Payroll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
