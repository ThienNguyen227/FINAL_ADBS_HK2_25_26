import CustomersLayout from "../layouts/CustomersLayout";
import MyBilling from "../pages/customers/MyBilling";
import MyUsage from "../pages/customers/MyUsage";
import { Route } from "react-router-dom";

export default function CustomerRoutes() {
  return (
    
    <Route path="/customers" element={<CustomersLayout />}>
      <Route path="mybilling" element={<MyBilling />} />
      <Route path="myusage" element={<MyUsage />} />
    </Route>
    
  );
}