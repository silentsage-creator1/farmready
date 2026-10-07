/**
 * Role templates are convenience defaults for project-level access grants.
 * They are not an authorization boundary by themselves. The server must enforce
 * the resolved permissions once authenticated users and shared storage exist.
 */
export const FARM_PERMISSIONS = [
  'project.view',
  'assessment.edit',
  'market.view',
  'market.edit',
  'financial.view',
  'financial.edit',
  'production.view',
  'production.edit',
  'people.view',
  'people.edit',
  'information.view',
  'information.edit',
  'infrastructure.view',
  'infrastructure.edit',
  'inventory.view',
  'inventory.catalog.edit',
  'inventory.purchase.record',
  'inventory.usage.record',
  'inventory.loss.record',
  'inventory.adjust',
  'inventory.delete',
  'risk.view',
  'risk.edit',
  'reports.view',
  'reports.export',
  'access.manage',
  'project.delete',
] as const;

export type FarmPermission = (typeof FARM_PERMISSIONS)[number];

export const FARM_USER_TYPES = [
  'Farm Owner',
  'Farm Manager',
  'Farm Worker',
  'Accountant / Finance Officer',
  'Production Officer',
  'Viewer / Adviser',
] as const;

export type FarmUserType = (typeof FARM_USER_TYPES)[number];

export interface PermissionTemplate {
  label: FarmUserType;
  description: string;
  permissions: readonly FarmPermission[];
  /** Viewer permissions are intentionally chosen by the owner for each invite. */
  requiresOwnerSelection?: boolean;
}

const ownerPermissions: readonly FarmPermission[] = FARM_PERMISSIONS;

export const FARM_PERMISSION_TEMPLATES: Record<FarmUserType, PermissionTemplate> = {
  'Farm Owner': {
    label: 'Farm Owner',
    description: 'Full control of the farm project, including access management and deletion.',
    permissions: ownerPermissions,
  },
  'Farm Manager': {
    label: 'Farm Manager',
    description: 'Runs farm operations and inventory; can review finance but cannot manage users or delete the project.',
    permissions: [
      'project.view', 'assessment.edit', 'market.view', 'market.edit', 'financial.view', 'production.view', 'production.edit',
      'people.view', 'people.edit', 'information.view', 'information.edit', 'infrastructure.view', 'infrastructure.edit',
      'inventory.view', 'inventory.catalog.edit', 'inventory.purchase.record', 'inventory.usage.record',
      'inventory.loss.record', 'inventory.adjust', 'risk.view', 'risk.edit', 'reports.view', 'reports.export',
    ],
  },
  'Farm Worker': {
    label: 'Farm Worker',
    description: 'Can review assigned production information and record stock usage.',
    permissions: ['project.view', 'production.view', 'people.view', 'information.view', 'information.edit', 'inventory.view', 'inventory.usage.record'],
  },
  'Accountant / Finance Officer': {
    label: 'Accountant / Finance Officer',
    description: 'Can update financial assumptions and prepare reports without changing farm operations.',
    permissions: ['project.view', 'market.view', 'financial.view', 'financial.edit', 'production.view', 'reports.view', 'reports.export'],
  },
  'Production Officer': {
    label: 'Production Officer',
    description: 'Can manage production details and record inventory movements needed for farm operations.',
    permissions: [
      'project.view', 'market.view', 'production.view', 'production.edit', 'people.view', 'information.view', 'information.edit', 'infrastructure.view', 'inventory.view', 'inventory.purchase.record',
      'inventory.usage.record', 'inventory.loss.record', 'inventory.adjust', 'risk.view', 'reports.view',
    ],
  },
  'Viewer / Adviser': {
    label: 'Viewer / Adviser',
    description: 'Starts with no section access; the owner selects the project areas this person may view.',
    permissions: [],
    requiresOwnerSelection: true,
  },
};

export type PermissionOverrides = Partial<Record<FarmPermission, boolean>>;

export const PERMISSION_PREREQUISITES: Partial<Record<FarmPermission, FarmPermission>> = {
  'market.view': 'project.view',
  'financial.view': 'project.view',
  'production.view': 'project.view',
  'people.view': 'project.view',
  'information.view': 'project.view',
  'infrastructure.view': 'project.view',
  'inventory.view': 'project.view',
  'risk.view': 'project.view',
  'reports.view': 'project.view',
  'assessment.edit': 'project.view',
  'market.edit': 'market.view',
  'financial.edit': 'financial.view',
  'production.edit': 'production.view',
  'people.edit': 'people.view',
  'information.edit': 'information.view',
  'infrastructure.edit': 'infrastructure.view',
  'inventory.catalog.edit': 'inventory.view',
  'inventory.purchase.record': 'inventory.view',
  'inventory.usage.record': 'inventory.view',
  'inventory.loss.record': 'inventory.view',
  'inventory.adjust': 'inventory.view',
  'inventory.delete': 'inventory.view',
  'risk.edit': 'risk.view',
  'reports.export': 'reports.view',
};

/**
 * Project-scoped membership record for persistence in the shared database.
 * Keep user IDs as the identity key; email is retained for display/invitations.
 */
export interface ProjectAccessGrant {
  id: string;
  projectId: string;
  userId?: string;
  email: string;
  displayName?: string;
  userType: Exclude<FarmUserType, 'Farm Owner'>;
  permissionOverrides: PermissionOverrides;
  status: 'Pending' | 'Active' | 'Revoked';
  invitedBy: string;
  invitedAt: string;
  updatedAt: string;
}

/** Apply individual allow/deny choices to a role template. */
export function resolvePermissions(userType: FarmUserType, overrides: PermissionOverrides = {}): FarmPermission[] {
  const defaults = new Set<FarmPermission>(FARM_PERMISSION_TEMPLATES[userType].permissions);
  const selected = new Set(FARM_PERMISSIONS.filter(permission => overrides[permission] ?? defaults.has(permission)));
  return FARM_PERMISSIONS.filter(permission => {
    const prerequisite = PERMISSION_PREREQUISITES[permission];
    return selected.has(permission) && (!prerequisite || selected.has(prerequisite));
  });
}

/** Prevent a custom grant from giving a non-owner destructive/admin powers. */
export function resolveProjectPermissions(userType: FarmUserType, overrides: PermissionOverrides = {}): FarmPermission[] {
  if (userType === 'Farm Owner') return [...ownerPermissions];
  const permissions = resolvePermissions(userType, overrides);
  return permissions.filter(permission => permission !== 'access.manage' && permission !== 'project.delete');
}

/** Permissions for an individual project member, after role defaults and custom choices. */
export function permissionsForGrant(grant: ProjectAccessGrant): FarmPermission[] {
  if (grant.status !== 'Active') return [];
  return resolveProjectPermissions(grant.userType, grant.permissionOverrides);
}

export function hasProjectPermission(grant: ProjectAccessGrant, permission: FarmPermission): boolean {
  return permissionsForGrant(grant).includes(permission);
}
