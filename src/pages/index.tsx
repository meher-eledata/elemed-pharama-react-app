import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../components/Layout";
import LogInLeft from "./LogIn/LogInLeft/LogInLeft";
import ForgotPassword from "../pages/LogIn/ForgotPassword/ForgotPassword";
import CreatePassword from "../pages/LogIn/CreatePassword/CreatePassword";
import { DashboardLayout } from "../layouts/Dashboard";
import InventoryModule from "./Inventory/InventoryModule";
import InventoryAdjustment from "./Inventory/InventoryAdjustment";
import OrderReceive from "../pages/Recieve/OrderReceive";
import OrderDetails from "../pages/Recieve/OrderDetails";
import PaymentDetails from "../pages/Recieve/PaymentDetails";
import PurchaseReturn from "../pages/Recieve/PurchaseReturn/PurchaseReturn";
import PurchaseReturnDetails from "../pages/Recieve/PurchaseReturn/PurchaseReturnDetails";
import ReturnsLog from "../pages/Recieve/PurchaseReturn/ReturnsLog";
import DashboardMain from "../pages/DashboardMain/DashboardMain"
import Masterpage from "./Masters/MasterPage";
import Sale from "./Sales/salepage";
import SalesReceipt from "./Sales/SalesReceipt";
import SaleHistory from "./Sales/SaleHistory";
import SaleDrafts from "./Sales/SaleDrafts";
import SaleReturn from "./Sales/SaleReturn";
import AdminDashboard from "./Admin/AdminDashboard";
import Users from "./Admin/Users";
import Reports from "./Admin/Reports";
import AdminSettings from "./Admin/Settings";
import AuditLog from "./Admin/AuditLog";
import SupplierReceiptReport from "./Admin/SupplierReceiptReport";
import SupplierPaymentReport from "./Admin/SupplierPaymentReport";
import ProductSalesReport from "./Admin/ProductSalesReport";
import SalesTaxReport from "./Admin/SalesTaxReport";
import SupplierTaxReport from "./Admin/SupplierTaxReport";
import ScheduledDrugsReport from "./Admin/ScheduledDrugsReport";
import HistoricalData from "./Admin/HistoricalData";
import SupplierCredit from "./Admin/SupplierCredit";
import UserProfile from "./Profile/UserProfile";
import ComplianceDocuments from "./Compliance/ComplianceDocuments";
import ComplianceCalendar from "./Compliance/ComplianceCalendar";
import ComplianceSettings from "./Compliance/ComplianceSettings";
import { ADMIN_CONSTANTS } from "../config/constants/Admin.constants";
import { COMPLIANCE_CONSTANTS as C } from "../config/constants/Compliance.constants";
import { orderLabels } from '../config/label/OrderDetail.labels'
import { ProtectedRoute } from "../guards/ProtectedRoute";
import { RoleGuard } from "../guards/RoleGuard";
import { ModuleGuard } from "../guards/ModuleGuard";

export const Pages = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<LogInLeft />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<CreatePassword />} />
        <Route path="create-password" element={<CreatePassword />} />
        <Route path="Create-password" element={<CreatePassword />} />
        <Route path="accept-invite" element={<CreatePassword />} />
      </Route>

      {/* App Routes - Protected by Authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardMain />} />
        </Route>

        {/* Pharmacy module routes - gated by the org's active modules */}
        <Route element={<ModuleGuard module="pharmacy" />}>
          <Route path="/inventory" element={<DashboardLayout />}>
            <Route index element={<InventoryModule />} />
            <Route path="adjust" element={<InventoryAdjustment />} />
          </Route>

          <Route path="/receive" element={<DashboardLayout />}>
            <Route path="order-receive" element={<OrderReceive />} />
            <Route path="order-details" element={<OrderDetails labels={orderLabels} />} />
            <Route path="payment-details" element={<PaymentDetails />} />
            <Route path="purchase-return" element={<PurchaseReturn />} />
            <Route path="purchase-return/details" element={<PurchaseReturnDetails />} />
            <Route path="purchase-return/log" element={<ReturnsLog />} />
          </Route>

          <Route path="/master" element={<DashboardLayout />}>
            <Route index element={<Masterpage />} />
          </Route>

          <Route path="/sales" element={<DashboardLayout />}>
            <Route index element={<SaleHistory />} />
            <Route path="new" element={<Sale />} />
            <Route path="drafts" element={<SaleDrafts />} />
            <Route path="receipt" element={<SalesReceipt />} />
            <Route path="sale-return" element={<SaleReturn />} />
          </Route>
        </Route>

        {/* Compliance module routes - gated by the org's active modules.
            The base redirects to the calendar: it is the module's landing
            surface (what is due / lapsed), with Documents as the filing drill-down. */}
        <Route element={<ModuleGuard module="compliance" />}>
          <Route path="/compliance" element={<DashboardLayout />}>
            <Route index element={<Navigate to={C.CALENDAR_PATH} replace />} />
            <Route path={C.CALENDAR_PATH} element={<ComplianceCalendar />} />
            <Route path={C.DOCUMENTS_PATH} element={<ComplianceDocuments />} />
          </Route>
        </Route>

        <Route path="/profile" element={<DashboardLayout />}>
          <Route index element={<UserProfile />} />
        </Route>

        {/* Admin Routes - Restricted to 'Admin' roles */}
        <Route element={<RoleGuard allowedRoles={['admin', 'Admin']} />}>
          <Route path={ADMIN_CONSTANTS.ROUTE_BASE} element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="master" element={<Masterpage enableDownload />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            {/* Legacy deep link: the detailed sales table is now the Sales Report's
                Invoice-wise tab. */}
            <Route
              path="reports/detailed-sales"
              element={
                <Navigate
                  to="/admin/reports"
                  replace
                  state={{ activeTab: 'detailed', selectedReport: 'daily-sales', salesTab: 'invoice' }}
                />
              }
            />
            <Route path="reports/supplier-receipt" element={<SupplierReceiptReport />} />
            <Route path="reports/supplier-payments" element={<SupplierPaymentReport />} />
            <Route path="reports/product-sales" element={<ProductSalesReport />} />
            <Route path="reports/sales-tax" element={<SalesTaxReport />} />
            <Route path="reports/supplier-tax" element={<SupplierTaxReport />} />
            <Route path="reports/scheduled-drugs" element={<ScheduledDrugsReport />} />
            <Route path="inventory-adjustment" element={<InventoryAdjustment />} />
            <Route path="historical-data" element={<HistoricalData />} />
            <Route path="supplier-credit" element={<SupplierCredit />} />
            {/* Compliance under the admin portal — same endpoints as /compliance;
                the role decides capability, not the route (like /admin/master). */}
            <Route element={<ModuleGuard module="compliance" />}>
              <Route path="compliance">
                <Route index element={<Navigate to={C.CALENDAR_PATH} replace />} />
                <Route path={C.CALENDAR_PATH} element={<ComplianceCalendar />} />
                <Route path={C.DOCUMENTS_PATH} element={<ComplianceDocuments />} />
                <Route path={C.SETTINGS_PATH} element={<ComplianceSettings />} />
              </Route>
            </Route>
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};