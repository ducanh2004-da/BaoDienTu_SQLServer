// models/comment.js
const { connectDB, sql } = require('../utils/db');

// 1. Lấy tất cả bình luận
const getAllComments = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .execute('GetAllComments');
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 2. Lấy bình luận theo ID
const getCommentById = async (id, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CommentId', sql.Int, id)
      .execute('GetCommentById');
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  }
};

// 3. Lấy bình luận theo bài viết, kèm thông tin user
const getCommentsByPostId = async (postId, callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('PostId', sql.Int, postId)
      .execute('GetCommentsByPostId');
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 4. Thêm bình luận mới
const addComment = async (postId, userId, content, callback) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('PostId', sql.Int, postId)
      .input('UserId', sql.Int, userId)
      .input('Content', sql.NVarChar(sql.MAX), content)
      .execute('AddComment');
    callback(null);
  } catch (err) {
    callback(err);
  }
};

module.exports = {
  getAllComments,
  getCommentById,
  getCommentsByPostId,
  addComment,
};

/*
-- SQL Server Stored Procedures (chạy trong SSMS nếu chưa có):

CREATE PROCEDURE GetAllComments
AS
BEGIN
  SELECT * FROM comments;
END;
GO

CREATE PROCEDURE GetCommentById
  @CommentId INT
AS
BEGIN
  SELECT * FROM comments WHERE commentId = @CommentId;
END;
GO

CREATE PROCEDURE GetCommentsByPostId
  @PostId INT
AS
BEGIN
  SELECT c.*, u.*
  FROM comments c
  JOIN users u ON c.userId = u.userId
  WHERE c.postId = @PostId;
END;
GO

CREATE PROCEDURE AddComment
  @PostId INT,
  @UserId INT,
  @Content NVARCHAR(MAX)
AS
BEGIN
  INSERT INTO comments (postId, userId, content)
  VALUES (@PostId, @UserId, @Content);
END;
GO
*/
