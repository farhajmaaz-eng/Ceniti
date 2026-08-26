'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { storage } from '@/lib/storage';
import type { User } from '@/lib/types';

function SettingsContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'viewer',
  });

  const loadUsers = () => {
    storage.initializeDefaults();
    setUsers(storage.users.getAll());
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener('storage', loadUsers);
    return () => window.removeEventListener('storage', loadUsers);
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'viewer' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to backend
    // For now, we'll just update localStorage
    if (editingUser) {
      // Update existing user
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
      localStorage.setItem('ceniti_users', JSON.stringify(updated));
    } else {
      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formData.name!,
        email: formData.email!,
        role: formData.role!,
      };
      localStorage.setItem('ceniti_users', JSON.stringify([...users, newUser]));
    }
    loadUsers();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== id);
      localStorage.setItem('ceniti_users', JSON.stringify(updated));
      loadUsers();
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl">
        <PageHeader
          title="Settings"
          subtitle="Manage users and application settings"
        />

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-700">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Data Management</h4>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => {
                  if (confirm('This will reset all data to defaults. Are you sure?')) {
                    localStorage.clear();
                    loadUsers();
                  }
                }}>
                  Reset to Defaults
                </Button>
                <Button variant="outline" onClick={() => {
                  const data = {
                    contracts: storage.contracts.getAll(),
                    obligations: storage.obligations.getAll(),
                    deadlines: storage.deadlines.getAll(),
                    users: storage.users.getAll(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ceniti-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  Export Data
                </Button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Notifications</h4>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" defaultChecked />
                  <span className="text-sm text-gray-700">Email reminders for upcoming deadlines</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" defaultChecked />
                  <span className="text-sm text-gray-700">In-app notifications for overdue obligations</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                  <span className="text-sm text-gray-700">Weekly summary digest</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? 'Edit User' : 'Add User'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="john@company.com"
            />
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'viewer' })}
              options={[
                { value: 'admin', label: 'Admin - Full access' },
                { value: 'manager', label: 'Manager - Can edit contracts & obligations' },
                { value: 'viewer', label: 'Viewer - Read only' },
              ]}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Save Changes' : 'Add User'}
              </Button>
            </div          </form>
        </Modal>
      </div>
    </Layout>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}