import reducer, {
  addToCart,
  removeFromCart,
  updateItemQuantity,
  updateItemDetails,
  clearCart,
  setCartItems,
  saveFormData,
  clearFormData,
  setLoading,
  setError,
  bulkDeleteItems,
  resetCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemsCount,
  selectFormData,
  selectCartLoading,
  selectCartError,
  selectCartItemById,
  selectCartSummary,
  CartState,
  CartItem,
  SalesFormData,
} from '../cartSlice';
import { Product } from '../../../pages/Sales/SalesPage.types';

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  formData: null,
  isLoading: false,
  error: null,
};

// Helper to build a Product payload (for addToCart) with sensible defaults.
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Paracetamol',
  batch: 'B001',
  avlQty: '10',
  mrp: 100,
  sp: 80,
  unit_selling_price: 50,
  expiry: '2027-01-01',
  quantity: 2,
  type: 'tablet',
  discount: 0,
  ...overrides,
});

// Helper to build a fully-formed CartItem (for setCartItems / building state).
const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'p1',
  name: 'Paracetamol',
  batch: 'B001',
  avlQty: '10',
  mrp: 100,
  sp: 80,
  unit_selling_price: 50,
  expiry: '2027-01-01',
  quantity: 2,
  type: 'tablet',
  discount: 0,
  totalPrice: 100,
  ...overrides,
});

describe('cartSlice reducer', () => {
  it('returns the initial state for an unknown action', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  describe('addToCart', () => {
    it('adds a new item with computed totalPrice and default tax percents', () => {
      // unit_selling_price 50 * quantity 2 * (1 - 10/100) = 90
      const product = makeProduct({ discount: 10, quantity: 2, unit_selling_price: 50 });
      const state = reducer(initialState, addToCart(product));

      expect(state.items).toHaveLength(1);
      const item = state.items[0];
      expect(item.id).toBe('p1');
      expect(item.quantity).toBe(2);
      expect(item.totalPrice).toBe(90);
      expect(item.cgstPercent).toBe('9');
      expect(item.sgstPercent).toBe('9');
      expect(item.igstPercent).toBe('0');
      expect(state.totalAmount).toBe(90);
    });

    it('computes totalPrice with zero discount', () => {
      // 50 * 2 * 1 = 100
      const state = reducer(initialState, addToCart(makeProduct({ discount: 0 })));
      expect(state.items[0].totalPrice).toBe(100);
      expect(state.totalAmount).toBe(100);
    });

    it('preserves explicitly provided tax percentages instead of defaults', () => {
      const product = makeProduct({ cgstPercent: '6', sgstPercent: '6', igstPercent: '12' });
      const state = reducer(initialState, addToCart(product));
      expect(state.items[0].cgstPercent).toBe('6');
      expect(state.items[0].sgstPercent).toBe('6');
      expect(state.items[0].igstPercent).toBe('12');
    });

    it('merges an existing item: accumulates quantity, syncs avlQty, recomputes totalPrice', () => {
      const product = makeProduct({ id: 'p1', quantity: 2, discount: 10, unit_selling_price: 50 });
      let state = reducer(initialState, addToCart(product));
      // add same id again with quantity 3 -> quantity becomes 5
      state = reducer(state, addToCart(makeProduct({ id: 'p1', quantity: 3, discount: 10, unit_selling_price: 50 })));

      expect(state.items).toHaveLength(1);
      const item = state.items[0];
      expect(item.quantity).toBe(5);
      expect(item.avlQty).toBe('5'); // synced to quantity string
      // existing item discount (10) used: 50 * 5 * 0.9 = 225
      expect(item.totalPrice).toBe(225);
      expect(state.totalAmount).toBe(225);
    });

    it('uses the existing item discount on merge (not the incoming payload discount)', () => {
      let state = reducer(initialState, addToCart(makeProduct({ id: 'p1', quantity: 2, discount: 10, unit_selling_price: 50 })));
      // incoming discount 50 should be ignored on merge; existing discount 10 retained
      state = reducer(state, addToCart(makeProduct({ id: 'p1', quantity: 2, discount: 50, unit_selling_price: 50 })));
      const item = state.items[0];
      expect(item.discount).toBe(10);
      // 50 * 4 * 0.9 = 180
      expect(item.totalPrice).toBe(180);
    });

    it('keeps totalAmount as the sum of all item totalPrices', () => {
      let state = reducer(initialState, addToCart(makeProduct({ id: 'p1', quantity: 2, unit_selling_price: 50, discount: 0 })));
      state = reducer(state, addToCart(makeProduct({ id: 'p2', quantity: 1, unit_selling_price: 30, discount: 0 })));
      // 100 + 30 = 130
      expect(state.totalAmount).toBe(130);
      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeFromCart', () => {
    it('removes the matching item and recomputes totalAmount', () => {
      let state = reducer(initialState, addToCart(makeProduct({ id: 'p1', quantity: 2, unit_selling_price: 50, discount: 0 })));
      state = reducer(state, addToCart(makeProduct({ id: 'p2', quantity: 1, unit_selling_price: 30, discount: 0 })));

      state = reducer(state, removeFromCart('p1'));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('p2');
      expect(state.totalAmount).toBe(30);
    });

    it('is a no-op when the id is not present', () => {
      const state = reducer(
        { ...initialState, items: [makeCartItem({ id: 'p1', totalPrice: 100 })], totalAmount: 100 },
        removeFromCart('does-not-exist'),
      );
      expect(state.items).toHaveLength(1);
      expect(state.totalAmount).toBe(100);
    });
  });

  describe('bulkDeleteItems', () => {
    it('removes all listed ids and recomputes totalAmount', () => {
      const start: CartState = {
        ...initialState,
        items: [
          makeCartItem({ id: 'p1', totalPrice: 100 }),
          makeCartItem({ id: 'p2', totalPrice: 30 }),
          makeCartItem({ id: 'p3', totalPrice: 20 }),
        ],
        totalAmount: 150,
      };
      const state = reducer(start, bulkDeleteItems(['p1', 'p3']));
      expect(state.items.map(i => i.id)).toEqual(['p2']);
      expect(state.totalAmount).toBe(30);
    });

    it('does nothing when no ids match', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', totalPrice: 100 })],
        totalAmount: 100,
      };
      const state = reducer(start, bulkDeleteItems(['x', 'y']));
      expect(state.items).toHaveLength(1);
      expect(state.totalAmount).toBe(100);
    });
  });

  describe('updateItemQuantity', () => {
    it('updates quantity, syncs avlQty, and recomputes totalPrice/totalAmount', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 10, quantity: 2, totalPrice: 90 })],
        totalAmount: 90,
      };
      const state = reducer(start, updateItemQuantity({ id: 'p1', quantity: 4 }));
      const item = state.items[0];
      expect(item.quantity).toBe(4);
      expect(item.avlQty).toBe('4');
      // 50 * 4 * 0.9 = 180
      expect(item.totalPrice).toBe(180);
      expect(state.totalAmount).toBe(180);
    });

    it('clamps quantity to a minimum of 1', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 3, totalPrice: 150 })],
        totalAmount: 150,
      };
      const state = reducer(start, updateItemQuantity({ id: 'p1', quantity: 0 }));
      const item = state.items[0];
      expect(item.quantity).toBe(1);
      expect(item.avlQty).toBe('1');
      // 50 * 1 * 1 = 50
      expect(item.totalPrice).toBe(50);
      expect(state.totalAmount).toBe(50);
    });

    it('is a no-op when the id is not found', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', totalPrice: 100, quantity: 2 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemQuantity({ id: 'nope', quantity: 9 }));
      expect(state.items[0].quantity).toBe(2);
      expect(state.totalAmount).toBe(100);
    });
  });

  describe('updateItemDetails', () => {
    it('applies a partial Object.assign without touching unrelated fields', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', name: 'Old', batch: 'B001', totalPrice: 100, quantity: 2 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { name: 'New', batch: 'B999' } }));
      const item = state.items[0];
      expect(item.name).toBe('New');
      expect(item.batch).toBe('B999');
      // no quantity/avlQty/discount change -> totalPrice unchanged
      expect(item.totalPrice).toBe(100);
      expect(state.totalAmount).toBe(100);
    });

    it('syncs a numeric avlQty string into quantity and recomputes totalPrice', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 2, avlQty: '2', totalPrice: 100 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { avlQty: '5' } }));
      const item = state.items[0];
      expect(item.quantity).toBe(5);
      expect(item.avlQty).toBe('5');
      // 50 * 5 * 1 = 250
      expect(item.totalPrice).toBe(250);
      expect(state.totalAmount).toBe(250);
    });

    it('parses leading-numeric avlQty via parseInt', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 2, totalPrice: 100 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { avlQty: '7abc' } }));
      // parseInt('7abc') === 7
      expect(state.items[0].quantity).toBe(7);
      expect(state.items[0].totalPrice).toBe(350);
    });

    it('ignores a NaN avlQty string but still keeps the assigned avlQty value', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 3, totalPrice: 150 })],
        totalAmount: 150,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { avlQty: 'abc' } }));
      const item = state.items[0];
      // quantity preserved because parseInt('abc') is NaN
      expect(item.quantity).toBe(3);
      // Object.assign still set the raw avlQty string
      expect(item.avlQty).toBe('abc');
      // totalPrice recomputed (avlQty was in updates): 50 * 3 * 1 = 150
      expect(item.totalPrice).toBe(150);
    });

    it('clamps a parsed avlQty below 1 to 1', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 3, totalPrice: 150 })],
        totalAmount: 150,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { avlQty: '0' } }));
      expect(state.items[0].quantity).toBe(1);
      expect(state.items[0].totalPrice).toBe(50);
    });

    it('recomputes totalPrice when discount changes', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 2, totalPrice: 100 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { discount: 20 } }));
      // 50 * 2 * (1 - 20/100) = 80
      expect(state.items[0].totalPrice).toBe(80);
      expect(state.totalAmount).toBe(80);
    });

    it('recomputes totalPrice when quantity changes directly', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', unit_selling_price: 50, discount: 0, quantity: 2, totalPrice: 100 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemDetails({ id: 'p1', updates: { quantity: 3 } }));
      // 50 * 3 * 1 = 150
      expect(state.items[0].totalPrice).toBe(150);
      expect(state.totalAmount).toBe(150);
    });

    it('is a no-op when the id is not found', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', totalPrice: 100, quantity: 2 })],
        totalAmount: 100,
      };
      const state = reducer(start, updateItemDetails({ id: 'nope', updates: { discount: 50 } }));
      expect(state.items[0].discount).toBe(0);
      expect(state.totalAmount).toBe(100);
    });
  });

  describe('setCartItems', () => {
    it('maps items using unit_selling_price when present', () => {
      const items = [makeCartItem({ id: 'p1', unit_selling_price: 50, mrp: 200, sp: 40, quantity: 2, discount: 10 })];
      const state = reducer(initialState, setCartItems(items));
      // 50 * 2 * 0.9 = 90
      expect(state.items[0].unit_selling_price).toBe(50);
      expect(state.items[0].totalPrice).toBe(90);
      expect(state.totalAmount).toBe(90);
    });

    it('falls back to mrp/quantity when unit_selling_price is falsy', () => {
      const items = [makeCartItem({ id: 'p1', unit_selling_price: 0, mrp: 200, sp: 40, quantity: 4, discount: 0 })];
      const state = reducer(initialState, setCartItems(items));
      // unit_selling_price falsy -> mrp/quantity = 200/4 = 50
      expect(state.items[0].unit_selling_price).toBe(50);
      // 50 * 4 * 1 = 200
      expect(state.items[0].totalPrice).toBe(200);
      expect(state.totalAmount).toBe(200);
    });

    it('falls back to sp when unit_selling_price and mrp/quantity are both falsy', () => {
      const items = [makeCartItem({ id: 'p1', unit_selling_price: 0, mrp: 0, sp: 40, quantity: 3, discount: 0 })];
      const state = reducer(initialState, setCartItems(items));
      // unit_selling_price 0 -> mrp/quantity 0/3 = 0 (falsy) -> sp 40
      expect(state.items[0].unit_selling_price).toBe(40);
      // 40 * 3 * 1 = 120
      expect(state.items[0].totalPrice).toBe(120);
      expect(state.totalAmount).toBe(120);
    });

    it('sums totalAmount across multiple mapped items', () => {
      const items = [
        makeCartItem({ id: 'p1', unit_selling_price: 50, quantity: 2, discount: 0 }),
        makeCartItem({ id: 'p2', unit_selling_price: 30, quantity: 1, discount: 0 }),
      ];
      const state = reducer(initialState, setCartItems(items));
      // 100 + 30 = 130
      expect(state.totalAmount).toBe(130);
    });
  });

  describe('clearCart', () => {
    it('empties items, resets totalAmount and formData', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', totalPrice: 100 })],
        totalAmount: 100,
        formData: { customerName: 'A' } as SalesFormData,
        isLoading: true,
        error: 'oops',
      };
      const state = reducer(start, clearCart());
      expect(state.items).toEqual([]);
      expect(state.totalAmount).toBe(0);
      expect(state.formData).toBeNull();
      // clearCart does not touch loading/error
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe('oops');
    });
  });

  describe('form data, loading, error', () => {
    it('saveFormData stores the payload', () => {
      const formData: SalesFormData = {
        customerName: 'Jane',
        customerMobile: '999',
        customerCity: 'Pune',
        patientType: 'OPD',
        doctorName: 'Dr. Who',
        doctorMobile: '888',
        doctorEmail: 'd@x.com',
        paymentMode: 'cash',
        insuranceCompany: '',
        invoiceNumber: 'INV1',
        invoiceDate: '2026-06-16',
      };
      const state = reducer(initialState, saveFormData(formData));
      expect(state.formData).toEqual(formData);
    });

    it('clearFormData resets formData to null', () => {
      const start: CartState = { ...initialState, formData: { customerName: 'A' } as SalesFormData };
      const state = reducer(start, clearFormData());
      expect(state.formData).toBeNull();
    });

    it('setLoading toggles isLoading', () => {
      expect(reducer(initialState, setLoading(true)).isLoading).toBe(true);
      expect(reducer({ ...initialState, isLoading: true }, setLoading(false)).isLoading).toBe(false);
    });

    it('setError sets and clears the error', () => {
      expect(reducer(initialState, setError('boom')).error).toBe('boom');
      expect(reducer({ ...initialState, error: 'boom' }, setError(null)).error).toBeNull();
    });
  });

  describe('resetCart', () => {
    it('returns the initial state', () => {
      const start: CartState = {
        ...initialState,
        items: [makeCartItem({ id: 'p1', totalPrice: 100 })],
        totalAmount: 100,
        formData: { customerName: 'A' } as SalesFormData,
        isLoading: true,
        error: 'x',
      };
      expect(reducer(start, resetCart())).toEqual(initialState);
    });
  });
});

describe('cartSlice selectors', () => {
  const buildState = (cart: Partial<CartState> = {}): { cart: CartState } => ({
    cart: { ...initialState, ...cart },
  });

  it('selectCartItems returns the items array', () => {
    const items = [makeCartItem({ id: 'p1' })];
    expect(selectCartItems(buildState({ items }))).toBe(items);
  });

  it('selectCartTotal returns totalAmount', () => {
    expect(selectCartTotal(buildState({ totalAmount: 250 }))).toBe(250);
  });

  it('selectCartItemsCount returns the number of items', () => {
    const items = [makeCartItem({ id: 'p1' }), makeCartItem({ id: 'p2' })];
    expect(selectCartItemsCount(buildState({ items }))).toBe(2);
  });

  it('selectFormData returns formData', () => {
    const formData = { customerName: 'Bob' } as SalesFormData;
    expect(selectFormData(buildState({ formData }))).toBe(formData);
  });

  it('selectCartLoading returns isLoading', () => {
    expect(selectCartLoading(buildState({ isLoading: true }))).toBe(true);
  });

  it('selectCartError returns the error', () => {
    expect(selectCartError(buildState({ error: 'bad' }))).toBe('bad');
  });

  it('selectCartItemById returns the matching item or undefined', () => {
    const items = [makeCartItem({ id: 'p1' }), makeCartItem({ id: 'p2' })];
    const state = buildState({ items });
    expect(selectCartItemById(state, 'p2')?.id).toBe('p2');
    expect(selectCartItemById(state, 'missing')).toBeUndefined();
  });

  it('selectCartSummary returns itemsCount, totalAmount and items', () => {
    const items = [makeCartItem({ id: 'p1' })];
    const summary = selectCartSummary(buildState({ items, totalAmount: 100 }));
    expect(summary).toEqual({ itemsCount: 1, totalAmount: 100, items });
  });
});
