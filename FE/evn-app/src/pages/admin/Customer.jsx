import React, { useEffect, useState } from "react";
import { useAdminCustomer } from "../../hooks/useAdminCustomer";
import "../../styles/Customer.css";

export default function Customer() {
  const {
    customers,
    getCustomers,
    updateCustomer,
    successUpdate,
    errorUpdate,
    loading
  } = useAdminCustomer();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    getCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="account-page">

      <div className="account-header">
        <h1>Quản lý khách hàng</h1>
      </div>

      {/* SEARCH */}
      <div className="toolbar">
        <input
          placeholder="Tìm theo id / tên / địa chỉ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-search" onClick={() => getCustomers(search)}>
          Tìm kiếm
        </button>
      </div>

      {/* TABLE */}
      <table className="account-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Địa chỉ</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((c) => (
            <tr key={c.customer_id}>
              <td>{c.customer_id}</td>
              <td>{c.customer_fullname}</td>
              <td>{c.customer_address}</td>

              <td>
                <span className={`status ${c.customer_priority.toLowerCase()}`}>
                  {c.customer_priority}
                </span>
              </td>

              <td>
                <button
                  className="btn btn-view"
                  onClick={() => {
                    setSelected(c);
                    setOpenDetail(true);
                  }}
                >
                  Xem chi tiết
                </button>

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

            {/* HEADER + CLOSE BUTTON */}
            <div className="modal-header">
              <h2>Chi tiết khách hàng</h2>

              <button
                className="close-btn"
                onClick={() => setOpenDetail(false)}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <p><b>ID:</b> {selected.customer_id}</p>
              <p><b>Họ tên:</b> {selected.customer_fullname}</p>
              <p><b>Địa chỉ:</b> {selected.customer_address}</p>
              <p><b>Priority:</b> {selected.customer_priority}</p>
            </div>

            {/* FOOTER */}
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

            {/* HEADER + CLOSE */}
            <div className="modal-header">
              <h2>Chỉnh sửa khách hàng</h2>

              <button
                className="close-btn"
                onClick={() => setOpenEdit(false)}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="modal-body">

              <input
                value={editData.customer_fullname}
                onChange={(e) =>
                  setEditData({ ...editData, customer_fullname: e.target.value })
                }
              />

              <input
                value={editData.customer_address}
                onChange={(e) =>
                  setEditData({ ...editData, customer_address: e.target.value })
                }
              />

              <select
                value={editData.customer_priority}
                onChange={(e) =>
                  setEditData({ ...editData, customer_priority: e.target.value })
                }
              >
                <option value="NORMAL">NORMAL</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
               disabled={loading}
                className="btn-primary"
                onClick={async () => {
                  await updateCustomer(editData);
                  await getCustomers();
                }}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
            {errorUpdate && (<div className="alert-error">❌ {errorUpdate}</div>)}
            {successUpdate && (<div className="alert-success">✅ {successUpdate}</div>)}
          </div>
        </div>
      )}

    </div>
  );
}