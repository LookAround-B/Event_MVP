import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiDownload, FiFilter, FiChevronDown } from 'react-icons/fi';

interface EventDetail {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  description: string;
  venueName: string;
  venueAddress: string;
  termsAndConditions: string;
  isPublished: boolean;
}

interface Registration {
  id: string;
  rider: { firstName: string; lastName: string; email: string };
  horse: { name: string; color: string };
  club: { name: string };
  category: { name: string; price: number };
  paymentStatus: string;
  eventAmount: number;
  stableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

interface BookingDetailsModal {
  isOpen: boolean;
  registration?: Registration;
}

export default function EventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<BookingDetailsModal>({ isOpen: false });
  const [registeredCount, setRegisteredCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchEventDetail();
      fetchRegistrations();
    }
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await api.get(`/api/events/${id}`);
      setEvent(response.data.data);
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const params = new URLSearchParams({
        eventId: id as string,
        limit: '100',
      });
      const response = await api.get(`/api/registrations?${params}`);
      const allRegistrations = response.data.data?.registrations || [];
      setRegistrations(allRegistrations);
      setRegisteredCount(allRegistrations.length);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  const filteredRegistrations = filterPaymentStatus
    ? registrations.filter(r => r.paymentStatus === filterPaymentStatus)
    : registrations;

  const exportToCSV = () => {
    if (registrations.length === 0) {
      alert('No registrations to export');
      return;
    }

    const headers = [
      'Rider Name',
      'Email',
      'Horse Name',
      'Club Name',
      'Category',
      'Event Amount',
      'Stable Amount',
      'GST Amount',
      'Total Amount',
      'Payment Status',
    ];

    const rows = registrations.map(r => [
      `${r.rider.firstName} ${r.rider.lastName}`,
      r.rider.email,
      r.horse.name,
      r.club?.name || '-',
      r.category.name,
      r.eventAmount,
      r.stableAmount,
      r.gstAmount,
      r.totalAmount,
      r.paymentStatus,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name}-registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (registrations.length === 0) {
      alert('No registrations to export');
      return;
    }

    // Build XML Spreadsheet (opens natively in Excel)
    const escapeXml = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const headers = ['Rider Name', 'Email', 'Horse Name', 'Horse Color', 'Club Name', 'Category', 'Event Amount (₹)', 'Stable Amount (₹)', 'GST Amount (₹)', 'Total Amount (₹)', 'Payment Status'];

    const headerRow = headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('');

    const dataRows = registrations.map(r => {
      const cells = [
        { v: `${r.rider.firstName} ${r.rider.lastName}`, t: 'String' },
        { v: r.rider.email, t: 'String' },
        { v: r.horse.name, t: 'String' },
        { v: r.horse.color, t: 'String' },
        { v: r.club?.name || '-', t: 'String' },
        { v: r.category.name, t: 'String' },
        { v: r.eventAmount, t: 'Number' },
        { v: r.stableAmount, t: 'Number' },
        { v: r.gstAmount, t: 'Number' },
        { v: r.totalAmount, t: 'Number' },
        { v: r.paymentStatus, t: 'String' },
      ];
      return `<Row>${cells.map(c => `<Cell><Data ss:Type="${c.t}">${escapeXml(c.v)}</Data></Cell>`).join('')}</Row>`;
    });

    // Summary row
    const totalEvent = registrations.reduce((s, r) => s + r.eventAmount, 0);
    const totalStable = registrations.reduce((s, r) => s + r.stableAmount, 0);
    const totalGst = registrations.reduce((s, r) => s + r.gstAmount, 0);
    const grandTotal = registrations.reduce((s, r) => s + r.totalAmount, 0);

    const summaryRow = `<Row>
      <Cell><Data ss:Type="String">TOTAL</Data></Cell>
      <Cell><Data ss:Type="String"></Data></Cell><Cell><Data ss:Type="String"></Data></Cell><Cell><Data ss:Type="String"></Data></Cell><Cell><Data ss:Type="String"></Data></Cell><Cell><Data ss:Type="String"></Data></Cell>
      <Cell><Data ss:Type="Number">${totalEvent}</Data></Cell>
      <Cell><Data ss:Type="Number">${totalStable}</Data></Cell>
      <Cell><Data ss:Type="Number">${totalGst}</Data></Cell>
      <Cell><Data ss:Type="Number">${grandTotal}</Data></Cell>
      <Cell><Data ss:Type="String"></Data></Cell>
    </Row>`;

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Registrations">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows.join('\n      ')}
      ${summaryRow}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name}-registrations.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading event...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="text-center py-8">
          <p className="text-gray-600">Event not found</p>
          <Link href="/events" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Events
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/events" className="text-blue-600 hover:text-blue-900 flex items-center gap-2">
            <FiArrowLeft /> Back to Events
          </Link>
        </div>

        {/* DIV 1: Event Summary */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>

          <div className="p-6 -mt-16 relative">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Event Name</p>
                  <p className="text-2xl font-bold text-gray-900">{event.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Event Type</p>
                  <p className="text-lg font-semibold text-gray-900">{event.eventType}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-gray-900">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-gray-900">
                    {new Date(event.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    event.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.isPublished ? 'Published' : 'Not Published'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-700 mt-2">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Venue</p>
                  <p className="text-gray-900">{event.venueName}</p>
                  <p className="text-sm text-gray-600">{event.venueAddress}</p>
                </div>
                <div className="flex items-end">
                  <Link
                    href={`/events/${id}/stables`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    Manage Stables
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIV 2: Registered Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Registered Members</h2>
              <p className="text-sm text-gray-600 mt-1">{registeredCount} registrations</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FiDownload /> Export Excel
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiDownload /> Export CSV
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-600" />
              <select
                value={filterPaymentStatus || ''}
                onChange={e => setFilterPaymentStatus(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rider Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Club Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Horse</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map(reg => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-gray-900">
                          {reg.rider.firstName} {reg.rider.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{reg.rider.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{reg.club?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <p className="text-gray-900">{reg.horse.name}</p>
                        <p className="text-xs text-gray-600">{reg.horse.color}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{reg.category.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{reg.totalAmount}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          reg.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reg.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setBookingModal({ isOpen: true, registration: reg })}
                          className="text-blue-600 hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DIV 3: Terms & Conditions / Prospectus */}
        {event.termsAndConditions && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              {event.termsAndConditions}
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        {bookingModal.isOpen && bookingModal.registration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                  <button
                    onClick={() => setBookingModal({ isOpen: false })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Event</p>
                    <p className="font-semibold text-gray-900">{event.name}</p>
                  </div>

                  <div className="border-b pb-3">
                    <p className="text-gray-600">Rider</p>
                    <p className="font-semibold text-gray-900">
                      {bookingModal.registration.rider.firstName} {bookingModal.registration.rider.lastName}
                    </p>
                  </div>

                  <div className="border-b pb-3">
                    <p className="text-gray-600">Horse</p>
                    <p className="font-semibold text-gray-900">{bookingModal.registration.horse.name}</p>
                  </div>

                  <div className="border-b pb-3">
                    <p className="text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{bookingModal.registration.category.name}</p>
                  </div>

                  <div className="border-t pt-3 mt-4 space-y-2">
                    <div className="flex justify-between">
                      <p className="text-gray-600">Event Amount:</p>
                      <p className="font-semibold">₹{bookingModal.registration.eventAmount}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">Stable Amount:</p>
                      <p className="font-semibold">₹{bookingModal.registration.stableAmount}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">GST Amount:</p>
                      <p className="font-semibold">₹{bookingModal.registration.gstAmount}</p>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <p className="font-semibold text-gray-900">Total:</p>
                      <p className="font-bold text-lg text-blue-600">₹{bookingModal.registration.totalAmount}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-gray-600 mb-2">Payment Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      bookingModal.registration.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bookingModal.registration.paymentStatus}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setBookingModal({ isOpen: false })}
                  className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
