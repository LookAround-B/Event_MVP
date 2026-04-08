import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import {
  Search, Plus, Download, Eye, Edit, Trash2,
  Shield, Users, MapPin, Trophy,
} from 'lucide-react';
import FormModal from '@/components/FormModal';
import ExportModal from '@/components/ExportModal';
import ViewModal from '@/components/ViewModal';
import ConfirmModal from '@/components/ConfirmModal';
import Pagination from '@/components/Pagination';
import { FilterDropdown } from '@/components/FilterDropdown';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { exportToCSV, exportToExcel } from '@/utils/exportData';

interface Club {
  id: string;
  eId: string;
  name: string;
  shortCode: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstNumber: string;
  isActive: boolean;
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  _count?: { riders?: number };
}

const FORM_FIELDS = [
  { name: "name",               label: "Club Name",           type: "text"     as const, placeholder: "Enter club name", required: true },
  { name: "shortCode",          label: "Short Code",          type: "text"     as const, placeholder: "e.g. SETA", required: true },
  { name: "registrationNumber", label: "Registration Number", type: "text"     as const, placeholder: "Reg. no." },
  { name: "firstName",          label: "Contact First Name",  type: "text"     as const, required: true },
  { name: "lastName",           label: "Contact Last Name",   type: "text"     as const, required: true },
  { name: "email",              label: "Email",               type: "email"    as const, placeholder: "club@example.com", required: true },
  { name: "contactNumber",      label: "Phone Number",        type: "text"     as const, placeholder: "+91 98765 43210" },
  { name: "city",               label: "City",                type: "text"     as const, placeholder: "City" },
  { name: "state",              label: "State",               type: "text"     as const, placeholder: "State" },
  { name: "country",            label: "Country",             type: "text"     as const, placeholder: "India" },
  { name: "pincode",            label: "Pincode",             type: "text"     as const, placeholder: "400001" },
  { name: "gstNumber",          label: "GST Number",          type: "text"     as const, placeholder: "GST reg. number" },
  { name: "address",            label: "Address",             type: "textarea" as const, placeholder: "Club address..." },
];

const PER_PAGE = 5;

export default function ClubsList() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Club | null>(null);
  const [viewItem, setViewItem] = useState<Club | null>(null);
  const [deleteItem, setDeleteItem] = useState<Club | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, [page, search]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clubs', {
        params: { page, limit: PER_PAGE, search },
      });
      setClubs(response.data.clubs || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    const matchesState = selectedStates.length === 0 || (c.state && selectedStates.includes(c.state));
    return matchesState;
  });

  const uniqueStates = [...new Set(clubs.map(c => c.state).filter(Boolean))];

  const handleAdd = async (d: Record<string, string>) => {
    try {
      await api.post('/api/clubs', {
        name: d.name,
        shortCode: d.shortCode?.toUpperCase(),
        registrationNumber: d.registrationNumber,
        contactNumber: d.contactNumber,
        email: d.email,
        address: d.address,
        city: d.city,
        state: d.state,
        country: d.country,
        pincode: d.pincode,
        gstNumber: d.gstNumber,
        firstName: d.firstName,
        lastName: d.lastName,
      });
      toast.success('Club created successfully');
      setFormOpen(false);
      fetchClubs();
    } catch (error) {
      console.error('Failed to create club:', error);
      toast.error('Failed to create club');
    }
  };

  const handleEdit = async (d: Record<string, string>) => {
    if (!editItem) return;
    try {
      await api.put(`/api/clubs/${editItem.id}`, {
        name: d.name,
        shortCode: d.shortCode?.toUpperCase(),
        registrationNumber: d.registrationNumber,
        contactNumber: d.contactNumber,
        email: d.email,
        address: d.address,
        city: d.city,
        state: d.state,
        country: d.country,
        pincode: d.pincode,
        gstNumber: d.gstNumber,
        firstName: d.firstName,
        lastName: d.lastName,
      });
      toast.success('Club updated successfully');
      setEditItem(null);
      fetchClubs();
    } catch (error) {
      console.error('Failed to update club:', error);
      toast.error('Failed to update club');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/api/clubs/${deleteItem.id}`);
      toast.success('Club deleted successfully');
      setDeleteItem(null);
      fetchClubs();
    } catch (error) {
      console.error('Failed to delete club:', error);
      toast.error('Failed to delete club');
    }
  };

  const handleExport = (type: "csv" | "excel") => {
    const rows = clubs.map(c => ({
      name: c.name,
      eId: c.eId || '',
      shortCode: c.shortCode || '',
      firstName: c.primaryContact?.firstName || '',
      lastName: c.primaryContact?.lastName || '',
      email: c.email || c.primaryContact?.email || '',
      city: c.city || '',
      state: c.state || '',
    }));
    type === "csv" ? exportToCSV(rows, "clubs") : exportToExcel(rows, "clubs");
    setExportOpen(false);
    toast.success(`Clubs exported as ${type.toUpperCase()}`);
  };

  const getRiderCount = (club: Club) => club._count?.riders ?? 0;

  return (
    <ProtectedRoute>
      <Head><title>Clubs | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              Official <span className="gradient-text">Affiliates</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Manage institutional clusters and elite regional hubs. Monitor performance metrics and oversee regional club governance.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <KPIGrid>
          <KPICard
            title="Affiliate Clubs"
            value={total}
            icon={Shield}
            variant="primary"
            trend={{ value: `${total}`, isUp: true }}
            subText="Verified institutions"
            className="animate-slide-up-1"
          />
          <KPICard
            title="Total Athletes"
            value={clubs.reduce((acc, c) => acc + getRiderCount(c), 0).toLocaleString()}
            icon={Users}
            variant="outline"
            subText="Across all affiliates"
            className="animate-slide-up-2"
          />
          <KPICard
            title="Active Hubs"
            value={new Set(clubs.map(c => c.city).filter(Boolean)).size}
            icon={MapPin}
            variant="outline"
            subText="Major cities covered"
            className="animate-slide-up-3"
          />
          <KPICard
            title="Gold Tier"
            value={clubs.filter(c => c.isActive).length}
            icon={Trophy}
            variant="secondary"
            subText="Active clubs"
            className="animate-slide-up-4"
          />
        </KPIGrid>

        {/* Action Bar */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 w-full">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="search-input-icon absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="search-input-with-icon pr-4 py-3 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                  placeholder="Find affiliate..."
                />
              </div>
              <FilterDropdown
                label="State"
                options={uniqueStates.map(s => ({ label: s, value: s }))}
                selected={selectedStates}
                onChange={(vals) => { setSelectedStates(vals); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={() => setExportOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export Registry</span>
              </button>
              <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-initial justify-center transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Onboard Club
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="label-tech text-left bg-surface-container/40">
                  <th className="p-3 sm:p-4 w-12"><input type="checkbox" className="accent-primary rounded" /></th>
                  <th className="p-3 sm:p-4">Affiliate Identity</th>
                  <th className="p-3 sm:p-4">Geographic Node</th>
                  <th className="p-3 sm:p-4 text-center">Athletes</th>
                  <th className="p-3 sm:p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-4">
                        <div style={{ height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    </tr>
                  ))
                ) : filteredClubs.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-sm text-muted-foreground italic">No affiliate clubs registered in this cluster.</td></tr>
                ) : filteredClubs.map((club) => (
                  <tr key={club.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                    <td className="p-3 sm:p-4"><input type="checkbox" className="accent-primary rounded" /></td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-border/30">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface font-bold tracking-tight">{club.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-mono">{club.eId || '—'}</span>
                            {club.shortCode && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-black uppercase tracking-tighter border border-primary/20">{club.shortCode}</span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${club.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {club.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col">
                        <span className="text-on-surface-variant font-medium">{club.city || '—'}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{club.state || '—'}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{getRiderCount(club)}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Registered</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewItem(club)} title="Deep View" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setEditItem(club)} title="Configure" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteItem(club)} title="Revoke" className="p-2 rounded-lg hover:bg-destructive/10 text-on-surface-variant hover:text-destructive transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-surface-container/20 p-2 border-t border-border/10">
            <Pagination total={total} page={page} perPage={PER_PAGE} onChange={setPage} />
          </div>
        </div>

        {/* Modals */}
        <FormModal open={formOpen} onClose={() => setFormOpen(false)} title="Onboard New Club" fields={FORM_FIELDS} onSubmit={handleAdd} submitLabel="Add Club" />
        <FormModal
          open={!!editItem} onClose={() => setEditItem(null)} title="Edit Club" fields={FORM_FIELDS}
          initialData={editItem ? {
            name: editItem.name, shortCode: editItem.shortCode || '',
            registrationNumber: '',
            firstName: editItem.primaryContact?.firstName || '',
            lastName: editItem.primaryContact?.lastName || '',
            email: editItem.email || editItem.primaryContact?.email || '',
            contactNumber: editItem.contactNumber || '',
            city: editItem.city || '', state: editItem.state || '',
            country: editItem.country || '', pincode: editItem.pincode || '',
            gstNumber: editItem.gstNumber || '', address: editItem.address || '',
          } : {}}
          onSubmit={handleEdit} submitLabel="Save Changes"
        />
        <ViewModal
          open={!!viewItem} onClose={() => setViewItem(null)} title="Club Details"
          fields={viewItem ? [
            { label: "Club Name",            value: viewItem.name },
            { label: "Short Code",           value: viewItem.shortCode || '—' },
            { label: "Contact",              value: `${viewItem.primaryContact?.firstName || ''} ${viewItem.primaryContact?.lastName || ''}`.trim() || '—' },
            { label: "Email",                value: viewItem.email || viewItem.primaryContact?.email || '—' },
            { label: "Phone",                value: viewItem.contactNumber || '—' },
            { label: "City",                 value: viewItem.city || '—' },
            { label: "State",                value: viewItem.state || '—' },
            { label: "GST Number",           value: viewItem.gstNumber || '—' },
            { label: "EIRS ID",              value: viewItem.eId || '—' },
            { label: "Total Riders",         value: getRiderCount(viewItem) },
            { label: "Status",               value: viewItem.isActive ? 'Active' : 'Inactive' },
          ] : []}
        />
        <ConfirmModal
          open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
          title="Delete Club"
          description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        />
        <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} />
      </div>
    </ProtectedRoute>
  );
}
