const { connectDB, sql } = require("../utils/db.js");

//Prepared Statements for SQL Injection

const getAllPosts = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("GetAllPosts");
    callback(null, result.recordset || null);
  } catch (err) {
    callback(err);
  }
};

const getPostById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.Int, id)
      .execute("GetPostById");
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

const updatePublished = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.Int, id)
      .execute("UpdatePublished");
    callback(null, result.recordset[0] || null);
  } catch (err) {
    callback(err);
  }
};

const getArticlesByStatusOfEditor = async (statusName, editorId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("editorId", sql.Int, editorId)
      .input("statusName", sql.NVarChar, statusName)
      .execute("GetArticlesByStatusOfEditor");
    callback(null, result.recordset || null);
  } catch (err) {
    callback(err);
  }
};

const isPostInEditorCategories = async (postId, editorId, callback) => {
  try {
    const pool = await connectDB();

    // Gọi procedure để lấy danh mục do editor phụ trách
    const editorResult = await pool
      .request()
      .input("editorId", sql.Int, editorId)
      .execute("GetEditorCategories");

    const editorCategoryIds = editorResult.recordset.map(
      (cat) => cat.categoryId
    );

    const postResult = await pool
      .request()
      .input("postId", sql.Int, postId)
      .execute("GetPostCategoryIds");

    const postCategoryIds = postResult.recordset.map((cat) => cat.categoryId);

    // Kiểm tra xem bài viết có thuộc danh mục của editor không
    const isInEditorCategories = postCategoryIds.some((catId) =>
      editorCategoryIds.includes(catId)
    );

    callback(null, isInEditorCategories);
  } catch (err) {
    console.error("❌ Lỗi xảy ra:", err);
    callback(err);
  }
};

const getArticleById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.Int, id)
      .execute("getArticleById");
    callback(null, result.recordset || null);
  } catch (err) {
    callback(err);
  }
};

const getCategoriesByIds = async (ids, callback) => {
  try {
    const pool = await connectDB();
    const idsString = ids.join(",");
    console.log(idsString);
    const result = await pool
      .request()
      .input("ids", sql.NVarChar(sql.MAX), idsString)
      .execute("GetCategoriesByIds");

    callback(null, result.recordset || null);
  } catch (err) {
    callback(err);
  }
};

const getUsersByIds = (ids, callback) => {
  const query = "SELECT id, username FROM users WHERE id IN (?)";
  query(query, [ids], callback);
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

const updateStatusName = async (statusName, postId, refuse, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("statusName", sql.NVarChar, statusName)
      .input("postId", sql.Int, postId)
      .input("refuse", sql.NVarChar, refuse)
      .execute("UpdateStatusName");
    callback(null, result.recordset || null);
  } catch (err) {
    callback(err);
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  updatePublished,
  getArticlesByStatusOfEditor,
  isPostInEditorCategories,
  getArticleById,
  getCategoriesByIds,
  getUsersByIds,
  getCategoryById,
  updateStatusName,
};
