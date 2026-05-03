import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCustomer } from "../../hooks/useCustomer";
import { useBilling } from "../../hooks/useBilling";
import "../../styles/MyBilling.css";

export default function MyBilling() {

  const { user } = useAuth();

  const {customer, getMoreInformation} = useCustomer();

  const { invoices, getInvoices, loading } = useBilling();

  const [openDetail, setOpenDetail] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.user_id) return;
      await getMoreInformation(user.user_id);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    if (!customer?.customer_id) return;
    getInvoices(customer.customer_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.customer_id]);

  return (
    <>
      <div className="table-container">
        <h2>💡 Danh sách hóa đơn</h2>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Mã HĐ</th>
              <th>Tháng</th>
              <th>Sản lượng</th>
              <th>Đơn giá</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {invoices?.length > 0 ? (
              invoices.map((item) => (
                <tr key={item.invoice_id}>
                  <td>{item.invoice_id}</td>

                  <td>
                    {new Date(item.invoice_month).toLocaleDateString("vi-VN", {
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </td>

                  <td>{item.invoice_total_usage} kWh</td>

                  <td>
                    {new Intl.NumberFormat("vi-VN").format(item.invoice_rate)} đ
                  </td>

                  <td>
                    {new Intl.NumberFormat("vi-VN").format(item.invoice_total_amount)} đ
                  </td>

                  <td>
                    <span className={`status ${item.invoice_status.toLowerCase()}`}>
                      {item.invoice_status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn-view"
                      onClick={() => {
                        setSelectedInvoice(item);
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
                <td colSpan="7">
                  {loading ? "Đang tải..." : "Không có hóa đơn nào"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {openDetail && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card detail-modal">

            <div className="modal-header">
              <h2>🧾 Chi tiết hóa đơn</h2>

              <button
                className="close-btn"
                onClick={() => setOpenDetail(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">

              <div className="info-grid">

                <div className="info-item">
                  <span className="label">Mã hóa đơn</span>
                  <span>{selectedInvoice.invoice_id}</span>
                </div>

                <div className="info-item">
                  <span className="label">Tháng</span>
                  <span>
                    {new Date(selectedInvoice.invoice_month).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="info-item">
                  <span className="label">Sản lượng</span>
                  <span>{selectedInvoice.invoice_total_usage} kWh</span>
                </div>

                <div className="info-item">
                  <span className="label">Đơn giá</span>
                  <span>
                    {new Intl.NumberFormat("vi-VN").format(selectedInvoice.invoice_rate)} đ/kWh
                  </span>
                </div>

                <div className="info-item">
                  <span className="label">Tổng tiền</span>
                  <span className="price">
                    {new Intl.NumberFormat("vi-VN").format(selectedInvoice.invoice_total_amount)} đ
                  </span>
                </div>

                <div className="info-item">
                  <span className="label">Trạng thái</span>
                  <span className={`status ${selectedInvoice.invoice_status.toLowerCase()}`}>
                    {selectedInvoice.invoice_status}
                  </span>
                </div>

              </div>
            </div>

            {selectedInvoice.invoice_status === "UNPAID" && (
              <div className="modal-footer">
                <button className="btn-success">
                  Pay Now
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}