import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCustomer } from "../../hooks/useCustomer";
import "../../styles/MyContract.css";

export default function MyContract() {
  const { user } = useAuth();
  const { setSuccessRegisterContract, setErrorRegisterContract, successRegisterContract, errorRegisterContract, 
    loading, customer, getMoreInformation, getContractType, contracttype, registerContract, getContracts, contracts, cancelContract, errorCancelContract, successCancelContract, setSuccessCancelContract, setErrorCancelContract } = useCustomer();
  const [openForm, setOpenForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);


  const [openDetail, setOpenDetail] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);


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
      await getContracts(customer.customer_id);

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

  const handleCancelContract = async () => {
    const confirm = window.confirm("Bạn có chắc muốn hủy hợp đồng này không?");
    if (!confirm) return;

    try {
      const res = await cancelContract(selectedDetail.contract_id);

      setSelectedDetail(prev => ({
        ...prev,
        contract_status: "TERMINATED",
      }));

      await getContracts(customer.customer_id);

      setTimeout(() => {
        setSuccessCancelContract(null);
      }, 3000);
      
      
      console.log("Đăng ký hợp đồng thành công: ", res);
    } catch (err) {

      setTimeout(() => {
        setErrorCancelContract(null);
      }, 3000);
      alert("Hủy thất bại");
      console.error("Đăng ký hợp đồng thất bại: ", err);
    }
  };

  return (
    <>
      {/* Button Register*/}
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
              <th>Loại HĐ</th>
              <th>Giá</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
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
                      onClick={() => {
                        setSelectedDetail(item);
                        setOpenDetail(true);
                      }}
                    >
                      Xem chi tiết
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

      {/* Registration Form Modal*/}
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

      {/* Detail Contract Modal  */}
      {openDetail && selectedDetail && (
        <div className="modal-overlay">
          <div className="modal-card detail-modal">

            {/* Header */}
            <div className="modal-header">
              <h2>📄 Chi tiết hợp đồng</h2>
              <button className="close-btn" onClick={() => setOpenDetail(false)}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">

              {/* Customer Info */}
              <h3 className="sub-title">👤 Thông tin khách hàng</h3>

              <div className="info-list">
                <p><span>Họ tên:</span> {selectedDetail.contract_customer_fullname}</p>
                <p><span>SĐT:</span> {selectedDetail.contract_customer_phone}</p>
                <p><span>Email:</span> {selectedDetail.contract_customer_email}</p>
                <p><span>Địa chỉ:</span> {selectedDetail.contract_customer_address}</p>
              </div>

              {/* Divider */}
              <div className="divider"></div>

              {/* Contract Info */}
              <div className="info-grid">

                <div className="info-item">
                  <span className="label">Mã hợp đồng</span>
                  <span className="value">{selectedDetail.contract_id}</span>
                </div>

                <div className="info-item">
                  <span className="label mb-1">Trạng thái</span>
                  <span className={`status ${selectedDetail.contract_status?.toLowerCase()}`}>
                    {selectedDetail.contract_status}
                  </span>
                </div>

                <div className="info-item">
                  <span className="label">Loại hợp đồng</span>
                  <span className="value">{selectedDetail.contract_type_name}</span>
                </div>

                <div className="info-item">
                  <span className="label">Giá điện</span>
                  <span className="value price">
                    {new Intl.NumberFormat("vi-VN").format(selectedDetail.contract_rate)} đ/kWh
                  </span>
                </div>

              </div>

              {/* Divider */}
              <div className="divider"></div>

              {/* Date Info */}
              <div className="date-box">
                <div>
                  <span>Ngày bắt đầu: </span>
                  <strong>
                    {new Date(selectedDetail.contract_start_date).toLocaleDateString("vi-VN")}
                  </strong>
                </div>

                <div>
                  <span>Ngày kết thúc: </span>
                  <strong>
                    {new Date(selectedDetail.contract_end_date).toLocaleDateString("vi-VN")}
                  </strong>
                </div>
              </div>

            </div>

            {/* Footer */}
            {selectedDetail.contract_status === "ACTIVE" && (
              <div className="modal-footer">
                <button
                  disabled={loading}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  onClick={handleCancelContract}
                >
                  {loading ? "Đang hủy hợp đồng..." : "Hủy hợp đồng"}
                </button>
              </div>
            )}

            {errorCancelContract && <div className="alert-error">❌ {errorCancelContract}</div>}
            {successCancelContract && <div className="alert-success">✅ {successCancelContract}</div>}

          </div>
        </div>
      )}
    </>
  );
}