import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch } from 'react-icons/fi';

interface Registration {
  id: string;
  event: string;
  rider: string;
  horse: string;
  totalAmount: number;
  paymentStatus: string;
  registeredAt: string;
}

export default function Registrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setRegistrations([
      {
        id: '1',
        event: 'Spring Championship',
        rider: 'Arjun Singh',
        horse: 'Thunder',
        totalAmount: 5000,
        paymentStatus: 'PAID',
        registeredAt: '2026-02-15',
      },
      {
        id: '2',
        event: 'Regional Qualifier',
        rider: 'Priya Sharma',
        horse: 'Lady',
        totalAmount: 4500,
        paymentStatus: 'UNPAID',
        registeredAt: '2026-02-20',
      },
    ]);
  }, []);

  const filteredRegistrations = registrations.filter(r =>
    r.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Registrations</h2>

      <div className="mb-6 card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search registrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Rider</th>
              <th>Horse</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((reg) => (
              <tr key={reg.id}>
                <td className="font-medium">{reg.event}</td>
                <td>{reg.rider}</td>
                <td>{reg.horse}</td>
                <td>₹{reg.totalAmount}</td>
                <td>
                  <span className={`badge ${reg.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                    {reg.paymentStatus}
                  </span>
                </td>
                <td>{new Date(reg.registeredAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
