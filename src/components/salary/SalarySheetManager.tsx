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
import { Payroll, Profile, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { PayrollDetailsDialog } from "@/components/salary/PayrollDetailsDialog";

export const SalarySheetManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    pay_period_start: "",
    pay_period_end: "",
    bank_account_id: "",
    status: "pending"
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
        .select(`
          *,
          profiles!payroll_profile_id_fkey (id, full_name, role),
          bank_accounts!payroll_bank_account_id_fkey (id, bank_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrolls(data as Payroll[]);
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

  const handleOpenDetailsDialog = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailsDialogOpen(true);
  };

  const filteredPayrolls = payrolls.filter(payroll =>
    (payroll.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Sheet Management</h1>
            <p className="text-gray-600">Manage and track employee payrolls efficiently</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee name..."
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{payroll.profiles?.full_name}</div>
                      <div className="text-sm text-gray-600">{payroll.profiles?.role}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {format(new Date(payroll.pay_period_start), 'MMM dd, yyyy')} - {format(new Date(payroll.pay_period_end), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{payroll.total_hours}</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.gross_pay.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.net_pay.toFixed(2)}</td>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetailsDialog(payroll)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Details
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

      {selectedPayroll && (
        <PayrollDetailsDialog
          payroll={selectedPayroll}
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          onRefresh={fetchPayrolls}
        />
      )}
    </div>
  );
};
