import React, { useState } from "react";

export default function MyBilling() {
  // 🔹 Fake data
  const bills = [
    {
      id: 1,
      month: "01/2026",
      usage: 320,
      amount: 750000,
      status: "Paid",
    },
    {
      id: 2,
      month: "02/2026",
      usage: 280,
      amount: 680000,
      status: "Unpaid",
    },
    {
      id: 3,
      month: "03/2026",
      usage: 350,
      amount: 820000,
      status: "Unpaid",
    },
  ];

  const [selectedBill, setSelectedBill] = useState(null);

  return (
    <div className="flex gap-6">
      
      {/* 🔥 Danh sách hóa đơn */}
      <div className="w-1/2 bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold mb-4">My Bills</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Month</th>
              <th>Usage (kWh)</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {bills.map((bill) => (
              <tr
                key={bill.id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedBill(bill)}
              >
                <td>{bill.month}</td>
                <td>{bill.usage}</td>
                <td>{bill.amount.toLocaleString()} đ</td>
                <td
                  className={
                    bill.status === "Paid"
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {bill.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 Chi tiết hóa đơn */}
      <div className="w-1/2 bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold mb-4">Bill Details</h2>

        {selectedBill ? (
          <div className="space-y-3">
            <p><b>Month:</b> {selectedBill.month}</p>
            <p><b>Usage:</b> {selectedBill.usage} kWh</p>
            <p><b>Amount:</b> {selectedBill.amount.toLocaleString()} đ</p>
            <p>
              <b>Status:</b>{" "}
              <span
                className={
                  selectedBill.status === "Paid"
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                {selectedBill.status}
              </span>
            </p>

            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Pay Now
            </button>
          </div>
        ) : (
          <p className="text-gray-500">Select a bill to view details</p>
        )}
      </div>

    </div>
  );
}