import {
  CANONICAL_MODULES,
  CANONICAL_EVENT_TYPES,
  MODULE_FILTER_OPTIONS,
  EVENT_TYPE_FILTER_OPTIONS,
  ROLE_FILTER_OPTIONS,
  mapModule,
  mapEventType,
  mapRole,
} from '../auditLogCanonical.constants';

describe('auditLog canonical config — fixed dropdown lists', () => {
  it('Module options are the fixed canonical list', () => {
    expect(MODULE_FILTER_OPTIONS).toEqual([
      'Sales',
      'Receive',
      'Master',
      'Inventory',
      'Admin',
      'Reports',
      'Historical Files',
      'System Settings',
      'Authentication',
    ]);
    // No standalone 'Doctor'/'Supplier'/'Customer'/'Product' options.
    ['Doctor', 'Supplier', 'Customer', 'Product'].forEach(raw =>
      expect(MODULE_FILTER_OPTIONS).not.toContain(raw),
    );
  });

  it('Event-type options are the fixed canonical list', () => {
    expect(EVENT_TYPE_FILTER_OPTIONS).toEqual([...CANONICAL_EVENT_TYPES]);
  });

  it('Role options are the fixed [Admin, Pharmacist] list', () => {
    expect(ROLE_FILTER_OPTIONS).toEqual(['Admin', 'Pharmacist']);
  });
});

describe('mapModule — raw → canonical roll-up', () => {
  it('rolls Master-data sources up to "Master"', () => {
    ['Supplier', 'Doctor', 'Customer', 'Product', 'Master Data'].forEach(raw =>
      expect(mapModule(raw)).toBe('Master'),
    );
  });

  it('maps the remaining canonical sources', () => {
    expect(mapModule('Sale')).toBe('Sales');
    expect(mapModule('Receipt')).toBe('Receive');
    expect(mapModule('Report')).toBe('Reports');
    expect(mapModule('Historical File')).toBe('Historical Files');
    expect(mapModule('Inventory')).toBe('Inventory');
    expect(mapModule('Authentication')).toBe('Authentication');
  });

  it('keeps unknown/raw values so nothing disappears', () => {
    expect(mapModule('Weird')).toBe('Weird');
    expect(mapModule(null)).toBe('');
    expect(mapModule(undefined)).toBe('');
  });
});

describe('mapEventType — raw → canonical', () => {
  it('maps known raw event types', () => {
    expect(mapEventType('User Creation')).toBe('Create');
    expect(mapEventType('Edit')).toBe('Edit/Update');
    expect(mapEventType('User Disabled')).toBe('Disable');
    expect(mapEventType('User Enabled')).toBe('Enable');
    expect(mapEventType('User Role Changed')).toBe('Role Change');
    expect(mapEventType('User Activation')).toBe('Activate');
    expect(mapEventType('Inventory Adjustment')).toBe('Adjustment');
    ['Payment Added', 'Payment Updated', 'Payment Voided'].forEach(raw =>
      expect(mapEventType(raw)).toBe('Payment'),
    );
    expect(mapEventType('Logout')).toBe('Logout');
  });

  it('keeps unknown/raw values', () => {
    expect(mapEventType('Mystery')).toBe('Mystery');
    expect(mapEventType(null)).toBe('');
  });
});

describe('mapRole — integer/string/null → label', () => {
  it('maps the integer encoding 0=Admin, 1=Pharmacist', () => {
    expect(mapRole(0)).toBe('Admin');
    expect(mapRole(1)).toBe('Pharmacist');
  });

  it('handles the string forms "0"/"1"', () => {
    expect(mapRole('0')).toBe('Admin');
    expect(mapRole('1')).toBe('Pharmacist');
  });

  it('maps null/undefined/empty/unknown to "System"', () => {
    expect(mapRole(null)).toBe('System');
    expect(mapRole(undefined)).toBe('System');
    expect(mapRole('')).toBe('System');
    expect(mapRole(9)).toBe('System');
  });
});

describe('CANONICAL list integrity', () => {
  it('module + event-type filter arrays mirror the canonical const tuples', () => {
    expect(MODULE_FILTER_OPTIONS).toEqual([...CANONICAL_MODULES]);
    expect(EVENT_TYPE_FILTER_OPTIONS).toEqual([...CANONICAL_EVENT_TYPES]);
  });
});
