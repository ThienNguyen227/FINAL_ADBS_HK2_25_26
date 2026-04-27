import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCustomer } from "../../hooks/useCustomer";
import "../../styles/MyContract.css";

export default function MyContract() {
  const { user } = useAuth();
  const { setSuccessRegisterContract, setErrorRegisterContract, successRegisterContract, errorRegisterContract, 
    loading, customer, getMoreInformation, getContractType, contracttype, registerContract, getContracts, contracts, } = useCustomer();
  const [openForm, setOpenForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.user_id) return;

      await Promise.all([
        getMoreInformation(user.user_id),
        getContractType()
      ]);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    if (!customer?.customer_id) return;

    getContracts(customer.customer_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.customer_id]);

  const handleSelect = (e) => {
    const id = Number(e.target.value);

    const selected = contracttype?.find(
      (item) => item.contract_type_id === id
    );

    setSelectedContract(selected);
  };

  const handleRegister = async () => {
    try {
      if (!user?.user_id || !customer?.customer_id || !selectedContract?.contract_type_id) {
        alert("Thiếu thông tin đăng ký hợp đồng!");
        return;
      }

      const registerContractPayload = {
        userId: user.user_id,
        userPhone: user.user_phone,
        userEmail: user.user_email,
        customerId: customer.customer_id,
        contractTypeId: selectedContract.contract_type_id,
      };

      const res = await registerContract(registerContractPayload);

      console.log("Đăng ký hợp đồng thành công: ", res);
    } catch (err) {
      console.error("Đăng ký hợp đồng thất bại: ", err);
    }
  };

  const handleClose = () => {
    setOpenForm(false);
    setErrorRegisterContract(null);
    setSuccessRegisterContract(null);
    setSelectedContract(null);
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setOpenForm(true)}>
        Đăng ký hợp đồng
      </button>

      {/* .... Table .... */}
      <div className="table-container">
        <h2>📋 Danh sách hợp đồng</h2>

        <table className="contract-table">
          <thead>
            <tr>
              <th>Mã HĐ</th>
              <th>Loại</th>
              <th>Giá</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {contracts?.length > 0 ? (
              contracts.map((item) => (
                <tr key={item.contract_id}>
                  <td>{item.contract_id}</td>

                  <td>{item.contract_type_name}</td>

                  <td>
                    {new Intl.NumberFormat("vi-VN").format(item.contract_rate)} đ/kWh
                  </td>

                  <td>
                    {new Date(item.contract_start_date).toLocaleDateString("vi-VN")}
                  </td>

                  <td>
                    {new Date(item.contract_end_date).toLocaleDateString("vi-VN")}
                  </td>

                  <td>
                    <span className={`status ${item.contract_status.toLowerCase()}`}>
                      {item.contract_status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn-view"
                      onClick={() => alert(`Xem chi tiết HĐ ${item.contract_id}`)}
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">Không có hợp đồng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Form */}
      {openForm && (
        <div className="modal-overlay">
          <div className="modal-card">

            <h2 className="title">📄 Đăng ký hợp đồng</h2>

            {/* CUSTOMER */}
            <div className="section">
              <h3>👤 Thông tin khách hàng</h3>
              <p><b>Họ tên:</b> {customer?.customer_fullname}</p>
              <p><b>SĐT:</b> {user?.user_phone}</p>
              <p><b>Email:</b> {user?.user_email}</p>
              <p><b>Địa chỉ:</b> {customer?.customer_address}</p>
            </div>

            {/* CONTRACT */}
            <div className="section">
              <h3>⚡ Loại hợp đồng</h3>

              <select className="select" onChange={handleSelect}>
                <option value="">-- Chọn loại hợp đồng --</option>

                {contracttype?.map((item) => (
                  <option
                    key={item.contract_type_id}
                    value={item.contract_type_id}
                  >
                    {item.contract_type_name}
                  </option>
                ))}
              </select>

              {selectedContract && (
                <div className="price-box">
                  💰 Giá: {selectedContract.contract_type_rate} / kWh
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="actions">
              <button disabled={loading} className="btn-success" onClick={handleRegister}>
                {loading ? "Đang đăng ký..." : "Xác nhận đăng ký"}
              </button>

              <button className="btn-secondary" onClick={handleClose}>
                Đóng
              </button>
            </div>

            {errorRegisterContract && <div className="alert-error">❌ {errorRegisterContract}</div>}
            {successRegisterContract && <div className="alert-success">✅ {successRegisterContract}</div>}

          </div>
        </div>
      )}
    </>
  );
}