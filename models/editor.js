const db = require("../utils/db");

//Prepared Statements for SQL Injection

const getAllPosts = (callback) => {
    db.query("SELECT * FROM posts", callback);
};

const getPostById = (id, callback) => {
    db.query("SELECT * FROM posts WHERE id = ?", [id], callback);
};

const updatePublished = (id, callback) => {
    db.query(
        "UPDATE posts SET statusName = 'Published' WHERE id = ? ",
        [id],
        callback
    );
};

const getArticlesByStatusOfEditor = (statusName, editorId, callback) => {
    let query = `
        SELECT posts.*, GROUP_CONCAT(categories.name) AS categories
        FROM posts
        LEFT JOIN post_categories ON posts.id = post_categories.postId
        LEFT JOIN categories ON post_categories.categoryId = categories.id
        WHERE posts.statusName = ? AND categories.editorId = ?
        GROUP BY posts.id
    `;
    db.query(query, [statusName, editorId], callback);
}

const isPostInEditorCategories = (postId, editorId, callback) => {
    // Query to get the categories the editor is in charge of
    const getEditorCategoriesQuery = `
        SELECT id
        FROM categories
        WHERE editorId = ?
    `;

    db.query(getEditorCategoriesQuery, [editorId], (err, editorCategories) => {
        if (err) return callback(err);

        const editorCategoryIds = editorCategories.map(cat => cat.id);

        // Query to get the category of the post
        const getPostCategoryQuery = `
            SELECT categoryId
            FROM post_categories
            WHERE postId = ?
        `;

        db.query(getPostCategoryQuery, [postId], (err, postCategories) => {
            if (err) return callback(err);

            const postCategoryIds = postCategories.map(cat => cat.categoryId);

            // Check if any of the post's categories are in the editor's categories
            const isInEditorCategories = postCategoryIds.some(catId => editorCategoryIds.includes(catId));

            callback(null, isInEditorCategories);
        });
    });
};

const getArticleById = (id, callback) => {
    const query = `
        SELECT posts.*, GROUP_CONCAT(categories.name) AS categories
        FROM posts
        LEFT JOIN post_categories ON posts.id = post_categories.postId
        LEFT JOIN categories ON post_categories.categoryId = categories.id
        WHERE posts.id = ?
        GROUP BY posts.id
    `;
    db.query(query, [id], callback);
};

const getCategoriesByIds = (ids, callback) => {
    const query = "SELECT id, name FROM categories WHERE id IN (?)";
    db.query(query, [ids], callback);
};

const getUsersByIds = (ids, callback) => {
    const query = "SELECT id, username FROM users WHERE id IN (?)";
    db.query(query, [ids], callback);
};

const getCategoryById = (id, callback) => {
    const query = "SELECT name FROM categories WHERE id=?";
    db.query(query, [id], callback);
};

const updateStatusName = (statusName, postId, refuse, callback) => {
    let query;
    let params;
    if (statusName === "Approved") {
        query = `
            UPDATE posts
            SET statusName = ?
            WHERE id = ?
        `;
        params = [statusName, postId];
    } else if (statusName === "Rejected") {
        query = `
            UPDATE posts
            SET statusName = ?, refuse = ?
            WHERE id = ?
        `;
        params = [statusName, refuse, postId];
    }
    db.query(query, params, callback);
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