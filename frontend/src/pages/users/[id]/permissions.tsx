import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Save, Check, X } from 'lucide-react';
import { PageSkeleton } from '@/components/PageSkeleton';

interface Permission {
  action: string;
  resource: string;
  isGranted: boolean;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface RoleInfo {
  id: string;
  name: string;
}

const RESOURCES = ['Event', 'Registration', 'Financial', 'User', 'Rider', 'Horse', 'Club', 'Stable', 'Settings'];
const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Export'];

export default function UserPermissions() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [allRoles, setAllRoles] = useState<RoleInfo[]>([]);
  const [userRoleIds, setUserRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [permRes, rolesRes, userRolesRes] = await Promise.all([
        api.get(`/api/users/${id}/permissions`),
        api.get('/api/settings/roles'),
        api.get(`/api/users/${id}/roles`),
      ]);

      const data = permRes.data.data;
      setUser(data.user);

      // Build permission map
      const permMap: Record<string, boolean> = {};
      for (const perm of data.permissions) {
        permMap[`${perm.action}:${perm.resource}`] = perm.isGranted;
      }
      setPermissions(permMap);

      setAllRoles(rolesRes.data.data || []);
      setUserRoleIds((userRolesRes.data.data || []).map((r: RoleInfo) => r.id));
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (action: string, resource: string) => {
    const key = `${action}:${resource}`;
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllForResource = (resource: string) => {
    const allGranted = ACTIONS.every(a => permissions[`${a}:${resource}`]);
    setPermissions(prev => {
      const next = { ...prev };
      ACTIONS.forEach(a => { next[`${a}:${resource}`] = !allGranted; });
      return next;
    });
  };

  const toggleAllForAction = (action: string) => {
    const allGranted = RESOURCES.every(r => permissions[`${action}:${r}`]);
    setPermissions(prev => {
      const next = { ...prev };
      RESOURCES.forEach(r => { next[`${action}:${r}`] = !allGranted; });
      return next;
    });
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      const permArray: Permission[] = [];
      for (const resource of RESOURCES) {
        for (const action of ACTIONS) {
          const key = `${action}:${resource}`;
          permArray.push({ action, resource, isGranted: !!permissions[key] });
        }
      }
      await api.put(`/api/users/${id}/permissions`, { permissions: permArray });
      alert('Permissions saved successfully');
    } catch (error) {
      console.error('Failed to save permissions:', error);
      alert('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setUserRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const saveRoles = async () => {
    try {
      setSavingRoles(true);
      await api.put(`/api/users/${id}/roles`, { roleIds: userRoleIds });
      alert('Roles saved successfully');
    } catch (error) {
      console.error('Failed to save roles:', error);
      alert('Failed to save roles');
    } finally {
      setSavingRoles(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageSkeleton variant="detail" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/users" className="text-muted-foreground hover:text-on-surface">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Permissions & Roles</h1>
            <p className="text-muted-foreground mt-1">
              {user?.name} ({user?.email})
            </p>
          </div>
        </div>

        {/* Role Assignment */}
        <div className="bento-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-on-surface">Assigned Roles</h2>
            <button
              onClick={saveRoles}
              disabled={savingRoles}
              className="btn-primary flex items-center gap-2"
            >
              <Save /> {savingRoles ? 'Saving...' : 'Save Roles'}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {allRoles.map(role => (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  userRoleIds.includes(role.id)
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                {userRoleIds.includes(role.id) && <Check className="inline w-4 h-4 mr-1" />}
                {role.name}
              </button>
            ))}
            {allRoles.length === 0 && (
              <p className="text-muted-foreground text-sm">No roles defined. Create roles in Settings.</p>
            )}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="bento-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-on-surface">Permission Matrix</h2>
            <button
              onClick={savePermissions}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save /> {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Admin users bypass all permission checks. These permissions apply to non-admin users.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="label-tech text-left bg-surface-container/40">
                  <th className="p-3">Resource</th>
                  {ACTIONS.map(action => (
                    <th key={action} className="p-3 text-center">
                      <button
                        onClick={() => toggleAllForAction(action)}
                        className="hover:text-primary transition-colors"
                        title={`Toggle all ${action}`}
                      >
                        {action}
                      </button>
                    </th>
                  ))}
                  <th className="p-3 text-center">Toggle All</th>
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map(resource => (
                  <tr key={resource} className="border-b border-border/10 hover:bg-surface-container/20 transition-all">
                    <td className="px-3 py-3 font-medium text-on-surface">{resource}</td>
                    {ACTIONS.map(action => {
                      const key = `${action}:${resource}`;
                      const granted = !!permissions[key];
                      return (
                        <td key={action} className="px-3 py-3 text-center">
                          <button
                            onClick={() => togglePermission(action, resource)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              granted
                                ? 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30'
                                : 'bg-surface-container text-muted-foreground hover:bg-surface-bright border border-border/30'
                            }`}
                          >
                            {granted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => toggleAllForResource(resource)}
                        className="text-xs text-muted-foreground hover:text-primary underline"
                      >
                        toggle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
