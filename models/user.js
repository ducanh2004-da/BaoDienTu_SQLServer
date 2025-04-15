const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const validator = require('validator');

// Chống SQL Injection: sanitize input bằng validator.escape
function validateInput(input) {
    if (typeof input !== 'string') {
      throw new Error('Dữ liệu không hợp lệ!');
    }
    const clean = validator.escape(input.trim());
    return clean;
  }

// Lấy tất cả user
const getAllUser = async (callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .execute('sp_GetAllUsers');
    callback(null, result.recordset);
  } catch (err) {
    callback(err);
  }
};

// Tìm user theo Id
const findById = async (id, callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .input('Id', db.sql.UniqueIdentifier, id)
      .execute('sp_FindUserById');
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

// Tìm user theo email
const findByEmail = async (email, callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .input('Email', db.sql.NVarChar(255), email)
      .execute('sp_FindUserByEmail');
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

// Tìm user theo GithubId
const findByGithubId = async (githubId, callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .input('GithubId', db.sql.NVarChar(255), githubId)
      .execute('sp_FindUserByGithubId');
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

// Tìm user theo GoogleId
const findByGoogleId = async (googleId, callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .input('GoogleId', db.sql.NVarChar(255), googleId)
      .execute('sp_FindUserByGoogleId');
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

// Thêm user mới
const add = async (newUser, callback) => {
  const { username, email, password, birthday, googleId, githubId, role } = newUser;
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return callback(new Error('Invalid email format.'));
  }
  // Chuyển định dạng ngày
  const bd = moment(birthday, 'DD/MM/YYYY').format('YYYY-MM-DD');
  try {
    const pool = await db.connectDB();
    const req = pool.request()
      .input('Username', db.sql.NVarChar(255), validateInput(username))
      .input('Email', db.sql.NVarChar(255), email)
      .input('Password', db.sql.NVarChar(255), password ? await bcrypt.hash(password, 10) : null)
      .input('Birthday', db.sql.Date, bd)
      .input('GoogleId', db.sql.NVarChar(255), googleId || null)
      .input('GithubId', db.sql.NVarChar(255), githubId || null)
      .input('Role', db.sql.NVarChar(50), 'subscriber');
    await req.execute('sp_AddUsers');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Lưu OTP vào DB
const saveOTP = async (email, otp, expire, callback) => {
  try {
    const pool = await db.connectDB();
    await pool.request()
      .input('Email', db.sql.NVarChar(255), email)
      .input('OTP', db.sql.NVarChar(10), otp)
      .input('Expire', db.sql.DateTime, expire)
      .execute('sp_SaveOTP');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Xác thực OTP
const verifyOtp = async (email, otp, callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .input('Email', db.sql.NVarChar(255), email)
      .input('OTP', db.sql.NVarChar(10), otp)
      .execute('sp_VerifyOTP');
    callback(null, result.recordset);
  } catch (err) {
    callback(err);
  }
};

// Reset mật khẩu
const resetPassword = async (email, newPassword, callback) => {
  try {
    const pool = await db.connectDB();
    await pool.request()
      .input('Email', db.sql.NVarChar(255), email)
      .input('NewPassword', db.sql.NVarChar(255), validateInput(newPassword))
      .execute('sp_ResetPassword');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Cập nhật vai trò
const updateRole = async (id, user, callback) => {
  try {
    const pool = await db.connectDB();
    await pool.request()
      .input('Id', db.sql.UniqueIdentifier, id)
      .input('Role', db.sql.NVarChar(50), user.role)
      .execute('sp_UpdateUserRole');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Chỉnh sửa thông tin user
const editUser = async (id, user, imageUrl, callback) => {
  try {
    const pool = await db.connectDB();
    await pool.request()
      .input('Id', db.sql.UniqueIdentifier, id)
      .input('Username', db.sql.NVarChar(255), user.username)
      .input('Email', db.sql.NVarChar(255), user.email)
      .input('PenName', db.sql.NVarChar(255), user.penName)
      .input('Birthday', db.sql.Date, user.birthday)
      .input('ImgURL', db.sql.NVarChar(500), imageUrl)
      .execute('sp_EditUser');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Xóa user
const deletes = async (id, callback) => {
  try {
    const pool = await db.connectDB();
    await pool.request()
      .input('Id', db.sql.UniqueIdentifier, id)
      .execute('sp_DeleteUser');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Lấy danh sách editor
const getEditor = async (callback) => {
  try {
    const pool = await db.connectDB();
    const result = await pool.request()
      .execute('sp_GetEditors');
    callback(null, result.recordset);
  } catch (err) {
    callback(err);
  }
};

module.exports = {
  getAllUser,
  findById,
  findByEmail,
  findByGithubId,
  findByGoogleId,
  add,
  saveOTP,
  verifyOtp,
  resetPassword,
  updateRole,
  editUser,
  deletes,
  getEditor
};
