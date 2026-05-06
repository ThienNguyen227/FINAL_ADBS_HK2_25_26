import React, { useEffect, useState } from "react";
import { useAdmin } from "../../hooks/useAdmin";
import "../../styles/Account.css";

export default function Account() {
  const {
    accounts,
    loading,
    getAccounts,
    lockAccount,
    deleteAccount,
    roles,
    getRoles,
    updateAccount,
    errorUpdate, 
    successUpdate,
    setErrorUpdate,
    createAccount,
    errorCreate,
    successCreate,
  } = useAdmin();

  const [search, setSearch] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [createData, setCreateData] = useState({
    user_name: "",
    user_email: "",
    user_phone: "",
    password: "",
    user_role_id: ""
  });

  useEffect(() => {
    getAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLock = async (acc) => {
    await lockAccount({
      user_id: acc.user_id,
      status: acc.user_status === "ACTIVE"
        ? "LOCKED"
        : "ACTIVE"
    });

    await getAccounts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tài khoản này?")) return;
    await deleteAccount(id);
    await getAccounts();
  };

  return (
    <div className="account-page">

      {/* Header */}
      <div className="account-header">
        <h1>Quản lý tài khoản</h1>
        <button
          className="btn-add"
          onClick={() => {
            getRoles();
            setOpenCreate(true);
          }}
        >
          + Thêm tài khoản
        </button>
      </div>

      {/* Search */}
      <div className="toolbar">
        <input
          placeholder="Tìm theo id / tên / email / số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn-search" onClick={() => getAccounts(search)}>
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="loading">Đang tải...</p>
        ) : (
          <table className="account-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái tài khoản</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {accounts?.length > 0 ? (
                accounts.map((acc) => (
                  <tr key={acc.user_id}>
                    <td>{acc.user_id}</td>
                    <td>{acc.user_name}</td>
                    <td>{acc.user_email}</td>
                    <td>{acc.user_phone}</td>
                    <td>{acc.role_name}</td>

                    <td>
                      <span className={`status ${acc.user_status.toLowerCase()}`}>
                        {acc.user_status}
                      </span>
                    </td>

                    <td className="actions">
                      <button
                        className="btn-view"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setOpenDetail(true);
                        }}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="btn-edit"
                        onClick={async () => {
                          await getRoles();

                          setEditData({
                            ...acc,
                            user_role_id: Number(acc.user_role_id)
                          });

                          setOriginalData({
                            ...acc,
                            user_role_id: Number(acc.user_role_id)
                          });

                          setOpenEdit(true);
                        }}
                      >
                        Chỉnh sửa
                      </button>

                      <button
                        className="btn-lock"
                        onClick={() => handleLock(acc)}
                      >
                        {acc.user_status === "ACTIVE"
                          ? "Khóa"
                          : "Mở"}
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(acc.user_id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="empty">
                    Không có tài khoản nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Model Xem */}
      {openDetail && selectedAccount && (
        <div className="modal-overlay">
          <div className="modal-card detail-modal">

            {/* Header */}
            <div className="modal-header">
              <h2>Chi tiết tài khoản ID: {selectedAccount.user_id}</h2>

              <button
                className="close-btn"
                onClick={() => setOpenDetail(false)}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">

              <div className="detail-grid">

                <div className="detail-item">
                  <span>ID</span>
                  <strong>{selectedAccount.user_id}</strong>
                </div>

                <div className="detail-item">
                  <span>Họ tên</span>
                  <strong>{selectedAccount.user_name}</strong>
                </div>

                <div className="detail-item">
                  <span>Email</span>
                  <strong>{selectedAccount.user_email}</strong>
                </div>

                <div className="detail-item">
                  <span>Số điện thoại</span>
                  <strong>{selectedAccount.user_phone}</strong>
                </div>

                <div className="detail-item">
                  <span>Vai trò</span>
                  <strong>{selectedAccount.role_name}</strong>
                </div>

                <div className="detail-item">
                  <span>Trạng thái</span>
                  <strong>
                    <span className={`status ${selectedAccount.user_status.toLowerCase()}`}>
                      {selectedAccount.user_status}
                    </span>
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Số lần đăng nhập sai</span>
                  <strong>{selectedAccount.user_failed_login_attempts}</strong>
                </div>

                <div className="detail-item">
                  <span>Lần đăng nhập cuối</span>
                  <strong>
                    {selectedAccount.user_last_login_at
                      ? new Date(
                          new Date(selectedAccount.user_last_login_at).getTime() - 7 * 60 * 60 * 1000
                        ).toLocaleString("vi-VN")
                      : "Chưa đăng nhập"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Ngày tạo</span>
                  <strong>
                    {new Date(
                      new Date(selectedAccount.user_created_at).getTime() - 7 * 60 * 60 * 1000
                    ).toLocaleString("vi-VN")}
                  </strong>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="btn-close-modal"
                onClick={() => setOpenDetail(false)}
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Model Chỉnh sửa */}
      {openEdit && editData && (
        <div className="modal-overlay">
          <div className="modal-card">

            <div className="modal-header">
              <h2>Chỉnh sửa tài khoản ID: {editData.user_id}</h2>
              <button
                className="close-btn"
                onClick={() => setOpenEdit(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body edit-form">

              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  className="form-input"
                  value={editData.user_name}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      user_name: e.target.value
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-input"
                  value={editData.user_email}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      user_email: e.target.value
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  className="form-input"
                  value={editData.user_phone}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      user_phone: e.target.value
                    })
                  }
                />
              </div>
              
              <div className="form-group">
                <label>Vai trò</label>
                <select
                  className="form-select"
                  value={editData.user_role_id}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      user_role_id: Number(e.target.value)
                    })
                  }
                >
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-save"
                disabled={
                  loading ||
                  (
                    editData.user_name === originalData?.user_name &&
                    editData.user_email === originalData?.user_email &&
                    editData.user_phone === originalData?.user_phone &&
                    editData.user_role_id === originalData?.user_role_id
                  )
                }
                onClick={async () => {
                  const noChange =
                    editData.user_name === originalData?.user_name &&
                    editData.user_email === originalData?.user_email &&
                    editData.user_phone === originalData?.user_phone &&
                    editData.user_role_id === originalData?.user_role_id;

                  if (noChange) {
                    setErrorUpdate("Bạn chưa thay đổi thông tin nào");
                    return;
                  }

                  try {
                    await updateAccount(editData);
                    await getAccounts();
                    setOpenEdit(false);
                  } catch (err) {
                    console.error(err);
                  }
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
      {/* Model Thêm tài khoản */}
      {openCreate && (
        <div className="modal-overlay">
          <div className="modal-card">

            <div className="modal-header">
              <h2>Thêm tài khoản</h2>
              <button
                className="close-btn"
                onClick={() => setOpenCreate(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body edit-form">

              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  className="form-input"
                  value={createData.user_name}
                  onChange={(e) =>
                    setCreateData({ ...createData, user_name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-input"
                  value={createData.user_email}
                  onChange={(e) =>
                    setCreateData({ ...createData, user_email: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  className="form-input"
                  value={createData.user_phone}
                  onChange={(e) =>
                    setCreateData({ ...createData, user_phone: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  className="form-input"
                  value={createData.password}
                  onChange={(e) =>
                    setCreateData({ ...createData, password: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Vai trò</label>
                <select
                  className="form-select"
                  value={createData.user_role_id}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      user_role_id: Number(e.target.value)
                    })
                  }
                >
                  <option value="">-- Chọn role --</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="modal-footer">
              <button
                className="btn-save"
                disabled={loading}
                onClick={async () => {
                  try {
                    await createAccount(createData)

                    await getAccounts();
                    setOpenCreate(false);

                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                {loading ? "Đang tạo tài khoản ..." : "Tạo tài khoản"}
              </button>
            </div>
            {errorCreate && (<div className="alert-error">❌ {errorCreate}</div>)}
            {successCreate && (<div className="alert-success">✅ {successCreate}</div>)}

          </div>
        </div>
      )}
    </div>
    
    
  );
}