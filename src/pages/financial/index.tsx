import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign } from 'react-icons/fi';

interface Transaction {
  id: string;
  registration: string;
  amount: number;
  status: string;
  date: string;
}

export default function Financial() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions([
      { id: '1', registration: 'REG-001', amount: 5000, status: 'PAID', date: '2026-02-15' },
      { id: '2', registration: 'REG-002', amount: 4500, status: 'PENDING', date: '2026-02-20' },
      { id: '3', registration: 'REG-003', amount: 3500, status: 'PAID', date: '2026-02-18' },
    ]);
  }, []);

  const totalRevenue = transactions
    .filter(t => t.status === 'PAID')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter(t => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Financial Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <FiTrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{pendingAmount.toLocaleString()}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <FiDollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div>
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{transactions.length}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Registration ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.registration}</td>
                  <td>₹{t.amount}</td>
                  <td>
                    <span className={`badge ${t.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
