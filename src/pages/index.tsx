import { Route, Routes } from "react-router-dom"
import { AuthLayout  } from "../components/Layout"
import LoginRight from "./LogIn/LogInRight/LogInRight"
import SignIn from "./SingIn"
import LogInLeft from "./LogIn/LogInLeft/LogInLeft"
import ForgotPassword from "./ForgotPassword/ForgotPassword"
import CreatePassword from "./CreatePassword/CreatePassword"
// import OtpLogin from "./OtpLogin/OtpLogIn"
import InventoryPage  from "./Inventory"


export const Pages = () => {
  return <Routes>
    <Route path="/" element={<AuthLayout  />}>
      <Route index element={<LogInLeft />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/create-password" element={<CreatePassword />} />
      {/* <Route path="/otp" element={<OtpLogin />} /> */}


      {/* <Route path="/SignIn" element={<SignIn />} />
        <Route path="/LogInLeft" element={<LogInLeft />} /> */}


      {/* <Route index element={<h1>Home</h1>} /> */}
      {/* <Route path="about" element={<h1>About</h1>} /> */}
    </Route>
    <Route path="/inventory" element={< InventoryPage />}>
      {/* <--- IMPORTANT: This nested route will render the InventoryModule inside the Layout's <Outlet /> */}
      {/* <Route path="inventory" element={<InventoryModule />} /> */}
    </Route>
  </Routes>
}