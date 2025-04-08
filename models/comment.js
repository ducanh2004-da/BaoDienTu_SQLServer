const db = require("../utils/db");

//Prepared Statements for SQL Injection

const getAllComments = (callback) => {
    db.query("SELECT * FROM comments", callback);
}

const getCommentById = (id, callback) => {
    db.query("SELECT * FROM comments WHERE id = ?", [id], callback);
}

const getCommentsByPostId = (postId, callback) => {
    // Also get the user info of the comment
    const query = `
        SELECT comments.*, users.*
        FROM comments
        JOIN users ON comments.userId = users.id
        WHERE postId = ?
    `;
    db.query(query, [postId], callback);
}

const addComment = (postId, userId, content, callback) => {
    db.query(
        "INSERT INTO comments (postId, userId, content) VALUES (?,?,?)",
        [postId, userId, content],
        callback
    );
}

module.exports = {
    getAllComments,
    getCommentById,
    getCommentsByPostId,
    addComment,
}