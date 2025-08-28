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

// Import your labels here, as you need to pass them to the component
import { orderLabels } from '../config/label/OrderDetail.labels'

export const Pages = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<LogInLeft />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="create-password" element={<CreatePassword />} />
      </Route>

      {/* Inventory Routes */}
      <Route path="/inventory" element={<DashboardLayout />}>
        <Route index element={<InventoryModule />} />
      </Route>

      {/* Receive Routes */}
      <Route path="/receive" element={<DashboardLayout />}>
        <Route path="order-receive" element={<OrderReceive />} />
        <Route path="order-details" element={<OrderDetails labels={orderLabels} />} />
      </Route>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardMain />} />
      </Route>
      
     <Route path="/master" element={<DashboardLayout/>}> 
     <Route index element={<Masterpage/>}/>
     </Route>

    </Routes>
  );
};