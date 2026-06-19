import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MasterViewModal from '../MasterViewModal';
import { MASTER_VIEW_LABELS } from '../../../../config/label/MasterView.labels';
import {
  MASTER_VIEW_CONFIG,
  type MasterCategory,
} from '../../../../config/constants/MasterView.constants';

/**
 * Frontend-only feature under test: the admin-gated "Download" button on the master
 * VIEW modal. The button is rendered ONLY when `showDownload` is true AND there is at
 * least one row; clicking it exports the rows to an .xlsx file via SheetJS.
 *
 * We mock the `xlsx` module so no real file I/O happens. The component boundary we
 * assert is the call to XLSX.writeFile (the side effect that produces the download),
 * including the per-category filename from MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES.
 *
 * MasterViewModal takes all of its data via props (rows + the onUpdate callback) and
 * embeds MasterEditModal + MUI components, so — like the sibling MasterEditModal suite
 * — it needs no Redux store or router to render.
 */

// Mock SheetJS. utils.* are no-ops that just need to exist; writeFile is the spy we assert.
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Imported AFTER the mock so we get the mocked module's writeFile spy.
import * as XLSX from 'xlsx';

const CUSTOMER_ROWS: Record<string, unknown>[] = [
  {
    id: 1,
    name: 'Acme Health',
    phone: '555-1000',
    email: 'acme@example.com',
    city: 'Oldtown',
    state: 'OldState',
  },
  {
    id: 2,
    name: 'Beta Care',
    phone: '555-2000',
    email: 'beta@example.com',
    city: 'Newtown',
    state: 'NewState',
  },
];

const renderModal = (
  overrides: Partial<React.ComponentProps<typeof MasterViewModal>> = {}
) => {
  const onClose = jest.fn();
  const onUpdate = jest.fn().mockResolvedValue(undefined);
  const utils = render(
    <MasterViewModal
      open
      category="customer"
      rows={CUSTOMER_ROWS}
      isLoading={false}
      isError={false}
      onClose={onClose}
      onUpdate={onUpdate}
      {...overrides}
    />
  );
  return { onClose, onUpdate, ...utils };
};

const queryDownloadButton = () =>
  screen.queryByRole('button', { name: MASTER_VIEW_LABELS.DOWNLOAD_BUTTON });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MasterViewModal — admin download button visibility', () => {
  // A. showDownload true + non-empty rows -> button renders
  it('renders the Download button when showDownload is true and rows are non-empty', () => {
    renderModal({ showDownload: true });
    expect(queryDownloadButton()).toBeInTheDocument();
  });

  // B. showDownload false (default) -> no button
  it('does NOT render the Download button when showDownload defaults to false', () => {
    renderModal();
    expect(queryDownloadButton()).not.toBeInTheDocument();
  });

  it('does NOT render the Download button when showDownload is explicitly false', () => {
    renderModal({ showDownload: false });
    expect(queryDownloadButton()).not.toBeInTheDocument();
  });

  // C. showDownload true but rows empty -> no button
  it('does NOT render the Download button when showDownload is true but rows are empty', () => {
    renderModal({ showDownload: true, rows: [] });
    expect(queryDownloadButton()).not.toBeInTheDocument();
  });
});

describe('MasterViewModal — Download triggers the xlsx export', () => {
  // D. Clicking Download calls XLSX.writeFile with the per-category filename.
  it('calls XLSX.writeFile with the customer filename on click', () => {
    renderModal({ showDownload: true });

    fireEvent.click(queryDownloadButton()!);

    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [, filename] = (XLSX.writeFile as jest.Mock).mock.calls[0];
    expect(filename).toBe(MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES.customer);
  });

  it('builds the worksheet from the rows before writing the file', () => {
    renderModal({ showDownload: true });

    fireEvent.click(queryDownloadButton()!);

    // The export path runs json_to_sheet over a row-per-record array, then writes once.
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(sheetData)).toBe(true);
    expect(sheetData).toHaveLength(CUSTOMER_ROWS.length);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });

  it.each(['supplier', 'product', 'doctor'] as MasterCategory[])(
    'uses the %s filename when exporting that category',
    (category) => {
      // One representative row keyed by the category PK so a row is present.
      const pk = MASTER_VIEW_CONFIG[category].pkKey;
      renderModal({ showDownload: true, category, rows: [{ [pk]: 1 }] });

      fireEvent.click(queryDownloadButton()!);

      const [, filename] = (XLSX.writeFile as jest.Mock).mock.calls[0];
      expect(filename).toBe(MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES[category]);
    }
  );
});
