'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Textarea } from '@/components/Textarea';
import { storage } from '@/lib/storage';
import { formatDate, getTypeLabel, getObligationStatus, cn } from '@/lib/utils';
import type { Obligation, ObligationCategory, ObligationStatus } from '@/lib/types';

const OBLIGATION_CATEGORIES: { value: ObligationCategory; label: string }[] = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'payment', label: 'Payment' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'confidentiality', label: 'Confidentiality' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'termination', label: 'Termination' },
  { value: 'other', label: 'Other' },
];

const OBLIGATION_STATUSES: { value: ObligationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'waived', label: 'Waived' },
  { value: 'breached', label: 'Breached' },
];

function ObligationsContent() {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [contracts, setContracts] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);
  const [formData, setFormData] = useState<Partial<Obligation>>({
    contractId: '',
    title: '',
    description: '',
    category: 'delivery',
    party: 'us',
    status: 'pending',
    dueDate: '',
    assignee: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    storage.initializeDefaults();
    setObligations(storage.obligations.getAll());
    setContracts(storage.contracts.getAll().map(c => ({ id: c.id, name: c.name })));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleOpenCreate = () => {
    setEditingObligation(null);
    setFormData({
      contractId: contracts[0]?.id || '',
      title: '',
      description: '',
      category: 'delivery',
      party: 'us',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0],
      assignee: '',
      priority: 'medium',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (obligation: Obligation) => {
    setEditingObligation(obligation);
    setFormData({
      contractId: obligation.contractId,
      title: obligation.title,
      description: obligation.description,
      category: obligation.category,
      party: obligation.party,
      status: obligation.status,
      dueDate: obligation.dueDate,
      assignee: obligation.assignee || '',
      priority: obligation.priority,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const contract = storage.contracts.getById(formData.contractId!);
    
    const data = {
      contractId: formData.contractId!,
      contractName: contract?.name || '',
      title: formData.title!,
      description: formData.description!,
      category: formData.category!,
      party: formData.party!,
      status: formData.status!,
      dueDate: formData.dueDate!,
      assignee: formData.assignee || undefined,
      priority: formData.priority!,
    };

    if (editingObligation) {
      storage.obligations.update(editingObligation.id, data);
    } else {
      storage.obligations.save(data);
    }

    loadData();
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this obligation?')) {
      storage.obligations.delete(id);
      loadData();
    }
  };

  const columns: Column<Obligation>[] = [
    { key: 'title', header: 'Obligation', render: (o) => (
      <div>
        <p className="font-medium">{o.title}</p>
        <p className="text-xs text-gray-500">{o.contractName}</p>
      </div>
    )},
    { key: 'category', header: 'Category', render: (o) => <Badge variant="neutral" size="sm">{getTypeLabel(o.category)}</Badge> },
    { key: 'party', header: 'Party', render: (o) => {
      const variants = { us: 'info', counterparty: 'warning', both: 'success' } as const;
      return <Badge variant={variants[o.party]} size="sm">{o.party === 'us' ? 'Us' : o.party === 'counterparty' ? 'Them' : 'Both'}</Badge>;
    }},
    { key: 'status', header: 'Status', render: (o) => {
      const status = getObligationStatus(o);
      const variants: Record<ObligationStatus, BadgeProps['variant']> = {
        pending: 'neutral',
        in_progress: 'info',
        completed: 'success',
        overdue: 'danger',
        waived: 'warning',
        breached: 'danger',
      };
      return <Badge variant={variants[status]} dot>{status.replace('_', ' ')}</Badge>;
    }},
    { key: 'dueDate', header: 'Due Date', render: (o) => (
      <div className={cn(getDaysUntil(o.dueDate) < 0 && getObligationStatus(o) !== 'completed' && 'text-red-600 font-medium')}>
        {formatDate(o.dueDate)}
        <span className="text-xs text-gray-500 ml-1">({getDaysUntil(o.dueDate) >= 0 ? getDaysUntil(o.dueDate) + ' days' : Math.abs(getDaysUntil(o.dueDate)) + ' days ago'})</span>
      </div>
    )},
    { key: 'priority', header: 'Priority', render: (o) => {
      const variants: Record<string, BadgeProps['variant']> = {
        low: 'neutral',
        medium: 'info',
        high: 'warning',
        critical: 'danger',
      };
      return <Badge variant={variants[o.priority]} size="sm">{o.priority}</Badge>;
    }},
    { key: 'assignee', header: 'Assignee', render: (o) => o.assignee ? (
      storage.users.getById(o.assignee)?.name || o.assignee
    ) : '—' },
    { key: 'actions', header: 'Actions', render: (o) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(o); }}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }} className="text-red-600 hover:text-red-700">
          Delete
        </Button>
      </div>
    )},
  ];

  return (
    <Layout>
      <div className="p-6">
        <PageHeader
          title="Obligations"
          subtitle="Track all contractual obligations and commitments"
          action={<Button onClick={handleOpenCreate}>New Obligation</Button>}
        />

        <DataTable
          columns={columns}
          data={obligations}
          keyAccessor={o => o.id}
          emptyMessage="No obligations yet. Create your first obligation to get started."
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingObligation ? 'Edit Obligation' : 'New Obligation'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Contract"
              value={formData.contractId}
              onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
              options={contracts.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select a contract"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Deliver Q3 Status Report"
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ObligationCategory })}
                options={OBLIGATION_CATEGORIES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Party"
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value as 'us' | 'counterparty' | 'both' })}
                options={[
                  { value: 'us', label: 'Us' },
                  { value: 'counterparty', label: 'Counterparty' },
                  { value: 'both', label: 'Both' },
                ]}
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ObligationStatus })}
                options={OBLIGATION_STATUSES}
              />
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
              <Select
                label="Assignee"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...storage.users.getAll().map(u => ({ value: u.id, label: u.name })),
                ]}
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the obligation..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingObligation ? 'Save Changes' : 'Create Obligation'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
}

export default function ObligationsPage() {
  return <ObligationsContent />;
}