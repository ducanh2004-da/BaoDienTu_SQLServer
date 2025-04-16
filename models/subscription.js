/*
const db = require("../utils/db");

//Prepared Statements for SQL Injection

// -- Create the `subscriptions` table
// CREATE TABLE subscriptions (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     userId INT NOT NULL,
//     start_date DATE NOT NULL DEFAULT CURRENT_DATE,
//     end_date DATE NOT NULL DEFAULT DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY),
// status ENUM('Active', 'Expired') DEFAULT 'Active',
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
// );

const getAllSubscriptions = (callback) => {
    db.query("SELECT * FROM subscriptions", callback);
}

const getSubscriptionById = (id, callback) => {
    db.query("SELECT * FROM subscriptions WHERE id = ?", [id], callback);
}

const getSubscriptionByUserId = (userId, callback) => {
    db.query("SELECT * FROM subscriptions WHERE userId = ?", [userId], callback);
}

const extendSubscriptions = (newEndDate,userId, callback) => {
    db.query("UPDATE subscriptions SET end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE userId = ?", 
        [newEndDate, 'Active', userId], callback);
}

// get days left for subscription
const getUserSubscriptionDaysLeft = (userId, callback) => {
    db.query("SELECT DATEDIFF(end_date, CURRENT_DATE) AS daysLeft FROM subscriptions WHERE userId = ?", [userId], callback);
}

const extendSubscription = (id, days, callback) => {
    db.query(
        `UPDATE subscriptions
        SET end_date = CASE
            WHEN status = 'Active' THEN DATE_ADD(end_date, INTERVAL ? DAY) -- Extend if active
            ELSE DATE_ADD(CURRENT_DATE, INTERVAL ? DAY) -- Renew if expired
            END,
            status = 'Active',
            updated_at = CURRENT_TIMESTAMP
        WHERE userId = ?;`,
        [days, days, id],
        callback
    );
}

const subscribe = (userId, days, callback) => {
    db.query(
        `INSERT INTO subscriptions (userId, start_date, end_date, status, created_at, updated_at)
        VALUES (?, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL ? DAY), 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
        start_date = CURRENT_DATE,
        end_date = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY),
        status = 'Active',
        updated_at = CURRENT_TIMESTAMP;`,
        [userId, days, days],
        callback
    );
};


const cancelSubscription = (id, callback) => {
    db.query(
        `UPDATE subscriptions
        SET status = 'Expired',
            end_date = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE userId = ? AND status = 'Active';`,
        [id],
        (err, result) => {
            if (err) return callback(err);

            db.query(
                `UPDATE users
                SET role = 'non-subscriber'
                WHERE id = ?;`,
                [id],
                callback
            );
        }
    );
}

const SelectEndDay = (userId,callback) =>{
    db.query("SELECT end_date FROM subscriptions WHERE userId = ?",
        [userId],callback
    )
}

module.exports = {
    getAllSubscriptions,
    getSubscriptionById,
    getSubscriptionByUserId,
    getUserSubscriptionDaysLeft,
    extendSubscription,
    subscribe,
    cancelSubscription,
    extendSubscriptions,
    SelectEndDay
};
*/

const { connectDB, sql } = require("../utils/db");

// Lấy tất cả subscriptions
const getAllSubscriptions = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("GetAllSubscriptions");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// Lấy subscription theo ID
const getSubscriptionById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("subscriptionId", sql.Int, id)
      .execute("GetSubscriptionById");
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  }
};

// Lấy subscription theo userId
const getSubscriptionByUserId = async (userId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .execute("GetSubscriptionByUserId");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// Lấy số ngày còn lại của subscription
const getUserSubscriptionDaysLeft = async (userId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .query("SELECT dbo.GetUserSubscriptionDaysLeft(@userId) AS daysLeft");
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  }
};

// Gia hạn subscription bằng số ngày
const extendSubscription = async (userId, days, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input("userId", sql.Int, userId)
      .input("days", sql.Int, days)
      .execute("ExtendSubscription");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Đăng ký subscription (tạo hoặc cập nhật)
const subscribe = async (userId, days, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input("userId", sql.Int, userId)
      .input("days", sql.Int, days)
      .execute("Subscribe");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Hủy subscription
const cancelSubscription = async (userId, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input("userId", sql.Int, userId)
      .execute("CancelSubscription");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Gia hạn subscription (sử dụng ExtendSubscription với số ngày)
const extendSubscriptions = async (userId, days, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input("userId", sql.Int, userId)
      .input("days", sql.Int, days)
      .execute("ExtendSubscription");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// Lấy ngày kết thúc (end_date) theo userId
const SelectEndDay = async (userId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .execute("SelectEndDay");
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionByUserId,
  getUserSubscriptionDaysLeft,
  extendSubscription,
  subscribe,
  cancelSubscription,
  extendSubscriptions,
  SelectEndDay,
};
