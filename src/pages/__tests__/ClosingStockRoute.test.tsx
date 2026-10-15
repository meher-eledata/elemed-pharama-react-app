global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { Pages } from '../index';

// Renders the REAL route table (src/pages/index.tsx) with the REAL guards
// (ProtectedRoute / RoleGuard / ModuleGuard), so a route moved outside the admin
// RoleGuard — or dropped — fails here. Every page module is replaced by a named
// marker so the test stays fast and free of RTK Query / chart machinery; the two
// layouts become plain <Outlet/> wrappers.
jest.mock('../../components/Layout', () => {
  const { Outlet } = jest.requireActual('react-router-dom');
  return { __esModule: true, AuthLayout: () => <Outlet /> };
});
jest.mock('../../layouts/Dashboard', () => {
  const { Outlet } = jest.requireActual('react-router-dom');
  return { __esModule: true, DashboardLayout: () => <Outlet /> };
});
jest.mock('../LogIn/LogInLeft/LogInLeft', () => ({ __esModule: true, default: () => <div data-testid="page">LogInLeft</div> }));
jest.mock('../LogIn/ForgotPassword/ForgotPassword', () => ({ __esModule: true, default: () => <div data-testid="page">ForgotPassword</div> }));
jest.mock('../LogIn/CreatePassword/CreatePassword', () => ({ __esModule: true, default: () => <div data-testid="page">CreatePassword</div> }));
jest.mock('../Inventory/InventoryModule', () => ({ __esModule: true, default: () => <div data-testid="page">InventoryModule</div> }));
jest.mock('../Inventory/InventoryAdjustment', () => ({ __esModule: true, default: () => <div data-testid="page">InventoryAdjustment</div> }));
jest.mock('../Recieve/OrderReceive', () => ({ __esModule: true, default: () => <div data-testid="page">OrderReceive</div> }));
jest.mock('../Recieve/OrderDetails', () => ({ __esModule: true, default: () => <div data-testid="page">OrderDetails</div> }));
jest.mock('../Recieve/PaymentDetails', () => ({ __esModule: true, default: () => <div data-testid="page">PaymentDetails</div> }));
jest.mock('../Recieve/PurchaseReturn/PurchaseReturn', () => ({ __esModule: true, default: () => <div data-testid="page">PurchaseReturn</div> }));
jest.mock('../Recieve/PurchaseReturn/PurchaseReturnDetails', () => ({ __esModule: true, default: () => <div data-testid="page">PurchaseReturnDetails</div> }));
jest.mock('../Recieve/PurchaseReturn/ReturnsLog', () => ({ __esModule: true, default: () => <div data-testid="page">ReturnsLog</div> }));
jest.mock('../DashboardMain/DashboardMain', () => ({ __esModule: true, default: () => <div data-testid="page">DashboardMain</div> }));
jest.mock('../Masters/MasterPage', () => ({ __esModule: true, default: () => <div data-testid="page">MasterPage</div> }));
jest.mock('../Sales/salepage', () => ({ __esModule: true, default: () => <div data-testid="page">salepage</div> }));
jest.mock('../Sales/SalesReceipt', () => ({ __esModule: true, default: () => <div data-testid="page">SalesReceipt</div> }));
jest.mock('../Sales/SaleHistory', () => ({ __esModule: true, default: () => <div data-testid="page">SaleHistory</div> }));
jest.mock('../Sales/SaleDrafts', () => ({ __esModule: true, default: () => <div data-testid="page">SaleDrafts</div> }));
jest.mock('../Sales/SaleReturn', () => ({ __esModule: true, default: () => <div data-testid="page">SaleReturn</div> }));
jest.mock('../Admin/AdminDashboard', () => ({ __esModule: true, default: () => <div data-testid="page">AdminDashboard</div> }));
jest.mock('../Admin/Users', () => ({ __esModule: true, default: () => <div data-testid="page">Users</div> }));
jest.mock('../Admin/Reports', () => ({ __esModule: true, default: () => <div data-testid="page">Reports</div> }));
jest.mock('../Admin/Settings', () => ({ __esModule: true, default: () => <div data-testid="page">Settings</div> }));
jest.mock('../Admin/AuditLog', () => ({ __esModule: true, default: () => <div data-testid="page">AuditLog</div> }));
jest.mock('../Admin/DetailedSalesTable', () => ({ __esModule: true, default: () => <div data-testid="page">DetailedSalesTable</div> }));
jest.mock('../Admin/SupplierReceiptReport', () => ({ __esModule: true, default: () => <div data-testid="page">SupplierReceiptReport</div> }));
jest.mock('../Admin/SupplierPaymentReport', () => ({ __esModule: true, default: () => <div data-testid="page">SupplierPaymentReport</div> }));
jest.mock('../Admin/ProductSalesReport', () => ({ __esModule: true, default: () => <div data-testid="page">ProductSalesReport</div> }));
jest.mock('../Admin/SalesTaxReport', () => ({ __esModule: true, default: () => <div data-testid="page">SalesTaxReport</div> }));
jest.mock('../Admin/SupplierTaxReport', () => ({ __esModule: true, default: () => <div data-testid="page">SupplierTaxReport</div> }));
jest.mock('../Admin/ClosingStockReport', () => ({ __esModule: true, default: () => <div data-testid="page">ClosingStockReport</div> }));
jest.mock('../Admin/HistoricalData', () => ({ __esModule: true, default: () => <div data-testid="page">HistoricalData</div> }));
jest.mock('../Admin/SupplierCredit', () => ({ __esModule: true, default: () => <div data-testid="page">SupplierCredit</div> }));
jest.mock('../Profile/UserProfile', () => ({ __esModule: true, default: () => <div data-testid="page">UserProfile</div> }));

type AuthState = { isAuthenticated: boolean; user: { id: number; role: number | string } | null };
type OrgState = { organization: null; activeModules: string[]; loaded: boolean };

const ADMIN: AuthState = { isAuthenticated: true, user: { id: 1, role: 0 } };
const PHARMACIST: AuthState = { isAuthenticated: true, user: { id: 2, role: 1 } };
const ANON: AuthState = { isAuthenticated: false, user: null };
const ORG_PHARMACY: OrgState = { organization: null, activeModules: ['pharmacy'], loaded: true };

const createStore = (auth: AuthState, org: OrgState) =>
  configureStore({
    reducer: {
      auth: (state = auth) => state,
      org: (state = org) => state,
    },
  });

const renderAt = (path: string, auth: AuthState, org: OrgState = ORG_PHARMACY) =>
  render(
    <Provider store={createStore(auth, org)}>
      <MemoryRouter initialEntries={[path]}>
        <Pages />
      </MemoryRouter>
    </Provider>
  );

const CLOSING_STOCK_PATH = '/admin/reports/closing-stock';

describe('/admin/reports/closing-stock route (real Pages route table)', () => {
  it('renders ClosingStockReport for an admin (numeric role 0)', () => {
    renderAt(CLOSING_STOCK_PATH, ADMIN);
    expect(screen.getByTestId('page')).toHaveTextContent('ClosingStockReport');
  });

  it("renders ClosingStockReport for an admin (string role 'Admin')", () => {
    renderAt(CLOSING_STOCK_PATH, { isAuthenticated: true, user: { id: 1, role: 'Admin' } });
    expect(screen.getByTestId('page')).toHaveTextContent('ClosingStockReport');
  });

  it('redirects a pharmacist to /dashboard (admin RoleGuard)', () => {
    renderAt(CLOSING_STOCK_PATH, PHARMACIST);
    expect(screen.getByTestId('page')).toHaveTextContent('DashboardMain');
    expect(screen.queryByText('ClosingStockReport')).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to the login page', () => {
    renderAt(CLOSING_STOCK_PATH, ANON);
    expect(screen.getByTestId('page')).toHaveTextContent('LogInLeft');
    expect(screen.queryByText('ClosingStockReport')).not.toBeInTheDocument();
  });

  it('keeps the reports landing page on its own route (sibling not shadowed)', () => {
    renderAt('/admin/reports', ADMIN);
    expect(screen.getByTestId('page')).toHaveTextContent(/^Reports$/);
  });
});
