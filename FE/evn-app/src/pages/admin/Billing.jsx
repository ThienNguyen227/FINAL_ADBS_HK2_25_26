// import React from "react";
// import AdminLayout from "../../layouts/AdminLayout";

// export default function Billing() {
//   return (
//     <h1>Admin Billing</h1>
//   );
// }

import React, { useEffect, useState } from "react";
import { useAdminBilling } from "../../hooks/useAdminBilling";
import "../../styles/Billing.css";

export default function Billing() {
  const {
    invoices,
    loading,
    successUpdate,
    errorUpdate,
    getInvoices,
    getPaymentsByInvoice,
    updateInvoiceStatus
  } = useAdminBilling();

  const [search, setSearch] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);

  const [openPayments, setOpenPayments] = useState(false);
  const [payments, setPayments] = useState([]);

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    getInvoices();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="billing-page">

      {/* HEADER */}
      <div className="billing-header">
        <h1>Quản lý hóa đơn</h1>
      </div>

      {/* SEARCH */}
      <div className="toolbar">
        <input
          placeholder="Tìm theo mã hóa đơn / khách hàng / trạng thái..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="btn-search"
          onClick={() => getInvoices(search)}
        >
          Tìm kiếm
        </button>
      </div>

      {/* TABLE */}
      <table className="billing-table">

        <thead>
          <tr>
            <th>ID</th>
            <th>ID Khách hàng</th>
            <th>Tháng</th>
            <th>Tổng điện</th>
            <th>Thành tiền</th>
            <th>Trạng thái</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {invoices.map((invoice) => (
            <tr key={invoice.invoice_id}>

              <td>{invoice.invoice_id}</td>

              <td>{invoice.invoice_customer_id}</td>

              <td>
                {new Date(invoice.invoice_month)
                  .toLocaleDateString("vi-VN")}
              </td>

              <td>{invoice.invoice_total_usage} kWh</td>

              <td>
                {Number(invoice.invoice_total_amount)
                  .toLocaleString("vi-VN")} đ
              </td>

              <td>
                <span
                  className={`status ${invoice.invoice_status.toLowerCase()}`}
                >
                  {invoice.invoice_status}
                </span>
              </td>

              <td className="actions">

                {/* DETAIL */}
                <button
                  className="btn btn-view"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setOpenDetail(true);
                  }}
                >
                  Chi tiết hóa đơn
                </button>

                {/* PAYMENT HISTORY */}
                <button
                  className="btn btn-payment"
                  onClick={async () => {
                    const data = await getPaymentsByInvoice(
                      invoice.invoice_id
                    );

                    setPayments(data.payments);

                    setSelectedInvoice(invoice);

                    setOpenPayments(true);
                  }}
                >
                  Lịch sử thanh toán
                </button>

                {/* EDIT */}
                <button
                  className="btn btn-edit"
                  onClick={() => {
                    setEditData(invoice);
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

      {/* ===================================== */}
      {/* DETAIL MODAL */}
      {/* ===================================== */}

      {openDetail && selectedInvoice && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">

              <h2>Chi tiết hóa đơn</h2>

              <button
                className="close-btn"
                onClick={() => setOpenDetail(false)}
              >
                ✕
              </button>

            </div>

            <div className="modal-body">

              <p>
                <b>Mã hóa đơn:</b> {selectedInvoice.invoice_id}
              </p>

              <p>
                <b>ID Khách hàng:</b> {selectedInvoice.invoice_customer_id}
              </p>

              <p>
                <b>Tháng:</b>{" "}
                {new Date(selectedInvoice.invoice_month)
                  .toLocaleDateString("vi-VN")}
              </p>

              <p>
                <b>Sản lượng:</b>{" "}
                {selectedInvoice.invoice_total_usage} kWh
              </p>

              <p>
                <b>Đơn giá:</b>{" "}
                {Number(selectedInvoice.invoice_rate)
                  .toLocaleString("vi-VN")} đ
              </p>

              <p>
                <b>Thành tiền:</b>{" "}
                {Number(selectedInvoice.invoice_total_amount)
                  .toLocaleString("vi-VN")} đ
              </p>

              <p>
                <b>Trạng thái:</b>{" "}
                {selectedInvoice.invoice_status}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ===================================== */}
      {/* PAYMENT HISTORY */}
      {/* ===================================== */}

      {openPayments && (
        <div className="modal-overlay">

          <div className="modal-card large">

            <div className="modal-header">

              <h2>Lịch sử thanh toán</h2>

              <button
                className="close-btn"
                onClick={() => setOpenPayments(false)}
              >
                ✕
              </button>

            </div>

            <div className="modal-body">

              <table className="payment-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Phương thức</th>
                    <th>Transaction</th>
                    <th>Trạng thái</th>
                    <th>Ngày thanh toán</th>
                  </tr>
                </thead>

                <tbody>

                  {payments.map((p) => (
                    <tr key={p.payment_id}>

                      <td>{p.payment_id}</td>

                      <td>{p.payment_method}</td>

                      <td>{p.payment_transaction_id}</td>

                      <td>{p.payment_status}</td>

                      <td>
                        {p.payment_paid_at
                          ? new Date(p.payment_paid_at)
                              .toLocaleString("vi-VN")
                          : "Chưa thanh toán"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>
      )}

      {/* ===================================== */}
      {/* EDIT MODAL */}
      {/* ===================================== */}

      {openEdit && editData && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">

              <h2>Cập nhật trạng thái hóa đơn</h2>

              <button
                className="close-btn"
                onClick={() => setOpenEdit(false)}
              >
                ✕
              </button>

            </div>

            <div className="modal-body">

              <select
                value={editData.invoice_status}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    invoice_status: e.target.value
                  })
                }
              >
                <option value="UNPAID">
                  UNPAID
                </option>

                <option value="PAID">
                  PAID
                </option>

              </select>

            </div>

            <div className="modal-footer">

              <button
                disabled={loading}
                className="btn-primary"
                onClick={async () => {
                  await updateInvoiceStatus(editData);

                  await getInvoices();

                  // setOpenEdit(false);
                }}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>

            </div>

            {errorUpdate && (
              <div className="alert-error">
                ❌ {errorUpdate}
              </div>
            )}

            {successUpdate && (
              <div className="alert-success">
                ✅ {successUpdate}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}