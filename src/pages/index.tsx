import { Route, Routes } from "react-router-dom";
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
import DetailedSalesTable from "./Admin/DetailedSalesTable";
import SupplierReceiptReport from "./Admin/SupplierReceiptReport";
import SupplierPaymentReport from "./Admin/SupplierPaymentReport";
import ProductSalesReport from "./Admin/ProductSalesReport";
import SalesTaxReport from "./Admin/SalesTaxReport";
import SupplierTaxReport from "./Admin/SupplierTaxReport";
import HistoricalData from "./Admin/HistoricalData";
import SupplierCredit from "./Admin/SupplierCredit";
import UserProfile from "./Profile/UserProfile";
import { ADMIN_CONSTANTS } from "../config/constants/Admin.constants";
import { orderLabels } from '../config/label/OrderDetail.labels'
import { ProtectedRoute } from "../guards/ProtectedRoute";
import { RoleGuard } from "../guards/RoleGuard";

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

        <Route path="/inventory" element={<DashboardLayout />}>
          <Route index element={<InventoryModule />} />
          <Route path="adjust" element={<InventoryAdjustment />} />
        </Route>

        <Route path="/receive" element={<DashboardLayout />}>
          <Route path="order-receive" element={<OrderReceive />} />
          <Route path="order-details" element={<OrderDetails labels={orderLabels} />} />
          <Route path="payment-details" element={<PaymentDetails />} />
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
            <Route path="reports/detailed-sales" element={<DetailedSalesTable />} />
            <Route path="reports/supplier-receipt" element={<SupplierReceiptReport />} />
            <Route path="reports/supplier-payments" element={<SupplierPaymentReport />} />
            <Route path="reports/product-sales" element={<ProductSalesReport />} />
            <Route path="reports/sales-tax" element={<SalesTaxReport />} />
            <Route path="reports/supplier-tax" element={<SupplierTaxReport />} />
            <Route path="inventory-adjustment" element={<InventoryAdjustment />} />
            <Route path="historical-data" element={<HistoricalData />} />
            <Route path="supplier-credit" element={<SupplierCredit />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};