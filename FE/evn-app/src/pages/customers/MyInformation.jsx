// import React, { useEffect, useState } from "react";
// import { useAuth } from "../../hooks/useAuth";
// import { useCustomer } from "../../hooks/useCustomer";


// export default function MyInformation() {
//   const { user } = useAuth();
//   const { customer, getMoreInformation, updateCustomerInformation, loading, success, error} = useCustomer();

//   const [form, setForm] = useState({
//     fullName: "",
//     address: "",
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user?.user_id) return;

//       await getMoreInformation(user.user_id);
//     };

//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user?.user_id]);

//   // Sync customer -> form
//   useEffect(() => {
//     if (customer) {
//       setForm({
//         fullName: customer.customer_fullname || "",
//         address: customer.customer_address || "",
//       });
//     }
//   }, [customer]);

//   // Đồng bộ thông tin chỉnh sửa
//   useEffect(() => {
//     const handler = (event) => {
//       if (event.key === "customer_updated") {
//         const data = JSON.parse(event.newValue || "{}");

//         if (data.userId === user?.user_id) {
//           getMoreInformation(user.user_id);
//         }
//       }
//     };

//     window.addEventListener("storage", handler);

//     return () => {
//       window.removeEventListener("storage", handler);
//     };
//   }, [user?.user_id, getMoreInformation]);

//   // Handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   // Submit update
//   const handleUpdate = async () => {
//     try {
//       if (!user?.user_id) return;

//       const payload = {
//         customer_fullname: form.fullName,
//         customer_address: form.address,
//       };

//       console.log("Payload:", payload);

//       await updateCustomerInformation(user.user_id, payload);

//       localStorage.setItem(
//         "customer_updated",
//         JSON.stringify({
//           userId: user.user_id,
//           time: Date.now()
//         })
//       );
//     } catch (err) {
//       console.error("Update failed:", err);
//     }
//   };

//   const sectionStyle = {
//     background: "#fff",
//     padding: "20px",
//     borderRadius: "10px",
//     marginBottom: "20px",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//   };

//   const rowStyle = {
//     display: "flex",
//     gap: "15px",
//     marginBottom: "15px",
//   };

//   const colStyle = {
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//   };

//   const inputStyle = {
//     padding: "8px",
//     borderRadius: "6px",
//     border: "1px solid #ccc",
//   };

//   const labelStyle = {
//     fontSize: "13px",
//     marginBottom: "4px",
//     color: "#555",
//   };

//   return (
//     <div
//       style={{
//         maxWidth: "1200px",
//         fontFamily: "sans-serif",
//       }}
//     >
//       {/* AUTH INFO */}
//       <div style={sectionStyle}>
//         <h3 style={{ marginBottom: "15px" }}>Account Information</h3>

//         <div style={rowStyle}>
//           <div style={colStyle}>
//             <label style={labelStyle}>User ID</label>
//             <input style={inputStyle} value={user?.user_id || ""} readOnly />
//           </div>

//           <div style={colStyle}>
//             <label style={labelStyle}>Tên</label>
//             <input style={inputStyle} value={user?.user_name || ""} readOnly />
//           </div>
//         </div>

//         <div style={rowStyle}>
//           <div style={colStyle}>
//             <label style={labelStyle}>Email</label>
//             <input style={inputStyle} value={user?.user_email || ""} readOnly />
//           </div>

//           <div style={colStyle}>
//             <label style={labelStyle}>SĐT</label>
//             <input style={inputStyle} value={user?.user_phone || ""} readOnly />
//           </div>
//         </div>
//       </div>

//       {/* CUSTOMER INFO */}
//       <div style={sectionStyle}>
//         <h3 style={{ marginBottom: "15px" }}>Customer Information</h3>

//         <div style={rowStyle}>
//           <div style={colStyle}>
//             <label style={labelStyle}>Full Name</label>
//             <input
//               style={inputStyle}
//               name="fullName"
//               value={form.fullName}
//               onChange={handleChange}
//             />
//           </div>

//           <div style={colStyle}>
//             <label style={labelStyle}>Priority</label>
//             <input
//               style={inputStyle}
//               value={customer?.customer_priority || ""}
//               readOnly
//             />
//           </div>
//         </div>

//         <div style={colStyle}>
//           <label style={labelStyle}>Address</label>
//           <input
//             style={inputStyle}
//             name="address"
//             value={form.address}
//             onChange={handleChange}
//           />
//         </div>
//       </div>

//       {/* ACTION */}
//       <div style={{ textAlign: "right" }}>
//         <button
//           disabled={loading}
//           onClick={handleUpdate}
//           style={{
//             padding: "10px 20px",
//             borderRadius: "6px",
//             border: "none",
//             background: "#1677ff",
//             color: "#fff",
//             cursor: "pointer",
//           }}
//         >
//           {loading ? "Updating ..." : "Update Information"}
//         </button>
//       </div>
//       {/* Thông báo */}
//       {error && <p className="error">{error}</p>}
//       {success && <p className="success">{success}</p>}
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCustomer } from "../../hooks/useCustomer";

export default function MyInformation() {
  const { user } = useAuth();
  const {
    customer,
    getMoreInformation,
    updateCustomerInformation,
    loading,
    success,
    error,
  } = useCustomer();

  const [form, setForm] = useState({
    fullName: "",
    address: "",
  });

  useEffect(() => {
    if (!user?.user_id) return;
    getMoreInformation(user.user_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    if (customer) {
      setForm({
        fullName: customer.customer_fullname || "",
        address: customer.customer_address || "",
      });
    }
  }, [customer]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "customer_updated") {
        const data = JSON.parse(event.newValue || "{}");

        if (data.userId === user?.user_id) {
          getMoreInformation(user.user_id);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!user?.user_id) return;

    await updateCustomerInformation(user.user_id, {
      customer_fullname: form.fullName,
      customer_address: form.address,
    });

    localStorage.setItem(
      "customer_updated",
      JSON.stringify({
        userId: user.user_id,
        time: Date.now(),
      })
    );
  };

  // ===== STYLE =====
  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  };

  const title = {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#111",
  };

  const row = {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
  };

  const col = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const label = {
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#555",
  };

  const baseInput = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
    transition: "0.2s",
  };

  const readOnlyInput = {
    ...baseInput,
    background: "#f5f5f5",
    color: "#777",
    cursor: "not-allowed",
  };

  const editableInput = {
    ...baseInput,
    background: "#fff",
    border: "1px solid #1677ff",
  };

  const button = {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: loading ? "#8bbcff" : "#1677ff",
    color: "#fff",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "0.2s",
  };

  const msgError = { color: "red", marginTop: "10px" };
  const msgSuccess = { color: "green", marginTop: "10px" };

  return (
    <div style={{ maxWidth: "1100px", fontFamily: "sans-serif" }}>
      {/* ACCOUNT */}
      <div style={card}>
        <div style={title}>Account Information</div>

        <div style={row}>
          <div style={col}>
            <label style={label}>User ID</label>
            <input style={readOnlyInput} value={user?.user_id || ""} readOnly />
          </div>

          <div style={col}>
            <label style={label}>Tên</label>
            <input style={readOnlyInput} value={user?.user_name || ""} readOnly />
          </div>
        </div>

        <div style={row}>
          <div style={col}>
            <label style={label}>Email</label>
            <input style={readOnlyInput} value={user?.user_email || ""} readOnly />
          </div>

          <div style={col}>
            <label style={label}>SĐT</label>
            <input style={readOnlyInput} value={user?.user_phone || ""} readOnly />
          </div>
        </div>
      </div>

      {/* CUSTOMER */}
      <div style={card}>
        <div style={title}>Customer Information</div>

        <div style={row}>
          <div style={col}>
            <label style={label}>Full Name</label>
            <input
              style={editableInput}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          <div style={col}>
            <label style={label}>Priority</label>
            <input
              style={readOnlyInput}
              value={customer?.customer_priority || ""}
              readOnly
            />
          </div>
        </div>

        <div style={col}>
          <label style={label}>Address</label>
          <input
            style={editableInput}
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ACTION */}
      <div style={{ textAlign: "right" }}>
        <button
          style={button}
          disabled={loading}
          onMouseOver={(e) => {
            if (!loading) e.target.style.background = "#0f5fd1";
          }}
          onMouseOut={(e) => {
            if (!loading) e.target.style.background = "#1677ff";
          }}
          onClick={handleUpdate}
        >
          {loading ? "Updating..." : "Update Information"}
        </button>
      </div>
      <div style={{ textAlign: "right" }}>
        {error && <div style={msgError}>{error}</div>}
        {success && <div style={msgSuccess}>{success}</div>}
      </div>
    </div>
  );
}
