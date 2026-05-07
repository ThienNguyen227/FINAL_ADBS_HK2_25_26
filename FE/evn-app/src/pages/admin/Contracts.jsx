import React, { useEffect, useState } from "react";
import { useAdminContract } from "../../hooks/useAdminContract";
import "../../styles/Contract.css";

export default function Contract() {
  const {
    contracts,
    getContracts,
    updateContract,
    loading,
    successUpdate,
    errorUpdate
  } = useAdminContract();

  const [search, setSearch] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  useEffect(() => {
    getContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="account-page">

      <h1>Quản lý hợp đồng</h1>

      {/* SEARCH */}
      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm hợp đồng..."
        />
        <button className="btn-search" onClick={() => getContracts(search)}>
          Tìm kiếm
        </button>
      </div>

      {/* TABLE */}
        <table className="account-table">
        <thead>
            <tr>
            <th>ID</th>
            <th>Khách hàng</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Trạng thái</th>
            <th>Actions</th>
            </tr>
        </thead>

        <tbody>
            {contracts.map((c) => (
            <tr key={c.contract_id}>
                <td>{c.contract_id}</td>
                <td>{c.contract_customer_fullname}</td>
                <td>{c.contract_customer_email}</td>
                <td>{c.contract_customer_phone}</td>

                <td>
                <span className={`status ${c.contract_status?.toLowerCase()}`}>
                    {c.contract_status}
                </span>
                </td>

                <td>
                {/* VIEW BUTTON */}
                <button
                    className="btn btn-view"
                    onClick={() => {
                    setSelected(c);
                    setOpenDetail(true);
                    }}
                >
                    Xem chi tiết
                </button>

                {/* EDIT BUTTON */}
                <button
                    className="btn btn-edit"
                    onClick={() => {
                    setEditData(c);
                    setOpenEdit(true);
                    }}
                >
                    Chỉnh sửa
                </button>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
      {/* DETAIL MODAL */}
        {openDetail && selected && (
        <div className="modal-overlay">
            <div className="modal-card">

            <div className="modal-header">
                <h2>Chi tiết hợp đồng</h2>

                <button
                className="close-btn"
                onClick={() => setOpenDetail(false)}
                >
                ✕
                </button>
            </div>

            <div className="modal-body">

                <p><b>ID:</b> {selected.contract_id}</p>
                <p><b>Khách hàng:</b> {selected.contract_customer_fullname}</p>
                <p><b>Địa chỉ:</b> {selected.contract_customer_address}</p>
                <p><b>Phone:</b> {selected.contract_customer_phone}</p>
                <p><b>Email:</b> {selected.contract_customer_email}</p>

                <hr />

                <p><b>Loại hợp đồng:</b> {selected.contract_type_name}</p>
                <p><b>Giá:</b> {selected.contract_rate}</p>

                <p>
                <b>Ngày bắt đầu:</b>{" "}
                {new Date(
                    new Date(selected.contract_start_date).getTime() - 7 * 60 * 60 * 1000
                ).toLocaleString("vi-VN")}
                </p>

                <p>
                <b>Ngày kết thúc:</b>{" "}
                {new Date(
                    new Date(selected.contract_end_date).getTime() - 7 * 60 * 60 * 1000
                ).toLocaleString("vi-VN")}
                </p>

                <p>
                <b>Trạng thái:</b>{" "}
                <span className={`status ${selected.contract_status?.toLowerCase()}`}>
                    {selected.contract_status}
                </span>
                </p>

            </div>

            <div className="modal-footer">
                <button onClick={() => setOpenDetail(false)}>
                Đóng
                </button>
            </div>

            </div>
        </div>
        )}

      {/* EDIT MODAL */}
      {openEdit && editData && (
        <div className="modal-overlay">
          <div className="modal-card">

            <div className="modal-header">
              <h2>Chỉnh sửa hợp đồng</h2>
              <button className="close-btn" onClick={() => setOpenEdit(false)}>✕</button>
            </div>

            <div className="modal-body">

              <input
                value={editData.contract_rate}
                onChange={(e) =>
                  setEditData({ ...editData, contract_rate: e.target.value })
                }
              />

              <select
                value={editData.contract_status}
                onChange={(e) =>
                  setEditData({ ...editData, contract_status: e.target.value })
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>

            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                disabled={loading}
                onClick={async () => {
                  await updateContract(editData);
                  await getContracts();
                  setOpenEdit(false);
                }}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>

            {errorUpdate && <div className="alert-error">{errorUpdate}</div>}
            {successUpdate && <div className="alert-success">{successUpdate}</div>}
          </div>
        </div>
      )}

    </div>
  );
}