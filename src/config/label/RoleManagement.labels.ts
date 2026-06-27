export const ROLE_MANAGEMENT_LABELS = {
  PAGE_TITLE: 'Role Management',
  SUBTITLE: 'Assign organisation and per-module roles, and grant the manage-roles capability.',
  SEARCH_PLACEHOLDER: 'Search users...',
  TABLE: {
    USER: 'USER',
    ORG_ROLE: 'ORG ROLE',
    MODULE_ROLES: 'MODULE ROLES',
    MANAGE_ROLES: 'MANAGE ROLES',
    ACTIONS: 'ACTIONS',
  },
  MODULE_ROLES_EMPTY: 'None',
  ORG_ROLES: {
    superadmin: 'Superadmin',
    admin: 'Admin',
    member: 'Member',
  } as Record<string, string>,
  MANAGE_ROLES: {
    NOT_APPLICABLE: '—',
    GRANTED: 'Granted',
    REVOKED: 'Not granted',
  },
  EDIT_TOOLTIP: 'Edit roles',
  DIALOG: {
    TITLE: 'Edit roles',
    ORG_ROLE_LABEL: 'Organisation role',
    MODULE_SECTION_TITLE: 'Module roles',
    NONE_OPTION: 'None',
    MANAGE_ROLES_LABEL: 'Can manage roles',
    MANAGE_ROLES_HINT: 'Grant this admin the ability to manage other users\' roles.',
    SAVE: 'Save',
    CANCEL: 'Cancel',
  },
  READ_ONLY_NOTICE: 'You can view roles but cannot edit them. Contact a superadmin or a manage-roles admin to make changes.',
  MESSAGES: {
    LOADING: 'Loading users...',
    ERROR: 'Failed to load users. Please try again.',
    UPDATE_SUCCESS: 'Roles updated.',
    UPDATE_ERROR: 'Failed to update roles. Please try again.',
    MANAGE_ROLES_SUCCESS: 'Manage-roles capability updated.',
    MANAGE_ROLES_ERROR: 'Failed to update manage-roles capability. Please try again.',
  },
} as const;

export type RoleManagementLabels = typeof ROLE_MANAGEMENT_LABELS;
