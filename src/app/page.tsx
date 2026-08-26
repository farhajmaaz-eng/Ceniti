'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { DataTable, Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { storage } from '@/lib/storage';
import { formatDate, getDaysUntil, getDeadlineStatus, getObligationStatus, getTypeLabel, formatCurrency, cn } from '@/lib/utils';
import type { Contract, Obligation, Deadline, DashboardStats } from '@/lib/types';

function DashboardContent() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    expiringSoon: 0,
    overdueObligations: 0,
    upcomingDeadlines: 0,
    completedThisMonth: 0,
  });

  const loadData = () => {
    storage.initializeDefaults();
    const c = storage.contracts.getAll();
    const o = storage.obligations.getAll();
    const d = storage.deadlines.getAll();
    
    setContracts(c);
    setObligations(o);
    setDeadlines(d);

    const activeContracts = c.filter(c => c.status === 'active').length;
    const expiringSoon = c.filter(c => {
      if (!c.endDate || c.status !== 'active') return false;
      return getDaysUntil(c.endDate!) <= 90 && getDaysUntil(c.endDate!) >= 0;
    }).length;
    const overdueObligations = o.filter(o => getObligationStatus(o) === 'overdue').length;
    const upcomingDeadlines = d.filter(d => getDeadlineStatus(d) === 'upcoming' || getDeadlineStatus(d) === 'today').length;
    const completedThisMonth = o.filter(o => {
      if (o.status !== 'completed' || !o.completedDate) return false;
      const completed = new Date(o.completedDate);
      const now = new Date();
      return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
    }).length;

    setStats({
      totalContracts: c.length,
      activeContracts,
      expiringSoon,
      overdueObligations,
      upcomingDeadlines,
      completedThisMonth,
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const upcomingDeadlinesData = [...deadlines]
    .filter(d => getDeadlineStatus(d) === 'upcoming' || getDeadlineStatus(d) === 'today')
    .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))
    .slice(0, 5);

  const overdueObligationsData = [...obligations]
    .filter(o => getObligationStatus(o) === 'overdue')
    .sort((a, b) => getDaysUntil(a.dueDate) - getDaysUntil(b.dueDate))
    .slice(0, 5);

  const recentContractsData = [...contracts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const deadlineColumns: Column<Deadline>[] = [
    { key: 'title', header: 'Deadline', render: (d) => (
      <div>
        <p className="font-medium">{d.title}</p>
        <p className="text-xs text-gray-500">{d.contractName}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (d) => <Badge variant="info" size="sm">{getTypeLabel(d.type)}</Badge> },
    { key: 'date', header: 'Date', render: (d) => (
      <div className={cn(getDaysUntil(d.date) <= 7 && 'text-red-600 font-medium')}>
        {formatDate(d.date)}
        <span className="text-xs text-gray-500 ml-1">({getDaysUntil(d.date) >= 0 ? getDaysUntil(d.date) + ' days' : Math.abs(getDaysUntil(d.date)) + ' days ago'})</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (d) => <Badge variant={getDeadlineStatus(d) === 'overdue' ? 'danger' : getDeadlineStatus(d) === 'today' ? 'warning' : 'default'} dot>{getDeadlineStatus(d)}</Badge> },
  ];

  const obligationColumns: Column<Obligation>[] = [
    { key: 'title', header: 'Obligation', render: (o) => (
      <div>
        <p className="font-medium">{o.title}</p>
        <p className="text-xs text-gray-500">{o.contractName}</p>
      </div>
    )},
    { key: 'category', header: 'Category', render: (o) => <Badge variant="neutral" size="sm">{getTypeLabel(o.category)}</Badge> },
    { key: 'party', header: 'Party', render: (o) => <Badge variant={o.party === 'us' ? 'info' : o.party === 'counterparty' ? 'warning' : 'success'} size="sm">{o.party === 'us' ? 'Us' : o.party === 'counterparty' ? 'Them' : 'Both'}</Badge> },
    { key: 'dueDate', header: 'Due', render: (o) => (
      <div className={cn(getDaysUntil(o.dueDate) < 0 && 'text-red-600 font-medium')}>
        {formatDate(o.dueDate)}
      </div>
    )},
    { key: 'status', header: 'Status', render: (o) => {
      const status = getObligationStatus(o);
      return <Badge variant={status === 'overdue' ? 'danger' : status === 'completed' ? 'success' : status === 'in_progress' ? 'info' : 'neutral'} dot>{status}</Badge>;
    }},
  ];

  const contractColumns: Column<Contract>[] = [
    { key: 'name', header: 'Contract', render: (c) => (
      <div>
        <p className="font-medium">{c.name}</p>
        <p className="text-xs text-gray-500">{c.counterparty}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (c) => <Badge variant="info" size="sm">{getTypeLabel(c.type)}</Badge> },
    { key: 'status', header: 'Status', render: (c) => <Badge variant={c.status === 'active' ? 'success' : c.status === 'draft' ? 'neutral' : c.status === 'expired' ? 'danger' : c.status === 'under_review' ? 'warning' : 'info'} dot>{c.status}</Badge> },
    { key: 'value', header: 'Value', render: (c) => formatCurrency(c.value, c.currency) },
    { key: 'endDate', header: 'End Date', render: (c) => c.endDate ? formatDate(c.endDate) : '—' },
  ];

  return (
    <Layout>
      <div className="p-6">
        <PageHeader 
          title="Dashboard" 
          subtitle="Overview of your contract lifecycle"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="Total Contracts"
            value={stats.totalContracts}
            subtitle="All contracts in system"
            color="blue"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <StatCard
            title="Active Contracts"
            value={stats.activeContracts}
            subtitle="Currently in effect"
            color="green"
            trend={{ value: 12, label: 'vs last month', positive: true }}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            subtitle="Within 90 days"
            color="yellow"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            title="Overdue Obligations"
            value={stats.overdueObligations}
            subtitle="Requires attention"
            color="red"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
          <StatCard
            title="Upcoming Deadlines"
            value={stats.upcomingDeadlines}
            subtitle="Next 30 days"
            color="purple"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            title="Completed This Month"
            value={stats.completedThisMonth}
            subtitle="Obligations fulfilled"
            color="gray"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/deadlines'}>
                View All
              </Button>
            </div>
            <DataTable
              columns={deadlineColumns}
              data={upcomingDeadlinesData}
              keyAccessor={d => d.id}
              emptyMessage="No upcoming deadlines"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overdue Obligations</h3>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/obligations'}>
                View All
              </Button>
            </div>
            <DataTable
              columns={obligationColumns}
              data={overdueObligationsData}
              keyAccessor={o => o.id}
              emptyMessage="No overdue obligations"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Contracts</h3>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/contracts'}>
              View All
            </Button>
          </div>
          <DataTable
            columns={contractColumns}
            data={recentContractsData}
            keyAccessor={c => c.id}
            emptyMessage="No contracts yet"
            onRowClick={(c) => window.location.href = `/contracts/${c.id}`}
          />
        </div>
      </div>
    </Layout>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}