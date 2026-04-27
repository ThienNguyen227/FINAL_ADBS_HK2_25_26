import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCustomer } from "../../hooks/useCustomer";


export default function MyInformation() {
  const { user } = useAuth();
  const { customer, getMoreInformation, updateCustomerInformation, loading} = useCustomer();

  const [form, setForm] = useState({
    fullName: "",
    address: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.user_id) return;

      await getMoreInformation(user.user_id);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  // Sync customer -> form
  useEffect(() => {
    if (customer) {
      setForm({
        fullName: customer.customer_fullname || "",
        address: customer.customer_address || "",
      });
    }
  }, [customer]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit update
  const handleUpdate = async () => {
    try {
      if (!user?.user_id) return;

      const payload = {
        customer_fullname: form.fullName,
        customer_address: form.address,
      };

      console.log("Payload:", payload);

      const res = await updateCustomerInformation(user.user_id, payload);

      console.log("Update success:", res);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Cập nhật thất bại!");
    }
  };

  const sectionStyle = {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  const rowStyle = {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
  };

  const colStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const inputStyle = {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  };

  const labelStyle = {
    fontSize: "13px",
    marginBottom: "4px",
    color: "#555",
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        fontFamily: "sans-serif",
      }}
    >
      {/* AUTH INFO */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "15px" }}>Account Information</h3>

        <div style={rowStyle}>
          <div style={colStyle}>
            <label style={labelStyle}>User ID</label>
            <input style={inputStyle} value={user?.user_id || ""} readOnly />
          </div>

          <div style={colStyle}>
            <label style={labelStyle}>Tên</label>
            <input style={inputStyle} value={user?.user_name || ""} readOnly />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={colStyle}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} value={user?.user_email || ""} readOnly />
          </div>

          <div style={colStyle}>
            <label style={labelStyle}>SĐT</label>
            <input style={inputStyle} value={user?.user_phone || ""} readOnly />
          </div>
        </div>
      </div>

      {/* CUSTOMER INFO */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "15px" }}>Customer Information</h3>

        <div style={rowStyle}>
          <div style={colStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          <div style={colStyle}>
            <label style={labelStyle}>Priority</label>
            <input
              style={inputStyle}
              value={customer?.customer_priority || ""}
              readOnly
            />
          </div>
        </div>

        <div style={colStyle}>
          <label style={labelStyle}>Address</label>
          <input
            style={inputStyle}
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ACTION */}
      <div style={{ textAlign: "right" }}>
        <button
          disabled={loading}
          onClick={handleUpdate}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            background: "#1677ff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "Updating ..." : "Update Information"}
        </button>
      </div>
    </div>
  );
}

