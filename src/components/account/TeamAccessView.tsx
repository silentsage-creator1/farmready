import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronDown, LoaderCircle, LogIn, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  FARM_PERMISSION_TEMPLATES,
  FARM_PERMISSIONS,
  FARM_USER_TYPES,
  PERMISSION_PREREQUISITES,
  FarmPermission,
  FarmUserType,
  PermissionOverrides,
  resolvePermissions,
} from '../../access/permissionTemplates';

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string | null;
  invited_email: string;
  display_name: string | null;
  user_type: Exclude<FarmUserType, 'Farm Owner'>;
  permission_overrides: PermissionOverrides;
  permissions: FarmPermission[];
  status: 'pending' | 'active' | 'revoked';
  invited_at: string;
  updated_at: string;
}

const permissionLabels: Record<FarmPermission, string> = {
  'project.view': 'View farm overview', 'assessment.edit': 'Edit assessment',
  'market.view': 'View market information', 'market.edit': 'Edit market information',
  'financial.view': 'View financial information', 'financial.edit': 'Edit financial information',
  'production.view': 'View production information', 'production.edit': 'Edit production information',
  'people.view': 'View people and responsibilities', 'people.edit': 'Edit people and responsibilities',
  'information.view': 'View records and monitoring', 'information.edit': 'Edit records and monitoring',
  'infrastructure.view': 'View land and infrastructure', 'infrastructure.edit': 'Edit land and infrastructure',
  'inventory.view': 'View inventory', 'inventory.catalog.edit': 'Add or edit inventory items',
  'inventory.purchase.record': 'Record purchases', 'inventory.usage.record': 'Record usage',
  'inventory.loss.record': 'Record losses', 'inventory.adjust': 'Adjust stock counts',
  'inventory.delete': 'Delete inventory records', 'risk.view': 'View risk information',
  'risk.edit': 'Edit risk information', 'reports.view': 'View reports',
  'reports.export': 'Download or print reports', 'access.manage': 'Manage people and access',
  'project.delete': 'Delete this farm project',
};
const permissionGroups: { title: string; permissions: FarmPermission[] }[] = [
  { title: 'Project and assessment', permissions: ['project.view', 'assessment.edit'] },
  { title: 'Market', permissions: ['market.view', 'market.edit'] },
  { title: 'Financial information', permissions: ['financial.view', 'financial.edit'] },
  { title: 'Production information', permissions: ['production.view', 'production.edit'] },
  { title: 'People and responsibilities', permissions: ['people.view', 'people.edit'] },
  { title: 'Records and monitoring', permissions: ['information.view', 'information.edit'] },
  { title: 'Land and infrastructure', permissions: ['infrastructure.view', 'infrastructure.edit'] },
  { title: 'Inventory', permissions: ['inventory.view', 'inventory.catalog.edit', 'inventory.purchase.record', 'inventory.usage.record', 'inventory.loss.record', 'inventory.adjust', 'inventory.delete'] },
  { title: 'Risk and reports', permissions: ['risk.view', 'risk.edit', 'reports.view', 'reports.export'] },
  { title: 'Administration', permissions: ['access.manage', 'project.delete'] },
];
const memberTypes = FARM_USER_TYPES.filter((type): type is Exclude<FarmUserType, 'Farm Owner'> => type !== 'Farm Owner');
const inputClass = 'mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm';

export const TeamAccessView: React.FC = () => {
  const { allProjects, currentProject, userProfile, cloudSyncLoading } = useFarmProject();
  const { configured, session, user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [projectId, setProjectId] = useState(currentProject.id);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projectAccessState, setProjectAccessState] = useState<'checking' | 'owner' | 'not-owner' | 'not-synced'>('checking');
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<Exclude<FarmUserType, 'Farm Owner'>>('Farm Manager');
  const [overrides, setOverrides] = useState<PermissionOverrides>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const selectedProject = allProjects.find(project => project.id === projectId);
  const selectedPermissions = useMemo(() => new Set(resolvePermissions(userType, overrides)), [userType, overrides]);

  useEffect(() => {
    if (allProjects.length && !allProjects.some(project => project.id === projectId)) {
      const preferredProjectId = allProjects.some(project => project.id === currentProject.id) ? currentProject.id : allProjects[0].id;
      setProjectId(preferredProjectId);
    }
  }, [allProjects, currentProject.id, projectId]);

  const getSessionToken = async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) throw new Error('Please sign in again to manage project access.');
    return data.session.access_token;
  };

  const loadMembers = async (targetProjectId: string, signal?: AbortSignal, retryUnregistered = true) => {
    if (!session || !supabase || !targetProjectId) { setMembers([]); setProjectAccessState('checking'); return; }
    setMembersLoading(true); setError('');
    setProjectAccessState('checking');
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/team/access?projectId=${encodeURIComponent(targetProjectId)}`, { headers: { Authorization: `Bearer ${token}` }, signal });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 404) {
        setMembers([]); setProjectAccessState('not-synced');
        if (retryUnregistered && !signal?.aborted) window.setTimeout(() => { if (!signal?.aborted) void loadMembers(targetProjectId, signal, false); }, 1200);
        return;
      }
      if (response.status === 403) { setMembers([]); setProjectAccessState('not-owner'); return; }
      if (!response.ok) throw new Error(payload.error || 'Could not load this project’s people.');
      if (!signal?.aborted) { setMembers(Array.isArray(payload.members) ? payload.members : []); setProjectAccessState('owner'); }
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : 'Could not load project access.');
    } finally { if (!signal?.aborted) setMembersLoading(false); }
  };

  useEffect(() => {
    if (cloudSyncLoading) return;
    const controller = new AbortController();
    void loadMembers(projectId, controller.signal);
    return () => controller.abort();
  }, [projectId, session?.access_token, cloudSyncLoading]);

  const openNew = () => {
    if (projectAccessState !== 'owner') return;
    setEditingMemberId(null); setEmail(''); setDisplayName(''); setUserType('Farm Manager');
    setOverrides({}); setError(''); setNotice(''); setFormOpen(true);
  };

  const startEdit = (member: ProjectMember) => {
    setEditingMemberId(member.id); setEmail(member.invited_email); setDisplayName(member.display_name ?? '');
    setUserType(member.user_type); setOverrides(member.permission_overrides ?? {}); setError(''); setNotice(''); setFormOpen(true);
  };

  const changeRole = (value: Exclude<FarmUserType, 'Farm Owner'>) => { setUserType(value); setOverrides({}); };

  const changePermission = (permission: FarmPermission, checked: boolean) => {
    setOverrides(previous => {
      const next: PermissionOverrides = { ...previous, [permission]: checked };
      if (checked) {
        const prerequisite = PERMISSION_PREREQUISITES[permission];
        if (prerequisite) next[prerequisite] = true;
      } else {
        for (const [dependent, prerequisite] of Object.entries(PERMISSION_PREREQUISITES)) {
          if (prerequisite === permission) next[dependent as FarmPermission] = false;
        }
      }
      return next;
    });
  };

  const submitInviteOrUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProject) { setError('Create or select a farm project before inviting someone.'); return; }
    if (!editingMemberId && (!email.trim() || !email.includes('@'))) { setError('Enter a valid email address.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const token = await getSessionToken();
      const projectPayload = { id: selectedProject.id, name: selectedProject.name, farmType: selectedProject.farmType, snapshot: selectedProject };
      const response = await fetch('/api/team/access', {
        method: editingMemberId ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, project: projectPayload, memberId: editingMemberId, email: email.trim(), displayName: displayName.trim(), userType, permissionOverrides: overrides }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not save this person’s access.');
      setFormOpen(false); setEditingMemberId(null);
      setNotice(editingMemberId ? 'Permissions updated.' : payload.invitationSent ? `Invitation sent to ${email.trim()}.` : `Access granted to the existing account ${email.trim()}.`);
      await loadMembers(projectId);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save access.'); }
    finally { setSaving(false); }
  };

  const revokeMember = async (member: ProjectMember) => {
    if (!window.confirm(`Revoke ${member.invited_email}’s access to this farm?`)) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/team/access', { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, memberId: member.id }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not revoke access.');
      setNotice(`Access revoked for ${member.invited_email}.`);
      await loadMembers(projectId);
    } catch (revokeError) { setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke access.'); }
    finally { setSaving(false); }
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthBusy(true); setError(''); setAuthMessage('');
    try {
      if (authMode === 'signin') await signIn(authEmail.trim(), authPassword);
      else { await signUp(authEmail.trim(), authPassword); setAuthMessage('Check your email to confirm your account, then sign in.'); setAuthMode('signin'); }
    } catch (authError) { setError(authError instanceof Error ? authError.message : 'Authentication failed.'); }
    finally { setAuthBusy(false); }
  };

  if (authLoading) return <div className="mx-auto max-w-6xl rounded-2xl border bg-white p-8 text-sm text-neutral-600">Checking your sign-in…</div>;

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Project administration</p><h1 className="mt-1 text-2xl font-bold text-neutral-950">People &amp; access</h1><p className="mt-1 text-sm text-neutral-600">The farm owner invites people and sets each person’s individual permissions.</p></div>{session && <div className="flex items-center gap-3"><span className="max-w-56 truncate text-xs text-neutral-500">{user?.email}</span><button onClick={() => void signOut()} className="rounded-lg border px-3 py-2 text-xs font-semibold text-neutral-700">Sign out</button>{projectAccessState === 'owner' && <button onClick={openNew} disabled={!allProjects.length || saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-neutral-300"><Plus className="h-4 w-4" />Invite person</button>}</div>}</header>

    {!configured && <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Supabase sign-in is not configured.</p><p className="mt-1 text-xs">Add the Vite Supabase URL and publishable key to the app environment, then restart the development server.</p></div></div>}

    {configured && !session && <section className="mx-auto w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs sm:p-8"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><LogIn className="h-5 w-5" /></div><h2 className="text-lg font-bold text-neutral-950">{authMode === 'signin' ? 'Sign in to manage access' : 'Create your FarmReady account'}</h2><p className="mt-1 text-sm text-neutral-600">Use your email address and password to access FarmReady.</p><form onSubmit={submitAuth} className="mt-5 space-y-3"><label className="block text-xs font-semibold text-neutral-700">Email<input type="email" autoComplete="email" required value={authEmail} onChange={event => setAuthEmail(event.target.value)} className={inputClass} /></label><label className="block text-xs font-semibold text-neutral-700">Password<input type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={authPassword} onChange={event => setAuthPassword(event.target.value)} className={inputClass} /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}{authMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{authMessage}</p>}<button disabled={authBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-neutral-300">{authBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}{authMode === 'signin' ? 'Sign in' : 'Create account'}</button></form><button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setError(''); setAuthMessage(''); }} className="mt-4 w-full text-center text-xs font-semibold text-emerald-800">{authMode === 'signin' ? 'New to FarmReady? Create an account' : 'Already registered? Sign in'}</button></section>}

    {session && <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"><label className="block max-w-xl text-xs font-semibold text-neutral-700">Farm project<select value={projectId} onChange={event => setProjectId(event.target.value)} className={inputClass}>{allProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><p className="mt-2 text-[11px] text-neutral-500">Access is configured separately for each farm. A person may have different permissions on another farm.</p></section>
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && !formOpen && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="space-y-3">{membersLoading ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-neutral-500"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading project access…</div> : projectAccessState === 'not-owner' ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center"><Shield className="mx-auto h-8 w-8 text-amber-700" /><h2 className="mt-3 font-semibold text-amber-950">Only the farm owner can manage access</h2><p className="mt-1 text-sm text-amber-900">You can work only within the permissions the owner assigned to your account.</p></div> : projectAccessState === 'not-synced' ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center"><h2 className="font-semibold text-neutral-800">This farm is still syncing</h2><p className="mt-1 text-sm text-neutral-500">Wait for the farm workspace to finish syncing, then reopen People &amp; Access.</p></div> : members.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center"><Users className="mx-auto h-9 w-9 text-neutral-300" /><h2 className="mt-3 font-semibold text-neutral-800">No other people have access yet</h2><p className="mt-1 text-sm text-neutral-500">Invite someone and choose exactly what they can view or change.</p><button onClick={openNew} disabled={!allProjects.length || projectAccessState !== 'owner'} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-neutral-300">Invite person</button></div> : members.map(member => {
        const activePermissions = member.permissions ?? resolvePermissions(member.user_type, member.permission_overrides);
        const statusLabel = member.status === 'active' ? 'Active' : member.status === 'pending' ? 'Invitation pending' : 'Revoked';
        const statusStyle = member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : member.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-600';
        return <article key={member.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Users className="h-5 w-5" /></div><div><h2 className="font-bold text-neutral-900">{member.display_name || member.invited_email}</h2>{member.display_name && <p className="text-sm text-neutral-600">{member.invited_email}</p>}<p className="mt-1 text-xs text-neutral-500">{selectedProject?.name ?? 'Farm project'} · {member.user_type}</p><p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle}`}><Shield className="mr-1 h-3 w-3" />{statusLabel}</p></div></div>{member.status !== 'revoked' && <div className="flex gap-2"><button onClick={() => startEdit(member)} disabled={saving || projectAccessState !== 'owner'} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Edit permissions</button><button onClick={() => void revokeMember(member)} disabled={saving || projectAccessState !== 'owner'} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Revoke access</button></div>}</div><details className="mt-4 border-t border-neutral-100 pt-3"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-neutral-600"><span>{activePermissions.length} permissions {member.status === 'revoked' ? '(inactive)' : 'granted'}</span><ChevronDown className="h-4 w-4" /></summary><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{FARM_PERMISSIONS.map(permission => <div key={permission} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${activePermissions.includes(permission) && member.status !== 'revoked' ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-50 text-neutral-400'}`}><Check className={`h-3.5 w-3.5 shrink-0 ${activePermissions.includes(permission) && member.status !== 'revoked' ? '' : 'invisible'}`} />{permissionLabels[permission]}</div>)}</div></details></article>;
      })}</section>
    </>}

    {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-xs" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setFormOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Set project access" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"><header className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-3"><div><h2 className="text-lg font-bold text-neutral-950">{editingMemberId ? 'Edit person’s access' : 'Invite a person'}</h2><p className="mt-1 text-xs text-neutral-500">Choose a starting role, then customize permissions for this person.</p></div><button onClick={() => setFormOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-100">✕</button></header>
      <form onSubmit={submitInviteOrUpdate} className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-neutral-700">Farm project<select required value={projectId} onChange={event => setProjectId(event.target.value)} disabled={!!editingMemberId} className={inputClass}>{allProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="text-xs font-semibold text-neutral-700">Email address<input required type="email" value={email} disabled={!!editingMemberId} onChange={event => setEmail(event.target.value)} placeholder="person@example.com" className={inputClass} /></label><label className="text-xs font-semibold text-neutral-700">Name (optional)<input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Person’s name" className={inputClass} /></label><label className="text-xs font-semibold text-neutral-700">User type<select value={userType} onChange={event => changeRole(event.target.value as Exclude<FarmUserType, 'Farm Owner'>)} className={inputClass}>{memberTypes.map(type => <option key={type}>{type}</option>)}</select><span className="mt-1 block font-normal text-neutral-500">{FARM_PERMISSION_TEMPLATES[userType].description}</span></label></div>
        <div className="space-y-4">{permissionGroups.map(group => <fieldset key={group.title} className="rounded-xl border border-neutral-200 p-4"><legend className="px-1 text-sm font-bold text-neutral-800">{group.title}</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{group.permissions.map(permission => { const checked = selectedPermissions.has(permission); const disabled = permission === 'access.manage' || permission === 'project.delete'; return <label key={permission} className={`flex items-start gap-2 rounded-lg p-2 text-xs ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-neutral-50'}`}><input type="checkbox" checked={checked} disabled={disabled || saving} onChange={event => changePermission(permission, event.target.checked)} className="mt-0.5 accent-emerald-700" /><span>{permissionLabels[permission]}{disabled && <span className="block text-[10px] text-neutral-500">Owner only</span>}</span></label>; })}</div></fieldset>)}</div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2 border-t pt-4"><button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-neutral-300">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{editingMemberId ? 'Save permissions' : 'Send invitation'}</button></div>
      </form></section></div>}
  </div>;
};
