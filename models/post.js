// models/post.js
const { connectDB, sql } = require('../utils/db');

// 1. Lấy tất cả bài viết (premium first)
const getAllPosts = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .execute('GetAllPostsPremium');
    callback(null, result.recordset);
  } catch (err) {
    callback(err);
  }
};

// 2. Lấy bài viết theo ID
const getPostById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .execute('GetPostById');
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err);
  }
};

// 3. Cập nhật trạng thái Published
const updatePublished = async (id, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .execute('UpdatePublished');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 4. Cập nhật lịch xuất bản
const updateScheduledPublishDate = async (id, publishDate, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .input('publishDate', sql.DateTime, publishDate)
      .execute('UpdateScheduledPublishDate');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 5. Lấy thông tin tác giả
const getPostAuthorInfo = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .execute('GetPostAuthorInfo');
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err);
  }
};

// 6. Cập nhật nội dung bài viết
const updatePost = async (id, post, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(255), post.title)
      .input('abstract', sql.NVarChar(sql.MAX), post.abstract)
      .input('content', sql.NVarChar(sql.MAX), post.content)
      .execute('UpdatePost');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 7. Xóa bài viết
const deletePost = async (id, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .execute('DeletePost');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 8. Cập nhật lượt xem
const updateView = async (id, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .execute('UpdateView');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 9. Cập nhật lượt thích (toggle)
const updateLike = async (postId, userId, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('postId', sql.Int, postId)
      .input('userId', sql.Int, userId)
      .execute('UpdateLike');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

// 10. Kiểm tra đã thích hay chưa
const isLiked = async (postId, userId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('postId', sql.Int, postId)
      .input('userId', sql.Int, userId)
      .execute('GetIsLiked');
    callback(null, result.recordset[0].liked === 1);
  } catch (err) {
    callback(err);
  }
};

// 11. Lấy số lượt thích
const getLikes = async (postId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('postId', sql.Int, postId)
      .execute('GetLikesCount');
    callback(null, result.recordset[0].likes);
  } catch (err) {
    callback(err);
  }
};

// 12. Kiểm tra premium (dùng function)
const isPremium = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT dbo.IsPremium(@id) AS premium');
    callback(null, result.recordset[0].premium);
  } catch (err) {
    callback(err);
  }
};

// 13. Lấy danh mục của bài viết
const getPostCategories = async (postId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('postId', sql.Int, postId)
      .execute('GetPostCategories');
    callback(null, result.recordset);
  } catch (err) {
    callback(err);
  }
};

// 14. Các hàm dynamic còn lại (theo nhu cầu)
const insertLike = (postId, userId, callback) => {
  // vẫn giữ nếu cần insert thủ công
  const q = `INSERT INTO likes (postId, userId) VALUES (@postId, @userId)`;
  connectDB().then(pool =>
    pool.request()
      .input('postId', sql.Int, postId)
      .input('userId', sql.Int, userId)
      .query(q, callback)
  ).catch(callback);
};

const deleteLike = (postId, userId, callback) => {
  // vẫn giữ nếu cần delete thủ công
  const q = `DELETE FROM likes WHERE postId = @postId AND userId = @userId`;
  connectDB().then(pool =>
    pool.request()
      .input('postId', sql.Int, postId)
      .input('userId', sql.Int, userId)
      .query(q, callback)
  ).catch(callback);
};

// Các hàm liên quan category/posts dynamic (giữ nguyên hoặc refactor tuỳ bạn)
// getPostsByCategory, getPostsByCategoryNoPremium, get5PostsByCat, get5PostsByCatNoPremium,
// getPostsByCategoryCount, getPostsByCategoryCountNoPremium

module.exports = {
  getAllPosts,
  getPostById,
  updatePublished,
  updateScheduledPublishDate,
  getPostAuthorInfo,
  updatePost,
  deletePost,
  updateView,
  updateLike,
  isLiked,
  getLikes,
  isPremium,
  getPostCategories,
  insertLike,
  deleteLike,
  // ... export thêm các hàm dynamic nếu cần
};
