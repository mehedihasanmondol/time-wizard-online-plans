
export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'employee' | 'accountant' | 'operation' | 'sales_manager';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: 'active' | 'completed' | 'on-hold';
  start_date: string;
  end_date?: string;
  budget: number;
  created_at: string;
  updated_at: string;
  clients?: Client;
}

export interface WorkingHour {
  id: string;
  profile_id: string;
  client_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
}

export interface BankTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  category: string;
  date: string;
  created_at: string;
  updated_at: string;
  client_id?: string;
  project_id?: string;
  profile_id?: string;
  clients?: Client;
  projects?: Project;
  profiles?: Profile;
}

export interface Payroll {
  id: string;
  profile_id: string;
  pay_period_start: string;
  pay_period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}
