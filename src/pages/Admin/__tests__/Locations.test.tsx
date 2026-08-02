global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import Locations from '../Locations';
import * as locationsApi from '../../../redux/slices/locationsApi';
import type { Location } from '../../../redux/slices/orgApi';

const theme = createTheme();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// GOTCHA: auto-mocking slices breaks when new hooks are added — mock EXPLICITLY.
jest.mock('../../../redux/slices/locationsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/locationsApi');
  return {
    __esModule: true,
    ...actual,
    useGetLocationsQuery: jest.fn(),
    useCreateLocationMutation: jest.fn(),
    useUpdateLocationMutation: jest.fn(),
  };
});

const mocked = locationsApi as unknown as {
  useGetLocationsQuery: jest.Mock;
  useCreateLocationMutation: jest.Mock;
  useUpdateLocationMutation: jest.Mock;
};

const FIXTURE: Location[] = [
  {
    id: 1,
    name: 'Main Branch',
    code: 'MB',
    type: 'pharmacy',
    gstin: '22AAAAA0000A1Z5',
    drug_license_1: 'DL-1',
    drug_license_2: 'DL-2',
    address: '12 Main Road',
    phone: '040-1234567',
    status: 1,
  },
  {
    id: 2,
    name: 'Closed Branch',
    code: null,
    type: 'pharmacy',
    gstin: null,
    drug_license_1: null,
    drug_license_2: null,
    address: null,
    phone: null,
    status: 0,
  },
];

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', user: { id: 1, role: 0 } }) => state,
    },
  });

const renderPage = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Locations />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );

const mockCreate = jest.fn();
const mockUpdate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mocked.useGetLocationsQuery.mockReturnValue({
    data: { locations: FIXTURE },
    isLoading: false,
    isFetching: false,
    error: null,
  });
  mocked.useCreateLocationMutation.mockReturnValue([mockCreate, { isLoading: false }]);
  mocked.useUpdateLocationMutation.mockReturnValue([mockUpdate, { isLoading: false }]);
});

describe('Admin Locations page', () => {
  it('renders the table with name, code, GSTIN, phone and status', () => {
    renderPage();

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
    expect(screen.getByText('MB')).toBeInTheDocument();
    expect(screen.getByText('22AAAAA0000A1Z5')).toBeInTheDocument();
    expect(screen.getByText('040-1234567')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Closed Branch')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('opens the create dialog and submits the trimmed form (empty fields omitted)', async () => {
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({ location: FIXTURE[0] }) });
    renderPage();

    fireEvent.click(screen.getByText('Add Location'));
    expect(await screen.findByText(/add location/i, { selector: 'h2' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  New Branch  ' } });
    fireEvent.change(screen.getByLabelText('GSTIN'), { target: { value: '33BBBBB1111B2Z6' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New Branch',
        code: undefined,
        type: undefined,
        gstin: '33BBBBB1111B2Z6',
        drug_license_1: undefined,
        drug_license_2: undefined,
        address: undefined,
        phone: undefined,
      }),
    );
  });

  it('validates that name is required', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Add Location'));
    fireEvent.click(screen.getByText('Save'));

    expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('edit dialog pre-fills the location and PUTs with status for deactivation', async () => {
    mockUpdate.mockReturnValue({
      unwrap: () => Promise.resolve({ location: { ...FIXTURE[0], status: 0 } }),
    });
    renderPage();

    fireEvent.click(screen.getByLabelText('Edit Main Branch'));
    expect(await screen.findByText('Edit Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Main Branch');

    // Deactivate via the Active switch, then save.
    fireEvent.click(screen.getByLabelText('Active'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Main Branch', status: 0 }),
      ),
    );
  });

  it('surfaces the backend 400 when deactivating the last active location', async () => {
    mockUpdate.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 400, data: { error: 'Cannot deactivate the last active location' } }),
    });
    renderPage();

    fireEvent.click(screen.getByLabelText('Edit Main Branch'));
    fireEvent.click(await screen.findByLabelText('Active'));
    fireEvent.click(screen.getByText('Save'));

    expect(
      await screen.findByText('Cannot deactivate the last active location'),
    ).toBeInTheDocument();
  });
});
