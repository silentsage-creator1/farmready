import { createClient } from '@supabase/supabase-js';
import { FARM_PERMISSIONS, FARM_USER_TYPES, FarmUserType, PermissionOverrides, resolveProjectPermissions } from '../../src/access/permissionTemplates.ts';

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

const memberTypes = FARM_USER_TYPES.filter(type => type !== 'Farm Owner');
const errorResponse = (res: ResponseLike, status: number, message: string) => res.status(status).json({ error: message });

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asOverrides(value: unknown): PermissionOverrides {
  const object = asObject(value);
  return Object.fromEntries(FARM_PERMISSIONS.filter(permission => typeof object[permission] === 'boolean').map(permission => [permission, object[permission]])) as PermissionOverrides;
}

function asMemberType(value: unknown): Exclude<FarmUserType, 'Farm Owner'> | null {
  return typeof value === 'string' && memberTypes.includes(value as Exclude<FarmUserType, 'Farm Owner'>)
    ? value as Exclude<FarmUserType, 'Farm Owner'>
    : null;
}

function getBearerToken(req: RequestLike): string | null {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Authorization');
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method ?? '')) return errorResponse(res, 405, 'Method not allowed.');

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceKey) return errorResponse(res, 503, 'Supabase server access is not configured. Add the project URL, publishable key, and a server-only secret key.');

  const token = getBearerToken(req);
  if (!token) return errorResponse(res, 401, 'Sign in to manage farm access.');
  const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return errorResponse(res, 401, 'Your session is invalid or has expired. Sign in again.');

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = asObject(req.body);
  const project = asObject(body.project);
  const projectId = String(body.projectId ?? project.id ?? req.query?.projectId ?? '').trim();
  if (!projectId) return errorResponse(res, 400, 'Choose a farm project.');

  const { data: existingProject, error: projectError } = await admin.from('farm_projects').select('id,owner_id').eq('id', projectId).maybeSingle();
  if (projectError) return errorResponse(res, 500, 'Could not check project ownership.');
  if (existingProject && existingProject.owner_id !== authData.user.id) return errorResponse(res, 403, 'Only the farm owner can manage its access.');

  if (!existingProject) return errorResponse(res, 404, 'Save this farm under your account before managing its access.');
  if (existingProject && req.method === 'POST' && Object.keys(asObject(project.snapshot)).length) {
    const name = String(project.name ?? '').trim();
    const farmType = String(project.farmType ?? '').trim() || 'Farm';
    const { error: updateProjectError } = await admin.from('farm_projects').update({ snapshot: { id: projectId, name, farmType }, name, farm_type: farmType, updated_at: new Date().toISOString() }).eq('id', projectId);
    if (updateProjectError) return errorResponse(res, 500, 'Could not update the shared farm record.');
  }

  if (req.method === 'GET') {
    const { data, error } = await admin.from('farm_project_members').select('id,project_id,user_id,invited_email,display_name,user_type,permission_overrides,permissions,status,invited_at,updated_at').eq('project_id', projectId).order('invited_at', { ascending: false });
    if (error) return errorResponse(res, 500, 'Could not load project access.');
    return res.status(200).json({ members: data ?? [] });
  }

  if (req.method === 'POST') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const userType = asMemberType(body.userType);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !userType) return errorResponse(res, 400, 'Enter a valid email and choose a user type.');
    const overrides = asOverrides(body.permissionOverrides);
    const permissions = resolveProjectPermissions(userType, overrides);
    const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    if (!appUrl) return errorResponse(res, 503, 'Set APP_URL in the server environment so invitation links return to FarmReady.');
    const redirectTo = `${appUrl.replace(/\/+$/, '')}/team-access`;

    let inviteUserId: string | null = null;
    let inviteStatus: 'pending' | 'active' = 'pending';
    const { data: inviteResult, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (!inviteError && inviteResult.user) {
      inviteUserId = inviteResult.user.id;
    } else {
      // An existing FarmReady account should receive access without being invited twice.
      let existingUser = null;
      for (let page = 1; page <= 20 && !existingUser; page += 1) {
        const { data: users, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (listError) return errorResponse(res, 500, 'Could not check the invited account.');
        existingUser = users.users.find(user => user.email?.toLowerCase() === email) ?? null;
        if (users.users.length < 1000) break;
      }
      if (!existingUser) return errorResponse(res, 400, inviteError?.message || 'Could not send the invitation email.');
      inviteUserId = existingUser.id;
      if (existingUser.email_confirmed_at) inviteStatus = 'active';
    }

    const { data: member, error: memberError } = await admin.from('farm_project_members').upsert({
      project_id: projectId,
      user_id: inviteUserId,
      invited_email: email,
      display_name: String(body.displayName ?? '').trim() || null,
      user_type: userType,
      permission_overrides: overrides,
      permissions,
      status: inviteStatus,
      invited_by: authData.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id,invited_email' }).select('id,project_id,user_id,invited_email,display_name,user_type,permission_overrides,permissions,status,invited_at,updated_at').single();
    if (memberError) return errorResponse(res, 500, 'The invitation was sent, but access could not be saved. Contact the project owner before sending another invite.');
    return res.status(201).json({ member, invitationSent: inviteStatus === 'pending' });
  }

  const memberId = String(body.memberId ?? req.query?.memberId ?? '').trim();
  if (!memberId) return errorResponse(res, 400, 'Choose a project member.');
  const { data: existingMember, error: memberLookupError } = await admin.from('farm_project_members').select('id,user_type').eq('id', memberId).eq('project_id', projectId).maybeSingle();
  if (memberLookupError) return errorResponse(res, 500, 'Could not check the selected project member.');
  if (!existingMember) return errorResponse(res, 404, 'Project member not found.');

  if (req.method === 'PATCH') {
    const userType = asMemberType(body.userType);
    if (!userType) return errorResponse(res, 400, 'Choose a valid user type.');
    const overrides = asOverrides(body.permissionOverrides);
    const permissions = resolveProjectPermissions(userType, overrides);
    const { data, error } = await admin.from('farm_project_members').update({ user_type: userType, permission_overrides: overrides, permissions, display_name: String(body.displayName ?? '').trim() || null, updated_at: new Date().toISOString() }).eq('id', memberId).eq('project_id', projectId).select('id,project_id,user_id,invited_email,display_name,user_type,permission_overrides,permissions,status,invited_at,updated_at').single();
    if (error) return errorResponse(res, 500, 'Could not update this person’s permissions.');
    return res.status(200).json({ member: data });
  }

  const { data, error } = await admin.from('farm_project_members').update({ status: 'revoked', permissions: [], updated_at: new Date().toISOString() }).eq('id', memberId).eq('project_id', projectId).select('id,project_id,user_id,invited_email,display_name,user_type,permission_overrides,permissions,status,invited_at,updated_at').single();
  if (error) return errorResponse(res, 500, 'Could not revoke this person’s access.');
  return res.status(200).json({ member: data });
}
