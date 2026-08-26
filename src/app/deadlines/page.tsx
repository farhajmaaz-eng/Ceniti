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
import { formatDate, getTypeLabel, getDeadlineStatus, cn } from '@/lib/utils';
import type { Deadline, DeadlineType, DeadlineStatus } from '@/lib/types';

const DEADLINE_TYPES: { value: DeadlineType; label: string }[] = [
  { value: 'expiration', label: 'Expiration' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'termination_notice', label: 'Termination Notice' },
  { value: 'payment', label: 'Payment' },
  { value: 'deliverable', label: 'Deliverable' },
  { value: 'review', label: 'Review' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'audit', label: 'Audit' },
  { value: 'custom', label: 'Custom' },
];

const DEADLINE_STATUSES: { value: DeadlineStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const REMINDER_TIMINGS = [
  { value: '90_days_before', label: '90 days before' },
  { value: '30_days_before', label: '30 days before' },
  { value: '14_days_before', label: '2 weeks before' },
  { value: '7_days_before', label: '1 week before' },
  { value: '3_days_before', label: '3 days before' },
  { value: '1_day_before', label: '1 day before' },
  { value: 'on_day', label: 'On the day' },
];

function DeadlinesContent() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [contracts, setContracts] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [formData, setFormData] = useState<Partial<Deadline>>({
    contractId: '',
    title: '',
    description: '',
    type: 'expiration',
    date: '',
    time: '',
    timezone: 'America/New_York',
    status: 'upcoming',
    assignee: '',
    reminders: [],
  });
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    storage.initializeDefaults();
    setDeadlines(storage.deadlines.getAll());
    setContracts(storage.contracts.getAll().map(c => ({ id: c.id, name: c.name })));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleOpenCreate = () => {
    setEditingDeadline(null);
    setFormData({
      contractId: contracts[0]?.id || '',
      title: '',
      description: '',
      type: 'expiration',
      date: new Date().toISOString().split('T')[0],
      time: '',
      timezone: 'America/New_York',
      status: 'upcoming',
      assignee: '',
      reminders: [
        { type: 'email', timing: '30_days_before' },
        { type: 'in_app', timing: '7_days_before' },
        { type: 'email', timing: '1_day_before' },
      ],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setFormData({
      contractId: deadline.contractId,
      title: deadline.title,
      description: deadline.description,
      type: deadline.type,
      date: deadline.date,
      time: deadline.time || '',
      timezone: deadline.timezone,
      status: deadline.status,
      assignee: deadline.assignee || '',
      reminders: deadline.reminders.map(r => ({ type: r.type, timing: r.timing })),
    });
    setIsModalOpen(true);
  };

  const handleReminderChange = (index: number, field: 'type' | 'timing', value: string) => {
    const newReminders = [...formData.reminders];
    newReminders[index] = { ...newReminders[index], [field]: value };
    setFormData({ ...formData, reminders: newReminders });
  };

  const addReminder = () => {
    setFormData({ ...formData, reminders: [...formData.reminders, { type: 'email', timing: '7_days_before' }] });
  };

  const removeReminder = (index: number) => {
    setFormData({ ...formData, reminders: formData.reminders.filter((_, i) => i !== index) });
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
      type: formData.type!,
      date: formData.date!,
      time: formData.time || undefined,
      timezone: formData.timezone!,
      status: formData.status!,
      assignee: formData.assignee || undefined,
      reminders: formData.reminders!.map((r, i) => ({
        id: `rem-${Date.now()}-${i}`,
        deadlineId: '',
        type: r.type,
        timing: r.timing,
        sent: false,
      })),
    };

    if (editingDeadline) {
      storage.deadlines.update(editingDeadline.id, data);
    } else {
      storage.deadlines.save(data);
    }

    loadData();
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this deadline?')) {
      storage.deadlines.delete(id);
      loadData();
    }
  };

  const columns: Column<Deadline>[] = [
    { key: 'title', header: 'Deadline', render: (d) => (
      <div>
        <p className="font-medium">{d.title}</p>
        <p className="text-xs text-gray-500">{d.contractName}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (d) => <Badge variant="info" size="sm">{getTypeLabel(d.type)}</Badge> },
    { key: 'date', header: 'Date', render: (d) => (
      <div className={cn(getDaysUntil(d.date) <= 7 && getDeadlineStatus(d) !== 'completed' && 'text-red-600 font-medium')}>
        {formatDate(d.date)}
        {d.time && <span className="text-xs text-gray-500 ml-1">{d.time}</span>}
        <span className="text-xs text-gray-500 ml-1">({getDaysUntil(d.date) >= 0 ? getDaysUntil(d.date) + ' days' : Math.abs(getDaysUntil(d.date)) + ' days ago'})</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (d) => {
      const status = getDeadlineStatus(d);
      const variants: Record<DeadlineStatus, BadgeProps['variant']> = {
        upcoming: 'default',
        today: 'warning',
        overdue: 'danger',
        completed: 'success',
        cancelled: 'neutral',
      };
      return <Badge variant={variants[status]} dot>{status}</Badge>;
    }},
    { key: 'assignee', header: 'Assignee', render: (d) => d.assignee ? (
      storage.users.getById(d.assignee)?.name || d.assignee
    ) : '—' },
    { key: 'reminders', header: 'Reminders', render: (d) => (
      <div className="flex flex-wrap gap-1">
        {d.reminders.slice(0, 3).map(r => (
          <Badge key={r.id} variant="neutral" size="sm">
            {r.type}: {r.timing.replace('_', ' ')}
          </Badge>
        ))}
        {d.reminders.length > 3 && <Badge variant="neutral" size="sm">+{d.reminders.length - 3} more</Badge>}
      </div>
    )},
    { key: 'actions', header: 'Actions', render: (d) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(d); }}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} className="text-red-600 hover:text-red-700">
          Delete
        </Button>
      </div>
    )},
  ];

  return (
    <Layout>
      <div className="p-6">
        <PageHeader
          title="Deadlines"
          subtitle="Track critical dates and milestones across all contracts"
          action={<Button onClick={handleOpenCreate}>New Deadline</Button>}
        />

        <DataTable
          columns={columns}
          data={deadlines}
          keyAccessor={d => d.id}
          emptyMessage="No deadlines yet. Create your first deadline to get started."
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDeadline ? 'Edit Deadline' : 'New Deadline'}
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
                placeholder="e.g., Renewal Notice Deadline"
              />
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DeadlineType })}
                options={DEADLINE_TYPES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label="Time (optional)"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
              <Select
                label="Timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                options={[
                  { value: 'America/New_York', label: 'Eastern (NY)' },
                  { value: 'America/Chicago', label: 'Central (Chicago)' },
                  { value: 'America/Denver', label: 'Mountain (Denver)' },
                  { value: 'America/Los_Angeles', label: 'Pacific (LA)' },
                  { value: 'Europe/London', label: 'London' },
                  { value: 'Europe/Paris', label: 'Paris' },
                  { value: 'Asia/Tokyo', label: 'Tokyo' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DeadlineStatus })}
                options={DEADLINE_STATUSES}
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
              placeholder="Details about this deadline..."
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reminders</label>
              <div className="space-y-2">
                {formData.reminders?.map((reminder, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={reminder.type}
                      onChange={(e) => handleReminderChange(index, 'type', e.target.value)}
                      options={[
                        { value: 'email', label: 'Email' },
                        { value: 'in_app', label: 'In-App' },
                        { value: 'slack', label: 'Slack' },
                      ]}
                      className="flex-1"
                    />
                    <Select
                      value={reminder.timing}
                      onChange={(e) => handleReminderChange(index, 'timing', e.target.value)}
                      options={REMINDER_TIMINGS}
                      className="flex-1"
                    />
                    {formData.reminders.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeReminder(index)} className="text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addReminder}>
                  Add Reminder
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingDeadline ? 'Save Changes' : 'Create Deadline'}
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

export default function DeadlinesPage() {
  return <DeadlinesContent />;
}