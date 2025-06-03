import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Payroll as PayrollType, Profile, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

export const PayrollComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    status: "pending",
    bank_account_id: ""
  });

  useEffect(() => {
    fetchPayrolls();
    fetchProfiles();
    fetchBankAccounts();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrolls(data as PayrollType[]);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payrolls",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('bank_name');

      if (error) throw error;
      setBankAccounts(data as BankAccount[]);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const filteredPayrolls = payrolls.filter(payroll =>
    (payroll.profile_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedProfile = profiles.find(p => p.id === formData.profile_id);
      const totalHours = formData.total_hours || 0;
      const hourlyRate = formData.hourly_rate || selectedProfile?.hourly_rate || 0;
      const grossPay = totalHours * hourlyRate;
      const deductions = grossPay * 0.1; // 10% deductions
      const netPay = grossPay - deductions;

      const { error } = await supabase
        .from('payroll')
        .insert([{
          profile_id: formData.profile_id,
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          gross_pay: grossPay,
          deductions: deductions,
          net_pay: netPay,
          status: 'pending' as const,
          bank_account_id: formData.bank_account_id || null
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Payroll created successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        pay_period_start: "",
        pay_period_end: "",
        total_hours: 0,
        hourly_rate: 0,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        status: "pending",
        bank_account_id: ""
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Error saving payroll:', error);
      toast({
        title: "Error",
        description: "Failed to save payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">Manage and track employee payrolls efficiently</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Payroll</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="profile_id">Profile</Label>
                <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_hours">Total Hours</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bank_account_id">Bank Account</Label>
                <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((bankAccount) => (
                      <SelectItem key={bankAccount.id} value={bankAccount.id}>
                        {bankAccount.bank_name} - {bankAccount.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Payroll"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by profile id..."
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Profile ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period Start</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period End</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hourly Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{payroll.profile_id}</td>
                    <td className="py-3 px-4">{payroll.pay_period_start}</td>
                    <td className="py-3 px-4">{payroll.pay_period_end}</td>
                    <td className="py-3 px-4">{payroll.total_hours}</td>
                    <td className="py-3 px-4">{payroll.hourly_rate}</td>
                    <td className="py-3 px-4">{payroll.gross_pay}</td>
                    <td className="py-3 px-4">{payroll.deductions}</td>
                    <td className="py-3 px-4">{payroll.net_pay}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        payroll.status === "paid" ? "default" :
                        payroll.status === "approved" ? "secondary" : "outline"
                      }>
                        {payroll.status}
                      </Badge>
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
