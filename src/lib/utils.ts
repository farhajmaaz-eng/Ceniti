import type { Contract, Obligation, Deadline, ContractStatus, ObligationStatus, DeadlineStatus, ContractType, ObligationCategory, DeadlineType } from './types';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatDateTime(dateString: string, timeString?: string): string {
  if (timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date(dateString);
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return formatDate(dateString);
}

export function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: ContractStatus | ObligationStatus | DeadlineStatus): string {
  const colors: Record<string, string> = {
    // Contract statuses
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    under_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
    terminated: 'bg-gray-100 text-gray-700 border-gray-200',
    renewed: 'bg-purple-50 text-purple-700 border-purple-200',
    
    // Obligation statuses
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    waived: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    breached: 'bg-red-100 text-red-800 border-red-300',
    
    // Deadline statuses
    upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    today: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  };
  return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getTypeLabel(type: ContractType | ObligationCategory | DeadlineType): string {
  const labels: Record<string, string> = {
    // Contract types
    msa: 'MSA',
    nda: 'NDA',
    service_agreement: 'Service Agreement',
    employment: 'Employment',
    vendor: 'Vendor Agreement',
    licensing: 'Licensing',
    partnership: 'Partnership',
    other: 'Other',
    
    // Obligation categories
    delivery: 'Delivery',
    payment: 'Payment',
    reporting: 'Reporting',
    compliance: 'Compliance',
    confidentiality: 'Confidentiality',
    insurance: 'Insurance',
    renewal: 'Renewal',
    termination: 'Termination',
    
    // Deadline types
    expiration: 'Expiration',
    renewal: 'Renewal',
    termination_notice: 'Termination Notice',
    payment: 'Payment',
    deliverable: 'Deliverable',
    review: 'Review',
    compliance: 'Compliance',
    audit: 'Audit',
    custom: 'Custom',
  };
  return labels[type] || type;
}

export function formatCurrency(value: number | undefined, currency: string = 'USD'): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDeadlineStatus(deadline: Deadline): DeadlineStatus {
  const daysUntil = getDaysUntil(deadline.date);
  if (deadline.status === 'completed' || deadline.status === 'cancelled') {
    return deadline.status;
  }
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'today';
  return 'upcoming';
}

export function getObligationStatus(obligation: Obligation): ObligationStatus {
  if (obligation.status === 'completed' || obligation.status === 'waived' || obligation.status === 'breached') {
    return obligation.status;
  }
  const daysUntil = getDaysUntil(obligation.dueDate);
  if (daysUntil < 0) return 'overdue';
  return obligation.status;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}