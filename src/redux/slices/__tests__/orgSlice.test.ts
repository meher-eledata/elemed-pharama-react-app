import orgReducer, {
  setOrgContext,
  setCurrentLocation,
  CURRENT_LOCATION_STORAGE_KEY,
  selectLocations,
  selectActiveLocations,
  selectCurrentLocationId,
  selectCurrentLocation,
} from '../orgSlice';
import { logout } from '../authSlice';
import type { Location } from '../orgApi';

const makeLocation = (over: Partial<Location> = {}): Location => ({
  id: 1,
  organization_id: 1,
  name: 'Main Branch',
  code: 'MB',
  type: 'pharmacy',
  gstin: '22AAAAA0000A1Z5',
  drug_license_1: 'DL-1',
  drug_license_2: 'DL-2',
  address: '12 Main Road',
  phone: '040-1234567',
  status: 1,
  ...over,
});

const baseContext = {
  organization: { id: 1, name: 'Acme', slug: 'acme' },
  activeModules: ['pharmacy'],
};

describe('orgSlice — multi-location state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults currentLocationId to the single active location and persists it', () => {
    const locations = [makeLocation({ id: 7 })];
    const state = orgReducer(
      undefined,
      setOrgContext({ ...baseContext, locations })
    );

    expect(state.locations).toEqual(locations);
    expect(state.currentLocationId).toBe(7);
    expect(localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY)).toBe('7');
  });

  it('keeps the persisted location when it is still an active listed location', () => {
    localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, '2');
    const locations = [makeLocation({ id: 1 }), makeLocation({ id: 2, name: 'Branch 2' })];

    const state = orgReducer(undefined, setOrgContext({ ...baseContext, locations }));

    expect(state.currentLocationId).toBe(2);
  });

  it('discards a persisted id that is inactive or no longer listed (multi-location → null)', () => {
    localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, '9');
    const locations = [
      makeLocation({ id: 1 }),
      makeLocation({ id: 2, name: 'Branch 2' }),
      makeLocation({ id: 9, name: 'Closed', status: 0 }),
    ];

    const state = orgReducer(undefined, setOrgContext({ ...baseContext, locations }));

    expect(state.currentLocationId).toBeNull();
    expect(localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY)).toBeNull();
  });

  it('ignores inactive locations when defaulting to a "single" active location', () => {
    const locations = [makeLocation({ id: 1, status: 0 }), makeLocation({ id: 2, name: 'B2' })];

    const state = orgReducer(undefined, setOrgContext({ ...baseContext, locations }));

    expect(state.currentLocationId).toBe(2);
  });

  it('leaves locations untouched when setOrgContext omits them (module-only update)', () => {
    let state = orgReducer(
      undefined,
      setOrgContext({ ...baseContext, locations: [makeLocation({ id: 3 })] })
    );
    state = orgReducer(state, setOrgContext(baseContext));

    expect(state.locations).toHaveLength(1);
    expect(state.currentLocationId).toBe(3);
  });

  it('setCurrentLocation sets and persists the chosen id', () => {
    let state = orgReducer(
      undefined,
      setOrgContext({
        ...baseContext,
        locations: [makeLocation({ id: 1 }), makeLocation({ id: 2, name: 'B2' })],
      })
    );

    state = orgReducer(state, setCurrentLocation(2));

    expect(state.currentLocationId).toBe(2);
    expect(localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY)).toBe('2');
  });

  it('logout clears in-memory location state but keeps the persisted id for re-login', () => {
    localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, '2');
    let state = orgReducer(
      undefined,
      setOrgContext({
        ...baseContext,
        locations: [makeLocation({ id: 1 }), makeLocation({ id: 2, name: 'B2' })],
      })
    );

    state = orgReducer(state, logout());

    expect(state.locations).toEqual([]);
    expect(state.currentLocationId).toBeNull();
    expect(localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY)).toBe('2');
  });

  describe('selectors', () => {
    const locations = [
      makeLocation({ id: 1 }),
      makeLocation({ id: 2, name: 'B2', status: 0 }),
      makeLocation({ id: 3, name: 'B3' }),
    ];
    const state = {
      org: orgReducer(undefined, setOrgContext({ ...baseContext, locations })),
    };

    it('selectLocations / selectActiveLocations', () => {
      expect(selectLocations(state)).toHaveLength(3);
      expect(selectActiveLocations(state).map((l) => l.id)).toEqual([1, 3]);
    });

    it('selectCurrentLocation resolves the id against the list', () => {
      const chosen = { org: orgReducer(state.org, setCurrentLocation(3)) };
      expect(selectCurrentLocationId(chosen)).toBe(3);
      expect(selectCurrentLocation(chosen)?.name).toBe('B3');
    });

    it('are defensive when the org reducer is absent (minimal test stores)', () => {
      expect(selectLocations({})).toEqual([]);
      expect(selectCurrentLocationId({})).toBeNull();
      expect(selectCurrentLocation({})).toBeNull();
    });
  });
});
