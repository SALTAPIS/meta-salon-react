import React from 'react';
import { useAuthContext } from '../auth/AuthProvider';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold text-indigo-600">{value}</dd>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

export function UserStats() {
  const { user } = useAuthContext();

  if (!user) return null;

  const stats = [
    {
      label: 'Total Balance',
      value: `${user.balance} SLN`,
      description: 'Available tokens for voting and rewards'
    },
    {
      label: 'Submissions',
      value: '12', // TODO: Fetch from API
      description: 'Total challenge entries submitted'
    },
    {
      label: 'Votes Cast',
      value: '48', // TODO: Fetch from API
      description: 'Total votes in challenges'
    },
    {
      label: 'Rewards Earned',
      value: '320 SLN', // TODO: Fetch from API
      description: 'Total rewards from challenges'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Activity Overview</h2>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
          />
        ))}
      </dl>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {/* TODO: Replace with actual activity data */}
            <li className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Submitted Entry</p>
                  <p className="text-sm text-gray-500">Challenge: Digital Art Masters</p>
                </div>
                <p className="text-sm text-gray-500">2 days ago</p>
              </div>
            </li>
            <li className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Earned Reward</p>
                  <p className="text-sm text-gray-500">+50 SLN from challenge participation</p>
                </div>
                <p className="text-sm text-gray-500">5 days ago</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 