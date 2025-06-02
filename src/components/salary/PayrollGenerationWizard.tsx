
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Calculator, Users, DollarSign, Clock, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedProfileIds.length > 0) {
      generatePreview();
    } else {
      setPreviewData([]);
    }
  }, [selectedProfileIds, dateRange]);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('bank_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const generatePreview = () => {
    const preview = selectedProfileIds.map(profileId => {
      const profile = profiles.find(p => p.id === profileId);
      
      // Filter working hours for this profile and date range, excluding paid hours
      const relevantHours = workingHours.filter(wh => 
        wh.profile_id === profileId &&
        wh.date >= dateRange.start &&
        wh.date <= dateRange.end &&
        wh.status !== 'paid'
      );

      const totalHours = relevantHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const hourlyRate = profile?.hourly_rate || 0;
      const grossPay = totalHours * hourlyRate;
      const deductions = grossPay * 0.1; // 10% deductions
      const netPay = grossPay - deductions;

      return {
        profileId,
        profile,
        totalHours,
        hourlyRate,
        grossPay,
        deductions,
        netPay,
        workingHoursCount: relevantHours.length
      };
    });

    setPreviewData(preview);
  };

  const createNotification = async (profileId: string, title: string, message: string, type: string, priority: string = 'medium') => {
    try {
      await supabase.from('notifications').insert([{
        title,
        message,
        type,
        recipient_profile_id: profileId,
        priority,
        action_type: 'none'
      }]);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const generatePayrolls = async () => {
    if (previewData.length === 0) {
      toast({
        title: "Error",
        description: "No payroll data to generate",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      for (const item of previewData) {
        if (item.totalHours === 0) continue;

        // Create payroll record
        const { data: payrollData, error: payrollError } = await supabase
          .from('payroll')
          .insert([{
            profile_id: item.profileId,
            pay_period_start: dateRange.start,
            pay_period_end: dateRange.end,
            total_hours: item.totalHours,
            hourly_rate: item.hourlyRate,
            gross_pay: item.grossPay,
            deductions: item.deductions,
            net_pay: item.netPay,
            status: 'pending'
          }])
          .select()
          .single();

        if (payrollError) throw payrollError;

        // Create notification for payroll creation
        await createNotification(
          item.profileId,
          'Payroll Created',
          `Your payroll for period ${dateRange.start} to ${dateRange.end} has been created. Net amount: $${item.netPay.toFixed(2)}`,
          'payroll_created',
          'high'
        );
      }

      toast({
        title: "Success",
        description: `Generated ${previewData.filter(p => p.totalHours > 0).length} payroll records`
      });

      // Reset selection
      setSelectedProfileIds([]);
      onRefresh();

    } catch (error: any) {
      console.error('Error generating payrolls:', error);
      toast({
        title: "Error",
        description: "Failed to generate payrolls",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPreviewAmount = previewData.reduce((sum, p) => sum + p.netPay, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payroll Generation Wizard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Profile Selection */}
          <EnhancedProfileSelector
            profiles={profiles}
            selectedProfileIds={selectedProfileIds}
            onProfileSelect={setSelectedProfileIds}
            mode="multiple"
            label="Select Profiles for Payroll Generation"
            showStats={true}
          />

          {/* Preview Table */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payroll Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Employee</th>
                        <th className="text-right py-2">Hours</th>
                        <th className="text-right py-2">Rate</th>
                        <th className="text-right py-2">Gross Pay</th>
                        <th className="text-right py-2">Deductions</th>
                        <th className="text-right py-2">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((item) => (
                        <tr key={item.profileId} className="border-b">
                          <td className="py-2">
                            <div>
                              <div className="font-medium">{item.profile?.full_name}</div>
                              <div className="text-sm text-gray-500">{item.workingHoursCount} records</div>
                            </div>
                          </td>
                          <td className="text-right py-2">{item.totalHours.toFixed(1)}</td>
                          <td className="text-right py-2">${item.hourlyRate.toFixed(2)}</td>
                          <td className="text-right py-2">${item.grossPay.toFixed(2)}</td>
                          <td className="text-right py-2 text-red-600">${item.deductions.toFixed(2)}</td>
                          <td className="text-right py-2 font-bold">${item.netPay.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={5} className="text-right py-2">Total:</td>
                        <td className="text-right py-2">${totalPreviewAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {previewData.some(p => p.totalHours === 0) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Some profiles have 0 hours and will be skipped
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={generatePayrolls} 
                  disabled={loading || previewData.filter(p => p.totalHours > 0).length === 0}
                  className="w-full mt-4"
                >
                  {loading ? "Generating..." : `Generate ${previewData.filter(p => p.totalHours > 0).length} Payroll Records`}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
