
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Calculator, DollarSign, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile, WorkingHour, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedProfileSelector } from "./EnhancedProfileSelector";

interface PayrollGenerationWizardProps {
  profiles: Profile[];
  workingHours: WorkingHour[];
  onRefresh: () => void;
}

export const PayrollGenerationWizard = ({ profiles, workingHours, onRefresh }: PayrollGenerationWizardProps) => {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [payrollPreview, setPayrollPreview] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedProfileIds.length > 0 && dateRange.start && dateRange.end) {
      generatePayrollPreview();
    }
  }, [selectedProfileIds, dateRange]);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts(data as BankAccount[]);
      
      // Auto-select primary account
      const primary = data.find(acc => acc.is_primary);
      if (primary) setSelectedBankAccount(primary.id);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const generatePayrollPreview = async () => {
    try {
      setLoading(true);
      const preview: any[] = [];

      for (const profileId of selectedProfileIds) {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) continue;

        // Get working hours for this profile in date range
        const profileHours = workingHours.filter(wh => 
          wh.profile_id === profileId &&
          wh.date >= dateRange.start &&
          wh.date <= dateRange.end &&
          wh.status === 'approved'
        );

        const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
        const overtimeHours = profileHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0);
        const regularHours = totalHours - overtimeHours;
        
        const hourlyRate = profile.hourly_rate || 0;
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x overtime rate
        const grossPay = regularPay + overtimePay;
        
        // Calculate deductions (simple tax calculation - 10%)
        const deductions = grossPay * 0.1;
        const netPay = grossPay - deductions;

        preview.push({
          profile,
          totalHours,
          regularHours,
          overtimeHours,
          hourlyRate,
          regularPay,
          overtimePay,
          grossPay,
          deductions,
          netPay,
          workingHours: profileHours
        });
      }

      setPayrollPreview(preview);
    } catch (error) {
      console.error('Error generating payroll preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    try {
      setLoading(true);
      const payrollRecords = [];

      for (const preview of payrollPreview) {
        const payrollData = {
          profile_id: preview.profile.id,
          pay_period_start: dateRange.start,
          pay_period_end: dateRange.end,
          total_hours: preview.totalHours,
          hourly_rate: preview.hourlyRate,
          gross_pay: preview.grossPay,
          deductions: preview.deductions,
          net_pay: preview.netPay,
          status: 'pending',
          bank_account_id: selectedBankAccount || null
        };

        payrollRecords.push(payrollData);
      }

      const { error } = await supabase
        .from('payroll')
        .insert(payrollRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${payrollRecords.length} payroll records successfully`
      });

      // Reset wizard
      setSelectedProfileIds([]);
      setStep(1);
      setPayrollPreview([]);
      onRefresh();
    } catch (error: any) {
      console.error('Error generating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to generate payroll records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPreviewAmount = payrollPreview.reduce((sum, p) => sum + p.netPay, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payroll Generation Wizard - Step {step} of 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Step 1: Select Profiles & Date Range</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <EnhancedProfileSelector
                      profiles={profiles}
                      workingHours={workingHours}
                      selectedProfileIds={selectedProfileIds}
                      onProfileSelect={setSelectedProfileIds}
                      mode="multiple"
                      label="Select Team Members for Payroll"
                      showStats={true}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Pay Period Start</Label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Pay Period End</Label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label>Bank Account</Label>
                      <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.bank_name} - {account.account_number}
                              {account.is_primary && ' (Primary)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={selectedProfileIds.length === 0 || !dateRange.start || !dateRange.end}
                >
                  Next: Review Payroll
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Step 2: Review Payroll Calculations</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">${totalPreviewAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Net Pay</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollPreview.map((preview) => (
                      <tr key={preview.profile.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{preview.profile.full_name}</div>
                            <div className="text-sm text-gray-600">{preview.profile.role}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>Regular: {preview.regularHours.toFixed(1)}h</div>
                            {preview.overtimeHours > 0 && (
                              <div className="text-orange-600">Overtime: {preview.overtimeHours.toFixed(1)}h</div>
                            )}
                            <div className="font-medium">Total: {preview.totalHours.toFixed(1)}h</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">${preview.hourlyRate.toFixed(2)}/hr</td>
                        <td className="py-3 px-4">${preview.grossPay.toFixed(2)}</td>
                        <td className="py-3 px-4 text-red-600">${preview.deductions.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-green-600">${preview.netPay.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back: Edit Selection
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Confirm & Generate
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Step 3: Confirm & Generate Payroll</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payroll Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Employees</div>
                    <div className="font-bold">{payrollPreview.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Hours</div>
                    <div className="font-bold">{payrollPreview.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Gross Pay</div>
                    <div className="font-bold">${payrollPreview.reduce((sum, p) => sum + p.grossPay, 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Net Pay</div>
                    <div className="font-bold text-green-600">${totalPreviewAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back: Review Details
                </Button>
                <Button onClick={generatePayroll} disabled={loading}>
                  {loading ? "Generating..." : "Generate Payroll Records"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
