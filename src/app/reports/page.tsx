'use client';

import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { storage } from '@/lib/storage';
import { getObligationStatus, getDeadlineStatus } from '@/lib/utils';
import type { Contract, Obligation, Deadline } from '@/lib/types';

function ReportsContent() {
  const contracts = storage.contracts.getAll();
  const obligations = storage.obligations.getAll();
  const deadlines = storage.deadlines.getAll();

  const contractsByStatus = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contractsByType = contracts.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const obligationsByStatus = obligations.reduce((acc, o) => {
    const status = getObligationStatus(o);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const obligationsByCategory = obligations.reduce((acc, o) => {
    acc[o.category] = (acc[o.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
  const avgContractValue = contracts.length > 0 ? totalValue / contracts.length : 0;

  const upcomingRenewals = contracts.filter(c => 
    c.autoRenew && c.renewalDate && new Date(c.renewalDate) > new Date()
  ).length;

  return (
    <Layout>
      <div className="p-6">
        <PageHeader
          title="Reports"
          subtitle="Analytics and insights on your contract portfolio"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Contract Value"
            value={`$${(totalValue / 1000000).toFixed(1)}M`}
            subtitle={contracts.length > 0 ? `${contracts.length} contracts` : 'No contracts'}
            color="blue"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            title="Avg Contract Value"
            value={`$${(avgContractValue / 1000).toFixed(0)}K`}
            subtitle="Mean value across portfolio"
            color="green"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <StatCard
            title="Upcoming Renewals"
            value={upcomingRenewals}
            subtitle="Auto-renew contracts"
            color="yellow"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          />
          <StatCard
            title="Active Obligations"
            value={obligations.filter(o => getObligationStatus(o) !== 'completed' && getObligationStatus(o) !== 'waived').length}
            subtitle="Pending & in progress"
            color="purple"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contracts by Status</h3>
            <div className="space-y-3">
              {Object.entries(contractsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-gray-600">{status.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-900 rounded-full transition-all"
                        style={{ width: `${(count / contracts.length) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contracts by Type</h3>
            <div className="space-y-3">
              {Object.entries(contractsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-600">{type.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${(count / contracts.length) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Obligations by Status</h3>
            <div className="space-y-3">
              {Object.entries(obligationsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-gray-600">{status.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${(count / obligations.length) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Obligations by Category</h3>
            <div className="space-y-3">
              {Object.entries(obligationsByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-600">{category}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${(count / obligations.length) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ReportsPage() {
  return <ReportsContent />;
}