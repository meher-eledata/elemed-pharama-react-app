/**
 * Search over the receive list by OUR goods-receipt (GRN) number.
 *
 * The number the user reads on the row (and on the printed GRN) is
 * `receipt_number`; `reNo` is the internal RA-key that predates it. Once the row
 * DISPLAYS the GRN number, pasting that exact string into the search box has to find
 * the row — a list you cannot search by the identifier it shows is the bug this pins.
 * Legacy rows carry receipt_number = null and must stay searchable by their RA-key,
 * and a null must never make the whole filter throw.
 */
import { act, renderHook } from '@testing-library/react';
import { useOrderReceiveFilters } from '../useOrderReceiveFilters';
import { OrderReceiveRow } from '../../types';

const RECEIVED_TAB = 2;

const row = (over: Partial<OrderReceiveRow> = {}): OrderReceiveRow => ({
  receiptId: 700,
  reNo: 'RA700',
  poNo: 'PO-9',
  po_id: 500,
  supplier: 'Acme',
  supplierId: 3,
  received: 'Jun 15, 2026 10:00 AM',
  status: 'received',
  reBy: 'tester',
  amt: 100,
  products: [],
  invoice_number: 'SUP-INV-1',
  receipt_number: 'GRN-000700',
  ...over,
});

const ROWS: OrderReceiveRow[] = [
  row(),
  row({ receiptId: 701, reNo: 'RA701', receipt_number: 'GRN/26-27/000042', supplier: 'Medico' }),
  // Legacy row: received before migration 019 backfilled the numbers.
  row({ receiptId: 702, reNo: 'RA702', receipt_number: null, supplier: 'Oldco' }),
];

const search = (term: string) => {
  const { result } = renderHook(() => useOrderReceiveFilters(ROWS, [], RECEIVED_TAB));
  act(() => result.current.handleSearchChange(term));
  return result.current.sortedData.map((r) => r.receiptId);
};

describe('useOrderReceiveFilters — searching the received list by receipt number', () => {
  it('finds a row by its full GRN number', () => {
    expect(search('GRN-000700')).toEqual([700]);
  });

  it('finds a row by a schemed GRN number containing separators', () => {
    expect(search('GRN/26-27/000042')).toEqual([701]);
  });

  it('matches a partial GRN number, case-insensitively', () => {
    expect(search('grn/26-27')).toEqual([701]);
    expect(search('000042')).toEqual([701]);
  });

  it('still matches every row on the shared GRN prefix', () => {
    expect(search('GRN').sort()).toEqual([700, 701]);
  });

  it('keeps a legacy row (receipt_number null) searchable by its internal RA-key, and never throws on the null', () => {
    expect(search('RA702')).toEqual([702]);
    expect(() => search('anything')).not.toThrow();
  });

  it('still searches the other columns (supplier, supplier invoice number)', () => {
    expect(search('Oldco')).toEqual([702]);
    expect(search('SUP-INV-1').sort()).toEqual([700, 701, 702]);
  });

  it('returns nothing for a number no row carries', () => {
    expect(search('GRN-999999')).toEqual([]);
  });
});
