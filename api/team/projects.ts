import { createClient } from '@supabase/supabase-js';
import { FARM_PERMISSIONS, FarmPermission } from '../../src/access/permissionTemplates.ts';

type RequestLike = { method?: string; headers: Record<string, string | string[] | undefined>; query?: Record<string, string | string[] | undefined>; body?: unknown };
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };
type Access = { owner: boolean; permissions: Set<string> };
const sendError = (res: ResponseLike, status: number, message: string) => res.status(status).json({ error: message });
const object = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const arr = (value: unknown): any[] => Array.isArray(value) ? value : [];

function changedLeaves(before: unknown, patch: unknown, path = ''): string[] {
  const next = object(patch);
  const previous = object(before);
  if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
    return Object.keys(next).flatMap(key => changedLeaves(previous[key], next[key], path ? `${path}.${key}` : key));
  }
  return JSON.stringify(before) === JSON.stringify(patch) ? [] : [path];
}

function permissionForProjectPath(path: string): FarmPermission | null {
  const [root, child] = path.split('.');
  if (['id', 'name', 'farmType', 'stage', 'progress'].includes(root)) return 'assessment.edit';
  if (root === 'farmDetails') {
    return ['dailyManager', 'managementResponsibilities', 'farmingExperience'].includes(child) ? 'people.edit' : 'infrastructure.edit';
  }
  if (root === 'marketPlan') return 'market.edit';
  if (root === 'productionPlan') return 'production.edit';
  if (root === 'financialModel' || root === 'scenarios' || root === 'whatIf') return 'financial.edit';
  if (root === 'recordKeepingPlan') return 'information.edit';
  if (root === 'risks' || root === 'exitRedesignExpansion') return 'risk.edit';
  if (root === 'toolAnalysis') {
    if (child === 'risk') return 'risk.edit';
    if (child === 'production') return 'production.edit';
    return 'financial.edit';
  }
  return null;
}

function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => object(current)[key], value);
}

function writePath(target: Record<string, any>, path: string, value: unknown) {
  const parts = path.split('.');
  let current = target;
  for (const key of parts.slice(0, -1)) current = current[key] = { ...object(current[key]) };
  current[parts[parts.length - 1]] = value;
}

function filterProject(projectValue: unknown, permissions: Set<string>, owner: boolean): Record<string, any> {
  const project = object(projectValue);
  if (owner) return project;
  const visible: Record<string, any> = {};
  for (const key of ['id', 'name', 'farmType', 'stage', 'progress', 'createdAt', 'updatedAt']) visible[key] = project[key];
  const farmDetails = object(project.farmDetails);
  const visibleDetails: Record<string, any> = {};
  if (permissions.has('infrastructure.view')) {
    for (const key of ['targetProduce', 'primaryPurpose', 'expectedStartDate', 'landStatus', 'locationState', 'farmSize', 'sizeUnit', 'waterAvailability', 'irrigationPresent', 'existingEquipment']) visibleDetails[key] = farmDetails[key];
  }
  if (permissions.has('people.view')) {
    for (const key of ['dailyManager', 'managementResponsibilities', 'farmingExperience']) visibleDetails[key] = farmDetails[key];
  }
  if (farmDetails.farmName !== undefined) visibleDetails.farmName = farmDetails.farmName;
  visible.farmDetails = visibleDetails;
  for (const [section, key] of [
    ['market.view', 'marketPlan'], ['production.view', 'productionPlan'], ['financial.view', 'financialModel'],
    ['information.view', 'recordKeepingPlan'], ['risk.view', 'risks'], ['risk.view', 'exitRedesignExpansion'],
    ['financial.view', 'scenarios'], ['financial.view', 'whatIf'],
  ]) if (permissions.has(section)) visible[key] = project[key];
  if (project.toolAnalysis && ['financial.view', 'production.view', 'risk.view'].some(permission => permissions.has(permission))) {
    const analysis = object(project.toolAnalysis);
    visible.toolAnalysis = {
      ...(permissions.has('financial.view') ? { roi: analysis.roi, loan: analysis.loan, whatIf: analysis.whatIf } : {}),
      ...(permissions.has('production.view') ? { production: analysis.production } : {}),
      ...(permissions.has('risk.view') ? { risk: analysis.risk } : {}),
    };
  }
  return visible;
}

function checkInventoryPermission(before: unknown, after: unknown, permissions: Set<string>): boolean {
  const oldItems = new Map(arr(before).map(item => [item?.id, object(item)]));
  const newItems = new Map(arr(after).map(item => [item?.id, object(item)]));
  for (const [id, oldItem] of oldItems) {
    if (!newItems.has(id)) { if (!permissions.has('inventory.delete')) return false; continue; }
    const newItem = newItems.get(id)!;
    if (JSON.stringify(oldItem) === JSON.stringify(newItem)) continue;
    const oldMovements = new Set(arr(oldItem.movements).map(movement => movement?.id));
    const newMovementIds = new Set(arr(newItem.movements).map(movement => movement?.id));
    if ([...oldMovements].some(movementId => !newMovementIds.has(movementId))) return false;
    const addedMovements = arr(newItem.movements).filter(movement => !oldMovements.has(movement?.id));
    if (addedMovements.length) {
      for (const movement of addedMovements) {
        const needed = movement?.type === 'Purchase' ? 'inventory.purchase.record'
          : movement?.type === 'Usage' || movement?.type === 'Sale' ? 'inventory.usage.record'
          : movement?.type === 'Loss' ? 'inventory.loss.record'
          : movement?.type === 'Adjustment' ? 'inventory.adjust' : '';
        if (!needed || !permissions.has(needed)) return false;
      }
      const derivedFields = new Set(['movements', 'quantity', 'unitCost', 'status', 'supplier', 'lastPurchaseDate', 'purchaseReference']);
      if (Object.keys(newItem).some(key => !derivedFields.has(key) && JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key]))) return false;
    } else {
      const changedFields = Object.keys(newItem).filter(key => JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key]));
      const adjustmentOnly = changedFields.length > 0 && changedFields.every(key => key === 'quantity' || key === 'status');
      if (adjustmentOnly ? !permissions.has('inventory.adjust') : !permissions.has('inventory.catalog.edit')) return false;
    }
  }
  for (const [id] of newItems) if (!oldItems.has(id) && !permissions.has('inventory.catalog.edit')) return false;
  return true;
}

function filterData(dataValue: unknown, permissions: Set<string>, owner: boolean) {
  const data = object(dataValue);
  const project = object(data.project);
  return {
    project: filterProject(project, permissions, owner),
    inventory: owner || permissions.has('inventory.view') ? arr(data.inventory) : [],
    reports: owner || permissions.has('reports.view') ? arr(data.reports).map(reportValue => {
      const report = object(reportValue);
      return {
        ...report,
        ...(!owner && !permissions.has('financial.view') ? { investment: undefined } : {}),
        projectSnapshot: filterProject(report.projectSnapshot, permissions, owner),
        inventorySnapshot: owner || permissions.has('inventory.view') ? arr(report.inventorySnapshot) : [],
      };
    }) : [],
  };
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Authorization');
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method ?? '')) return sendError(res, 405, 'Method not allowed.');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !secretKey) return sendError(res, 503, 'Supabase server access is not configured.');
  const authHeader = req.headers.authorization;
  const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '');
  if (!token) return sendError(res, 401, 'Sign in to access farm projects.');
  const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return sendError(res, 401, 'Your session has expired. Sign in again.');
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = object(req.body);

  if (req.method === 'GET') {
    const { data: owned, error: ownedError } = await admin.from('farm_projects').select('id,name,farm_type,snapshot,data,owner_id').eq('owner_id', authData.user.id);
    if (ownedError) return sendError(res, 500, 'Could not load your farms.');
    const { data: memberships, error: membershipError } = await admin.from('farm_project_members').select('project_id,permissions,status').eq('user_id', authData.user.id).eq('status', 'active');
    if (membershipError) return sendError(res, 500, 'Could not load farms shared with you.');
    const projects: { id: string; name: string; farmType: string; data: ReturnType<typeof filterData>; isOwner: boolean; permissions: string[] }[] = (owned ?? []).map(row => ({ id: row.id, name: row.name, farmType: row.farm_type, data: filterData({ ...object(row.data), project: { ...object(object(row.data).project), id: row.id, name: row.name, farmType: row.farm_type } }, new Set(FARM_PERMISSIONS), true), isOwner: true, permissions: [...FARM_PERMISSIONS] }));
    for (const membership of memberships ?? []) {
      if ((owned ?? []).some(row => row.id === membership.project_id)) continue;
      if (!(membership.permissions ?? []).includes('project.view')) continue;
      const { data: row, error } = await admin.from('farm_projects').select('id,name,farm_type,data').eq('id', membership.project_id).maybeSingle();
      if (error) return sendError(res, 500, 'Could not load a shared farm.');
      if (!row) continue;
      const permissions = new Set<string>(membership.permissions ?? []);
      projects.push({ id: row.id, name: row.name, farmType: row.farm_type, data: filterData({ ...object(row.data), project: { ...object(object(row.data).project), id: row.id, name: row.name, farmType: row.farm_type } }, permissions, false), isOwner: false, permissions: [...permissions] });
    }
    return res.status(200).json({ projects });
  }

  const projectId = String(body.projectId ?? object(body.project).id ?? '').trim();
  if (!projectId || projectId.length > 120) return sendError(res, 400, 'A valid farm project is required.');
  const { data: row, error: rowError } = await admin.from('farm_projects').select('id,name,farm_type,data,owner_id').eq('id', projectId).maybeSingle();
  if (rowError) return sendError(res, 500, 'Could not check project ownership.');
  const owner = row?.owner_id === authData.user.id;
  let permissions = new Set<string>();
  if (!owner && row) {
    const { data: member, error: memberError } = await admin.from('farm_project_members').select('permissions,status').eq('project_id', projectId).eq('user_id', authData.user.id).maybeSingle();
    if (memberError) return sendError(res, 500, 'Could not check project access.');
    if (!member || member.status !== 'active') return sendError(res, 403, 'You do not have access to this farm.');
    permissions = new Set<string>(member.permissions ?? []);
  }

  if (req.method === 'POST') {
    const project = object(body.project);
    const name = String(project.name ?? '').trim();
    if (!name) return sendError(res, 400, 'Enter a farm name before saving.');
    if (row && !owner) return sendError(res, 409, 'This project belongs to another farm owner.');
    const data = { project, inventory: arr(body.inventory), reports: arr(body.reports) };
    const values = { id: projectId, owner_id: authData.user.id, name, farm_type: String(project.farmType ?? 'Farm'), snapshot: { id: projectId, name, farmType: String(project.farmType ?? 'Farm') }, data, updated_at: new Date().toISOString() };
    const { error } = row
      ? await admin.from('farm_projects').update(values).eq('id', projectId).eq('owner_id', authData.user.id)
      : await admin.from('farm_projects').insert(values);
    if (error) return sendError(res, error.code === '23505' ? 409 : 500, error.code === '23505' ? 'A farm with this project ID already exists under another account.' : 'Could not save the farm to your account.');
    return res.status(row ? 200 : 201).json({ projectId, isOwner: true, permissions: [...FARM_PERMISSIONS] });
  }

  if (!row) return sendError(res, 404, 'Farm project not found.');
  if (req.method === 'DELETE') {
    if (!owner) return sendError(res, 403, 'Only the farm owner can delete this project.');
    const { error } = await admin.from('farm_projects').delete().eq('id', projectId).eq('owner_id', authData.user.id);
    return error ? sendError(res, 500, 'Could not delete the farm from shared storage.') : res.status(200).json({ deleted: true });
  }

  const incoming = object(body.patch);
  const oldData = object(row.data);
  const nextData = { ...oldData };
  const skippedSections = new Set<string>();
  if (incoming.project) {
    const projectPatch = object(incoming.project);
    const currentProject = object(oldData.project);
    const updatedProject = { ...currentProject };
    for (const path of changedLeaves(currentProject, projectPatch)) {
      const required = permissionForProjectPath(path);
      if (!owner && (!required || !permissions.has(required))) {
        skippedSections.add(required?.split('.')[0] ?? path.split('.')[0]);
        continue;
      }
      writePath(updatedProject, path, readPath(projectPatch, path));
    }
    nextData.project = updatedProject;
  }
  if (incoming.inventory !== undefined) {
    if (!owner && !checkInventoryPermission(oldData.inventory, incoming.inventory, permissions)) skippedSections.add('inventory');
    else nextData.inventory = arr(incoming.inventory);
  }
  if (incoming.reports !== undefined) {
    if (!owner && JSON.stringify(oldData.reports ?? []) !== JSON.stringify(incoming.reports)) skippedSections.add('reports');
    else nextData.reports = arr(incoming.reports);
  }
  const project = object(nextData.project);
  const name = String(project.name ?? row.name).trim();
  const { error } = await admin.from('farm_projects').update({ name, farm_type: String(project.farmType ?? row.farm_type), snapshot: { id: projectId, name, farmType: String(project.farmType ?? row.farm_type) }, data: nextData, updated_at: new Date().toISOString() }).eq('id', projectId);
  if (error) return sendError(res, 500, 'Could not save your farm changes.');
  return res.status(200).json({ saved: true, skippedSections: [...skippedSections] });
}
