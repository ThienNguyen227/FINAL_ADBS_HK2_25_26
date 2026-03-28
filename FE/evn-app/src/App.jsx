import { BrowserRouter, Routes, Route } from "react-router-dom";
{/* Layout cho Customer */}
import CustomersLayout from "./layouts/CustomersLayout";
import MyBilling from "./pages/customers/MyBilling";
import MyUsage from "./pages/customers/MyUsage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout cho Customer */}
        <Route path="/customers" element={<CustomersLayout />}>
          <Route path="mybilling" element={<MyBilling />} />
          <Route path="myusage" element={<MyUsage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;