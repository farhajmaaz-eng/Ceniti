import type { Contract, Obligation, Deadline, User } from './types';

const STORAGE_KEYS = {
  contracts: 'ceniti_contracts',
  obligations: 'ceniti_obligations',
  deadlines: 'ceniti_deadlines',
  users: 'ceniti_users',
} as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T[]): T[] {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export const storage = {
  contracts: {
    getAll: (): Contract[] => getFromStorage(STORAGE_KEYS.contracts, []),
    getById: (id: string): Contract | undefined => 
      storage.contracts.getAll().find(c => c.id === id),
    save: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Contract => {
      const contracts = storage.contracts.getAll();
      const now = new Date().toISOString();
      const newContract: Contract = {
        ...contract,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      saveToStorage(STORAGE_KEYS.contracts, [...contracts, newContract]);
      return newContract;
    },
    update: (id: string, updates: Partial<Contract>): Contract | undefined => {
      const contracts = storage.contracts.getAll();
      const index = contracts.findIndex(c => c.id === id);
      if (index === -1) return undefined;
      const updated = { ...contracts[index], ...updates, updatedAt: new Date().toISOString() };
      contracts[index] = updated;
      saveToStorage(STORAGE_KEYS.contracts, contracts);
      return updated;
    },
    delete: (id: string): boolean => {
      const contracts = storage.contracts.getAll().filter(c => c.id !== id);
      saveToStorage(STORAGE_KEYS.contracts, contracts);
      return true;
    },
  },

  obligations: {
    getAll: (): Obligation[] => getFromStorage(STORAGE_KEYS.obligations, []),
    getByContractId: (contractId: string): Obligation[] => 
      storage.obligations.getAll().filter(o => o.contractId === contractId),
    getById: (id: string): Obligation | undefined => 
      storage.obligations.getAll().find(o => o.id === id),
    save: (obligation: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>): Obligation => {
      const obligations = storage.obligations.getAll();
      const now = new Date().toISOString();
      const newObligation: Obligation = {
        ...obligation,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      saveToStorage(STORAGE_KEYS.obligations, [...obligations, newObligation]);
      return newObligation;
    },
    update: (id: string, updates: Partial<Obligation>): Obligation | undefined => {
      const obligations = storage.obligations.getAll();
      const index = obligations.findIndex(o => o.id === id);
      if (index === -1) return undefined;
      const updated = { ...obligations[index], ...updates, updatedAt: new Date().toISOString() };
      obligations[index] = updated;
      saveToStorage(STORAGE_KEYS.obligations, obligations);
      return updated;
    },
    delete: (id: string): boolean => {
      const obligations = storage.obligations.getAll().filter(o => o.id !== id);
      saveToStorage(STORAGE_KEYS.obligations, obligations);
      return true;
    },
  },

  deadlines: {
    getAll: (): Deadline[] => getFromStorage(STORAGE_KEYS.deadlines, []),
    getByContractId: (contractId: string): Deadline[] => 
      storage.deadlines.getAll().filter(d => d.contractId === contractId),
    getById: (id: string): Deadline | undefined => 
      storage.deadlines.getAll().find(d => d.id === id),
    save: (deadline: Omit<Deadline, 'id' | 'createdAt' | 'updatedAt'>): Deadline => {
      const deadlines = storage.deadlines.getAll();
      const now = new Date().toISOString();
      const newDeadline: Deadline = {
        ...deadline,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      saveToStorage(STORAGE_KEYS.deadlines, [...deadlines, newDeadline]);
      return newDeadline;
    },
    update: (id: string, updates: Partial<Deadline>): Deadline | undefined => {
      const deadlines = storage.deadlines.getAll();
      const index = deadlines.findIndex(d => d.id === id);
      if (index === -1) return undefined;
      const updated = { ...deadlines[index], ...updates, updatedAt: new Date().toISOString() };
      deadlines[index] = updated;
      saveToStorage(STORAGE_KEYS.deadlines, deadlines);
      return updated;
    },
    delete: (id: string): boolean => {
      const deadlines = storage.deadlines.getAll().filter(d => d.id !== id);
      saveToStorage(STORAGE_KEYS.deadlines, deadlines);
      return true;
    },
  },

  users: {
    getAll: (): User[] => getFromStorage(STORAGE_KEYS.users, []),
    getById: (id: string): User | undefined => 
      storage.users.getAll().find(u => u.id === id),
  },

  initializeDefaults: (): void => {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem(STORAGE_KEYS.users)) {
      const defaultUsers: User[] = [
        { id: 'user-1', name: 'Alex Chen', email: 'alex@company.com', role: 'admin' },
        { id: 'user-2', name: 'Sarah Mitchell', email: 'sarah@company.com', role: 'manager' },
        { id: 'user-3', name: 'James Park', email: 'james@company.com', role: 'viewer' },
      ];
      saveToStorage(STORAGE_KEYS.users, defaultUsers);
    }

    if (!localStorage.getItem(STORAGE_KEYS.contracts)) {
      const defaultContracts: Contract[] = [
        {
          id: 'contract-1',
          name: 'Master Services Agreement - Acme Corp',
          counterparty: 'Acme Corporation',
          type: 'msa',
          status: 'active',
          value: 250000,
          currency: 'USD',
          startDate: '2024-01-15',
          endDate: '2025-01-14',
          renewalDate: '2024-10-15',
          autoRenew: true,
          description: 'Master agreement for consulting services',
          tags: ['high-value', 'strategic', 'auto-renew'],
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
        {
          id: 'contract-2',
          name: 'NDA - TechStart Inc',
          counterparty: 'TechStart Inc',
          type: 'nda',
          status: 'active',
          startDate: '2024-03-01',
          endDate: '2026-03-01',
          autoRenew: false,
          description: 'Mutual NDA for partnership discussions',
          tags: ['confidentiality', 'short-term'],
          createdAt: '2024-02-28T14:00:00Z',
          updatedAt: '2024-02-28T14:00:00Z',
        },
        {
          id: 'contract-3',
          name: 'Software License Agreement - DataFlow Ltd',
          counterparty: 'DataFlow Ltd',
          type: 'licensing',
          status: 'under_review',
          value: 75000,
          currency: 'USD',
          startDate: '2024-06-01',
          endDate: '2027-05-31',
          renewalDate: '2027-03-01',
          autoRenew: false,
          description: 'Enterprise license for DataFlow analytics platform',
          tags: ['software', 'enterprise', 'renewal-tracking'],
          createdAt: '2024-05-15T09:00:00Z',
          updatedAt: '2024-05-15T09:00:00Z',
        },
      ];
      saveToStorage(STORAGE_KEYS.contracts, defaultContracts);
    }

    if (!localStorage.getItem(STORAGE_KEYS.obligations)) {
      const defaultObligations: Obligation[] = [
        {
          id: 'obl-1',
          contractId: 'contract-1',
          contractName: 'Master Services Agreement - Acme Corp',
          title: 'Deliver Q3 Status Report',
          description: 'Provide quarterly performance metrics and deliverables summary',
          category: 'reporting',
          party: 'us',
          status: 'pending',
          dueDate: '2024-10-15',
          assignee: 'user-1',
          priority: 'high',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
        {
          id: 'obl-2',
          contractId: 'contract-1',
          contractName: 'Master Services Agreement - Acme Corp',
          title: 'Quarterly Payment - Q3',
          description: 'Process payment for Q3 services rendered',
          category: 'payment',
          party: 'counterparty',
          status: 'pending',
          dueDate: '2024-10-30',
          assignee: 'user-2',
          priority: 'critical',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
        {
          id: 'obl-3',
          contractId: 'contract-2',
          contractName: 'NDA - TechStart Inc',
          title: 'Return Confidential Materials',
          description: 'Return or destroy all confidential information upon termination',
          category: 'confidentiality',
          party: 'both',
          status: 'pending',
          dueDate: '2026-03-01',
          priority: 'medium',
          createdAt: '2024-02-28T14:00:00Z',
          updatedAt: '2024-02-28T14:00:00Z',
        },
        {
          id: 'obl-4',
          contractId: 'contract-3',
          contractName: 'Software License Agreement - DataFlow Ltd',
          title: 'Annual Security Audit',
          description: 'Complete SOC2 Type II audit and share results',
          category: 'compliance',
          party: 'counterparty',
          status: 'in_progress',
          dueDate: '2024-11-01',
          assignee: 'user-3',
          priority: 'high',
          createdAt: '2024-05-15T09:00:00Z',
          updatedAt: '2024-05-15T09:00:00Z',
        },
      ];
      saveToStorage(STORAGE_KEYS.obligations, defaultObligations);
    }

    if (!localStorage.getItem(STORAGE_KEYS.deadlines)) {
      const defaultDeadlines: Deadline[] = [
        {
          id: 'dl-1',
          contractId: 'contract-1',
          contractName: 'Master Services Agreement - Acme Corp',
          title: 'Renewal Notice Deadline',
          description: 'Send non-renewal notice 90 days before auto-renewal',
          type: 'renewal',
          date: '2024-10-15',
          timezone: 'America/New_York',
          status: 'upcoming',
          assignee: 'user-1',
          reminders: [
            { id: 'rem-1', deadlineId: 'dl-1', type: 'email', timing: '90_days_before', sent: false },
            { id: 'rem-2', deadlineId: 'dl-1', type: 'in_app', timing: '30_days_before', sent: false },
            { id: 'rem-3', deadlineId: 'dl-1', type: 'email', timing: '1_week_before', sent: false },
          ],
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
        {
          id: 'dl-2',
          contractId: 'contract-1',
          contractName: 'Master Services Agreement - Acme Corp',
          title: 'Contract Expiration',
          description: 'MSA expires - review for renewal or termination',
          type: 'expiration',
          date: '2025-01-14',
          timezone: 'America/New_York',
          status: 'upcoming',
          assignee: 'user-1',
          reminders: [
            { id: 'rem-4', deadlineId: 'dl-2', type: 'email', timing: '90_days_before', sent: false },
            { id: 'rem-5', deadlineId: 'dl-2', type: 'in_app', timing: '30_days_before', sent: false },
          ],
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
        {
          id: 'dl-3',
          contractId: 'contract-3',
          contractName: 'Software License Agreement - DataFlow Ltd',
          title: 'License Renewal Decision',
          description: 'Decide on renewal for DataFlow enterprise license',
          type: 'renewal',
          date: '2027-03-01',
          timezone: 'America/Los_Angeles',
          status: 'upcoming',
          assignee: 'user-2',
          reminders: [
            { id: 'rem-6', deadlineId: 'dl-3', type: 'email', timing: '90_days_before', sent: false },
          ],
          createdAt: '2024-05-15T09:00:00Z',
          updatedAt: '2024-05-15T09:00:00Z',
        },
      ];
      saveToStorage(STORAGE_KEYS.deadlines, defaultDeadlines);
    }
  },
};