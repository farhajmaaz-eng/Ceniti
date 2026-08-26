export interface Contract {
  id: string;
  name: string;
  counterparty: string;
  type: ContractType;
  status: ContractStatus;
  value?: number;
  currency: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  autoRenew: boolean;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ContractType = 
  | 'msa' 
  | 'nda' 
  | 'service_agreement' 
  | 'employment' 
  | 'vendor' 
  | 'licensing' 
  | 'partnership' 
  | 'other';

export type ContractStatus = 
  | 'draft' 
  | 'under_review' 
  | 'approved' 
  | 'active' 
  | 'expired' 
  | 'terminated' 
  | 'renewed';

export interface Obligation {
  id: string;
  contractId: string;
  contractName: string;
  title: string;
  description: string;
  category: ObligationCategory;
  party: 'us' | 'counterparty' | 'both';
  status: ObligationStatus;
  dueDate: string;
  completedDate?: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export type ObligationCategory = 
  | 'delivery' 
  | 'payment' 
  | 'reporting' 
  | 'compliance' 
  | 'confidentiality' 
  | 'insurance' 
  | 'renewal' 
  | 'termination' 
  | 'other';

export type ObligationStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'overdue' 
  | 'waived' 
  | 'breached';

export interface Deadline {
  id: string;
  contractId: string;
  contractName: string;
  title: string;
  description: string;
  type: DeadlineType;
  date: string;
  time?: string;
  timezone: string;
  status: DeadlineStatus;
  assignee?: string;
  reminders: Reminder[];
  createdAt: string;
  updatedAt: string;
}

export type DeadlineType = 
  | 'expiration' 
  | 'renewal' 
  | 'termination_notice' 
  | 'payment' 
  | 'deliverable' 
  | 'review' 
  | 'compliance' 
  | 'audit' 
  | 'custom';

export type DeadlineStatus = 
  | 'upcoming' 
  | 'today' 
  | 'overdue' 
  | 'completed' 
  | 'cancelled';

export interface Reminder {
  id: string;
  deadlineId: string;
  type: 'email' | 'in_app' | 'slack';
  timing: ReminderTiming;
  sent: boolean;
  sentAt?: string;
}

export type ReminderTiming = 
  | '1_day_before' 
  | '3_days_before' 
  | '1_week_before' 
  | '2_weeks_before' 
  | '30_days_before' 
  | '90_days_before' 
  | 'on_day';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  avatar?: string;
}

export interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiringSoon: number;
  overdueObligations: number;
  upcomingDeadlines: number;
  completedThisMonth: number;
}