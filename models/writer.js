const { connectDB, sql } = require("../utils/db.js");
const { v4: uuidv4 } = require("uuid");
const validator = require("validator");
const { get } = require("../config/email.js");

//Prepared Statements for SQL Injection

function validateInput(input) {
  if (!validator.isAlphanumeric(input)) {
    throw new Error("Dữ liệu không hợp lệ!");
  }
  return input;
}

const getPostCount = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("GetAllPostsPremium");

    // Đếm số lượng bài viết từ recordset
    const count = result.recordset.length;

    // Gọi lại callback với số lượng bài viết
    callback(null, count);
  } catch (err) {
    callback(err);
  }
};

const insertArticle = async (article, callback) => {
  try {
    const pool = await connectDB();
    console.log("Article:", article);
    // Gọi stored procedure để insert post
    await pool
      .request()
      .input("title", sql.NVarChar, article.title)
      .input("abstract", sql.NVarChar, article.abstract)
      .input("content", sql.NVarChar(sql.MAX), article.content)
      .input('publish_date',  sql.DateTime,  null)
      .input("tags", sql.NVarChar, article.tags)
      .input("statusName", sql.NVarChar, "Pending-Approval")
      .input("userId", sql.Int, article.userId)
      .input("premium", sql.Bit, article.is_premium)
      .execute("InsertArticle");

    await pool
      .request()
      .input("postId", sql.Int, article.nextPostId)
      .input("categoryId", sql.Int, article.category)
      .execute("InsertPostCategories");
    callback(null, null);
  } catch (err) {
    console.error("Error inserting article:", err);
    callback(err);
  }
};

const getArticlesByStatus = async (statusName, userId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.NVarChar, statusName)
      .input("userId", sql.Int, userId)
      .execute("GetArticlesByStatus");
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

const getArticlesByUserId = async (userId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .execute("GetArticlesByUserId");

    callback(null, result.recordset || null);
  } catch (err) {
    console.error("Error getting articles by userId:", err);
    callback(err); // Gọi callback với lỗi nếu có
  }
};

const getArticleById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.Int, id)
      .execute("GetArticleById ");
    callback(null, result.recordset || null);
  } catch (err) {
    callback(err);
  }
};

const updateArticle = async (article, callback) => {
  try {
    const pool = await connectDB();
    await pool
      .request()
      .input("postId", sql.Int, article.postId)
      .input("title", sql.NVarChar, article.title)
      .input("abstract", sql.NVarChar, article.abstract)
      .input("content", sql.NVarChar(sql.MAX), article.content)
      .input("statusName", sql.NVarChar, "Pending-Approval")
      .input("tags", sql.NVarChar, article.tags)
      .input("premium", sql.Bit, article.is_premium)
      .execute("UpdateArticle");

    await pool
      .request()
      .input("postId", sql.Int, article.postId)
      .input("categoryId", sql.Int, article.category)
      .execute("InsertPostCategories");
    callback(null, null);
  } catch (err) {
    console.error("Lỗi khi update article:", err);
    callback(err);
  }
};

const getCategoryById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("categoryId", sql.Int, id)
      .execute("GetCategoryById");
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

const getAllCategories = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("GetAllCategories");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = {
  getAllCategories,
  insertArticle,
  getPostCount,
  getArticlesByStatus,
  getArticlesByUserId,
  getArticleById,
  updateArticle,
  getCategoryById,
};
