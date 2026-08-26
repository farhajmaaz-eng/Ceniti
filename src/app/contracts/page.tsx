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
import { formatDate, getTypeLabel, formatCurrency, cn } from '@/lib/utils';
import type { Contract, ContractType, ContractStatus } from '@/lib/types';

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'msa', label: 'MSA' },
  { value: 'nda', label: 'NDA' },
  { value: 'service_agreement', label: 'Service Agreement' },
  { value: 'employment', label: 'Employment' },
  { value: 'vendor', label: 'Vendor Agreement' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
];

const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'renewed', label: 'Renewed' },
];

function ContractsContent() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<Partial<Contract>>({
    name: '',
    counterparty: '',
    type: 'msa',
    status: 'draft',
    value: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    renewalDate: '',
    autoRenew: false,
    description: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  const loadContracts = () => {
    storage.initializeDefaults();
    setContracts(storage.contracts.getAll());
  };

  useEffect(() => {
    loadContracts();
    window.addEventListener('storage', loadContracts);
    return () => window.removeEventListener('storage', loadContracts);
  }, []);

  const handleOpenCreate = () => {
    setEditingContract(null);
    setFormData({
      name: '',
      counterparty: '',
      type: 'msa',
      status: 'draft',
      value: '',
      currency: 'USD',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      renewalDate: '',
      autoRenew: false,
      description: '',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name,
      counterparty: contract.counterparty,
      type: contract.type,
      status: contract.status,
      value: contract.value?.toString() || '',
      currency: contract.currency,
      startDate: contract.startDate,
      endDate: contract.endDate || '',
      renewalDate: contract.renewalDate || '',
      autoRenew: contract.autoRenew,
      description: contract.description,
      tags: contract.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name: formData.name!,
      counterparty: formData.counterparty!,
      type: formData.type!,
      status: formData.status!,
      value: formData.value ? parseFloat(formData.value) : undefined,
      currency: formData.currency!,
      startDate: formData.startDate!,
      endDate: formData.endDate || undefined,
      renewalDate: formData.renewalDate || undefined,
      autoRenew: formData.autoRenew!,
      description: formData.description!,
      tags: formData.tags!.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (editingContract) {
      storage.contracts.update(editingContract.id, data);
    } else {
      storage.contracts.save(data);
    }

    loadContracts();
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contract?')) {
      storage.contracts.delete(id);
      loadContracts();
    }
  };

  const columns: Column<Contract>[] = [
    { key: 'name', header: 'Contract', render: (c) => (
      <div>
        <p className="font-medium">{c.name}</p>
        <p className="text-xs text-gray-500">{c.counterparty}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (c) => <Badge variant="info" size="sm">{getTypeLabel(c.type)}</Badge> },
    { key: 'status', header: 'Status', render: (c) => {
      const variants: Record<ContractStatus, BadgeProps['variant']> = {
        draft: 'neutral',
        under_review: 'warning',
        approved: 'info',
        active: 'success',
        expired: 'danger',
        terminated: 'neutral',
        renewed: 'info',
      };
      return <Badge variant={variants[c.status]} dot>{c.status.replace('_', ' ')}</Badge>;
    }},
    { key: 'value', header: 'Value', render: (c) => formatCurrency(c.value, c.currency) },
    { key: 'startDate', header: 'Start', render: (c) => formatDate(c.startDate) },
    { key: 'endDate', header: 'End', render: (c) => c.endDate ? formatDate(c.endDate) : '—' },
    { key: 'actions', header: 'Actions', render: (c) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="text-red-600 hover:text-red-700">
          Delete
        </Button>
      </div>
    )},
  ];

  return (
    <Layout>
      <div className="p-6">
        <PageHeader
          title="Contracts"
          subtitle="Manage all your contracts in one place"
          action={<Button onClick={handleOpenCreate}>New Contract</Button>}
        />

        <DataTable
          columns={columns}
          data={contracts}
          keyAccessor={c => c.id}
          emptyMessage="No contracts yet. Create your first contract to get started."
          onRowClick={(c) => window.location.href = `/contracts/${c.id}`}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingContract ? 'Edit Contract' : 'New Contract'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contract Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Master Services Agreement - Acme Corp"
              />
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ContractType })}
                options={CONTRACT_TYPES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Counterparty"
                value={formData.counterparty}
                onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
                required
                placeholder="e.g., Acme Corporation"
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                options={CONTRACT_STATUSES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
              />
              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'CAD', label: 'CAD ($)' },
                  { value: 'AUD', label: 'AUD ($)' },
                ]}
              />
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <Input
                label="Renewal Date"
                type="date"
                value={formData.renewalDate}
                onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-renew</span>
                </label>
              </div>
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contract description, key terms, notes..."
              rows={3}
            />

            <Input
              label="Tags (comma separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="high-value, strategic, auto-renew"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingContract ? 'Save Changes' : 'Create Contract'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
}

export default function ContractsPage() {
  return <ContractsContent />;
}