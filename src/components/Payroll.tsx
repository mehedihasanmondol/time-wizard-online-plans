import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Payroll, WorkingHour } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const PayrollComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    pay_period_start: "",
    pay_period_end: "",
    total_hours: 0,
    hourly_rate: 0,
    gross_pay: 0,
    deductions: 0,
    net_pay: 0,
    status: "pending" as "pending" | "approved" | "paid"
  });

  useEffect(() => {
    fetchPayrolls();
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          profiles (id, full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrolls((data || []) as Payroll[]);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollFromHours = async (profileId: string, startDate: string, endDate: string) => {
    try {
      const { data: workingHours, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('profile_id', profileId)
        .eq('status', 'approved')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const profile = profiles.find(emp => emp.id === profileId);
      if (!profile) return;

      const totalHours = (workingHours || []).reduce((sum, wh) => sum + (wh.total_hours || 0), 0);
      const hourlyRate = 25; // Default hourly rate
      const grossPay = totalHours * hourlyRate;
      const netPay = grossPay - formData.deductions;

      setFormData(prev => ({
        ...prev,
        total_hours: totalHours,
        hourly_rate: hourlyRate,
        gross_pay: grossPay,
        net_pay: netPay
      }));

      toast({
        title: "Calculated",
        description: `Found ${totalHours} approved hours for ${profile.full_name}`
      });
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to calculate payroll from working hours",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPayroll) {
        const { error } = await supabase
          .from('payroll')
          .update(formData)
          .eq('id', editingPayroll.id);

        if (error) throw error;
        toast({ title: "Success", description: "Payroll updated successfully" });
      } else {
        const { error } = await supabase
          .from('payroll')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Success", description: "Payroll record created successfully" });
      }

      setIsDialogOpen(false);
      setEditingPayroll(null);
      setFormData({
        profile_id: "",
        pay_period_start: "",
        pay_period_end: "",
        total_hours: 0,
        hourly_rate: 0,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        status: "pending"
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Error saving payroll:', error);
      toast({
        title: "Error",
        description: "Failed to save payroll record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payroll: Payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      profile_id: payroll.profile_id,
      pay_period_start: payroll.pay_period_start,
      pay_period_end: payroll.pay_period_end,
      total_hours: payroll.total_hours,
      hourly_rate: payroll.hourly_rate,
      gross_pay: payroll.gross_pay,
      deductions: payroll.deductions,
      net_pay: payroll.net_pay,
      status: payroll.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payroll record?")) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Payroll record deleted successfully" });
      fetchPayrolls();
    } catch (error) {
      console.error('Error deleting payroll:', error);
      toast({
        title: "Error",
        description: "Failed to delete payroll record",
        variant: "destructive"
      });
    }
  };

  const filteredPayrolls = payrolls.filter(payroll =>
    payroll.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && payrolls.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={() => {
              setEditingPayroll(null);
              setFormData({
                profile_id: "",
                pay_period_start: "",
                pay_period_end: "",
                total_hours: 0,
                hourly_rate: 0,
                gross_pay: 0,
                deductions: 0,
                net_pay: 0,
                status: "pending"
              });
            }}>
              <Plus className="h-4 w-4" />
              Create Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPayroll ? "Edit Payroll" : "Create New Payroll"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile_id">Profile</Label>
                  <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} - {profile.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "pending" | "approved" | "paid") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay_period_start">Pay Period Start</Label>
                  <Input
                    id="pay_period_start"
                    type="date"
                    value={formData.pay_period_start}
                    onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pay_period_end">Pay Period End</Label>
                  <Input
                    id="pay_period_end"
                    type="date"
                    value={formData.pay_period_end}
                    onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.profile_id && formData.pay_period_start && formData.pay_period_end && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => calculatePayrollFromHours(formData.profile_id, formData.pay_period_start, formData.pay_period_end)}
                  className="w-full"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate from Approved Hours
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_hours">Total Hours</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    step="0.01"
                    value={formData.total_hours}
                    onChange={(e) => {
                      const hours = parseFloat(e.target.value) || 0;
                      const gross = hours * formData.hourly_rate;
                      setFormData({ 
                        ...formData, 
                        total_hours: hours,
                        gross_pay: gross,
                        net_pay: gross - formData.deductions
                      });
                    }}
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
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 0;
                      const gross = formData.total_hours * rate;
                      setFormData({ 
                        ...formData, 
                        hourly_rate: rate,
                        gross_pay: gross,
                        net_pay: gross - formData.deductions
                      });
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gross_pay">Gross Pay</Label>
                  <Input
                    id="gross_pay"
                    type="number"
                    step="0.01"
                    value={formData.gross_pay}
                    onChange={(e) => {
                      const gross = parseFloat(e.target.value) || 0;
                      setFormData({ 
                        ...formData, 
                        gross_pay: gross,
                        net_pay: gross - formData.deductions
                      });
                    }}
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
                    onChange={(e) => {
                      const deductions = parseFloat(e.target.value) || 0;
                      setFormData({ 
                        ...formData, 
                        deductions: deductions,
                        net_pay: formData.gross_pay - deductions
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="net_pay">Net Pay</Label>
                  <Input
                    id="net_pay"
                    type="number"
                    step="0.01"
                    value={formData.net_pay}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : editingPayroll ? "Update Payroll" : "Create Payroll"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Records ({payrolls.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payroll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{payroll.profiles?.full_name}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{payroll.total_hours}h</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.hourly_rate}</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.gross_pay}</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.net_pay}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        payroll.status === "paid" ? "default" : 
                        payroll.status === "approved" ? "secondary" : "outline"
                      }>
                        {payroll.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(payroll)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(payroll.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
