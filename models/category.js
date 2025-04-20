// models/category.js
const { connectDB, sql } = require("../utils/db");

// 1. Lấy tất cả danh mục
const getAllCategories = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("GetAllCategories");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 2. Thêm danh mục mới
const add = async (editorId, parentId, newCat, callback) => {
  try {
    const pool = await connectDB();
    await pool
      .request()
      .input("editorId", sql.Int, editorId)
      .input("parentId", sql.Int, parentId)
      .input("name", sql.NVarChar(255), newCat.name)
      .execute("AddCategory");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 3. Cập nhật danh mục
const update = async (id, Cat, callback) => {
  try {
    const pool = await connectDB();
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar(255), Cat.name)
      .execute("UpdateCategory");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 4. Lấy danh mục theo ID
const getCatById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .execute("GetCategoryByIds");
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  }
};

// 5. Xóa danh mục
const deletes = async (id, callback) => {
  try {
    const pool = await connectDB();
    await pool.request().input("id", sql.Int, id).execute("DeleteCategory");
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 6. Lấy danh mục cha
const getParentCat = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("GetParentCategories");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 7. Lấy danh mục theo editorId
const getEditorCats = async (editorId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("editorId", sql.Int, editorId)
      .execute("GetEditorCategories");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 8. Lấy các bản ghi post_categories (ID) theo postId
const getPostCategoryId = async (postId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.Int, postId)
      .execute("GetPostCategoryIds");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 9. Lấy danh mục của bài viết (chi tiết)
const getPostCategories = async (postId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("postId", sql.Int, postId)
      .execute("GetPostCategories");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 10. Lấy danh mục theo danh sách IDs
const getCategoriesByIds = async (ids, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("ids", sql.NVarChar(sql.MAX), ids)
      .execute("GetCategoriesByIds");
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = {
  getAllCategories,
  add,
  update,
  getCatById,
  deletes,
  getParentCat,
  getEditorCats,
  getPostCategoryId,
  getPostCategories,
  getCategoriesByIds,
};

/*
-- SQL Server Stored Procedures (chạy trong SSMS nếu chưa có):

-- Lấy danh mục theo ID
CREATE PROCEDURE GetCategoryById
  @id INT
AS
BEGIN
  SELECT * FROM categories WHERE id = @id;
END;
GO

-- Lấy các bản ghi post_categories (ID) theo postId
CREATE PROCEDURE GetPostCategoryIds
  @postId INT
AS
BEGIN
  SELECT * FROM post_categories WHERE postId = @postId;
END;
GO
*/
