import { Route, Routes } from "react-router-dom";
import { AuthLayout } from "../components/Layout";
import LogInLeft from "./LogIn/LogInLeft/LogInLeft";
import ForgotPassword from "../pages/LogIn/ForgotPassword/ForgotPassword";
import CreatePassword from "../pages/LogIn/CreatePassword/CreatePassword";
import { DashboardLayout } from "../layouts/Dashboard";
import InventoryModule from "./Inventory/InventoryModule";
import OrderReceive from "../pages/Recieve/OrderReceive";
import OrderDetails from "../pages/Recieve/OrderDetails";
import DashboardMain from "../pages/DashboardMain/DashboardMain"
import Masterpage from "./Masters/MasterPage";
import Sale from "./Sales/salepage";
import SalesReceipt from "./Sales/SalesReceipt";
import SaleHistory from "./Sales/SaleHistory";
import AdminDashboard from "./Admin/AdminDashboard";
import Users from "./Admin/Users";
import Reports from "./Admin/Reports";
import AdminSettings from "./Admin/Settings";
import AuditLog from "./Admin/AuditLog";
import { ADMIN_CONSTANTS } from "../config/constants/Admin.constants";


// Import your labels here, as you need to pass them to the component
import { orderLabels } from '../config/label/OrderDetail.labels'

export const Pages = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<LogInLeft />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<CreatePassword />} />
        <Route path="create-password" element={<CreatePassword />} />
        <Route path="accept-invite" element={<CreatePassword />} />
      </Route>

      {/* Dashboard Routes - NO PROTECTION */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardMain />} />
      </Route>

      {/* Inventory Routes - NO PROTECTION */}
      <Route path="/inventory" element={<DashboardLayout />}>
        <Route index element={<InventoryModule />} />
      </Route>

      {/* Receive Routes - NO PROTECTION */}
      <Route path="/receive" element={<DashboardLayout />}>
        <Route path="order-receive" element={<OrderReceive />} />
        <Route path="order-details" element={<OrderDetails labels={orderLabels} />} />
      </Route>

      {/* Master Routes - NO PROTECTION */}
      <Route path="/master" element={<DashboardLayout />}> 
        <Route index element={<Masterpage />} />
      </Route>

      {/* Sales Routes - NO PROTECTION */}
      <Route path="/sales" element={<DashboardLayout />}>
        <Route index element={<Sale />} />
        <Route path="receipt" element={<SalesReceipt />} />
        <Route path="sale-history" element={<SaleHistory />} />
      </Route>

      {/* Admin Routes - NO PROTECTION (will be conditionally shown in UI) */}
      <Route path={ADMIN_CONSTANTS.ROUTE_BASE} element={<DashboardLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  );
};