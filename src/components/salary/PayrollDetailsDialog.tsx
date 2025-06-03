import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Payroll } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CircleX, UserRoundCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PayrollDetailsDialogProps {
  payroll: Payroll | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const PayrollDetailsDialog = ({ payroll, isOpen, onClose, onRefresh }: PayrollDetailsDialogProps) => {
  if (!payroll) {
    return null;
  }

  const handleApprove = async () => {
    // Implement approve logic here
    console.log("Approved Payroll ID:", payroll.id);
    onRefresh();
    onClose();
  };

  const handleReject = async () => {
    // Implement reject logic here
    console.log("Rejected Payroll ID:", payroll.id);
    onRefresh();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payroll Details</DialogTitle>
          <DialogDescription>
            Detailed information about the payroll for {payroll.profiles?.full_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Employee Information</h3>
            <p>
              <strong>Name:</strong> {payroll.profiles?.full_name}
            </p>
            <p>
              <strong>Email:</strong> {payroll.profiles?.email}
            </p>
            <p>
              <strong>Role:</strong> {payroll.profiles?.role}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Payroll Information</h3>
            <p>
              <strong>Pay Period Start:</strong> {new Date(payroll.pay_period_start).toLocaleDateString()}
            </p>
            <p>
              <strong>Pay Period End:</strong> {new Date(payroll.pay_period_end).toLocaleDateString()}
            </p>
            <p>
              <strong>Total Hours:</strong> {payroll.total_hours}
            </p>
            <p>
              <strong>Hourly Rate:</strong> ${payroll.hourly_rate}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Financial Details</h3>
            <p>
              <strong>Gross Pay:</strong> ${payroll.gross_pay}
            </p>
            <p>
              <strong>Deductions:</strong> ${payroll.deductions}
            </p>
            <p>
              <strong>Net Pay:</strong> ${payroll.net_pay}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Bank Account Details</h3>
            <p>
              <strong>Bank Name:</strong> {payroll.bank_accounts?.bank_name || 'N/A'}
            </p>
            <p>
              <strong>Account Number:</strong> {payroll.bank_accounts?.account_number || 'N/A'}
            </p>
            <p>
              <strong>Account Holder Name:</strong> {payroll.bank_accounts?.account_holder_name || 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Status</h3>
          <Badge variant={
            payroll.status === "approved" ? "default" :
            payroll.status === "pending" ? "secondary" : "destructive"
          }>
            {payroll.status}
          </Badge>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {payroll.status === "pending" && (
            <>
              <Button variant="ghost" onClick={handleReject} className="text-red-600">
                Reject <UserRoundX className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handleApprove} className="bg-green-600 text-white hover:bg-green-700">
                Approve <UserRoundCheck className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
