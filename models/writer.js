const db = require("../utils/db");
const {v4: uuidv4} = require("uuid");
const validator = require("validator");

//Prepared Statements for SQL Injection

function validateInput(input) {
    if (!validator.isAlphanumeric(input)) {
      throw new Error("Dữ liệu không hợp lệ!");
    }
    return input;
  }

const getNextId = (tableName, callback) => {
    const query = "SHOW TABLE STATUS WHERE Name = ?";
    db.query(query, [tableName], (err, results) => {
        if (err) {
            return callback(err, null);
        }

        const nextId = results[0]?.Auto_increment;
        callback(null, nextId);
    });
};
const insertArticle = (article, callback) => {
    const postId = uuidv4(); 
    const query = `
        INSERT INTO posts
        (id,title,  publish_date, abstract, content, tags, statusName, created_at, updated_at, userId, premium)
        VALUES (?,?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
    `;

    db.query(
        query,
        [
            postId,
            validateInput(article.title),
            article.publish_date || null,
            validateInput(article.abstract),
            article.content,
            article.tags,
            "Pending-Approval",
            article.userId,
            article.is_premium
        ],
        (err, result) => {
            if (err) return callback(err);

            // Insert into post_categories for multiple categories
            if (article.categories && article.categories.length > 0) {
                const categoryQuery = `
                    INSERT INTO post_categories (postId, categoryId)
                    VALUES ?
                `;
                const categoryValues = article.categories.map((catId) => [
                    result.insertId,
                    catId,
                ]);
                db.query(categoryQuery, [categoryValues], callback);
            } else {
                callback(null, result);
            }
        }
    );
};


const getArticlesByStatus = (statusName, userId, callback) => {
    if (statusName === "all") {
        const query = `
            SELECT posts.*, GROUP_CONCAT(categories.name) AS categories
            FROM posts
                     LEFT JOIN post_categories ON posts.id = post_categories.postId
                     LEFT JOIN categories ON post_categories.categoryId = categories.id
            WHERE posts.userId=?
            GROUP BY posts.id
        `;
        db.query(query, [userId], callback);
    } else {
        const query = `
            SELECT posts.*, GROUP_CONCAT(categories.name) AS categories
            FROM posts
                     LEFT JOIN post_categories ON posts.id = post_categories.postId
                     LEFT JOIN categories ON post_categories.categoryId = categories.id
            WHERE posts.statusName=? AND posts.userId=?
            GROUP BY posts.id
        `;
        db.query(query, [statusName, userId], callback);
    }
};

const getArticlesByUserId = (userId, callback) => {
    const query = `
        SELECT posts.*, GROUP_CONCAT(categories.name) AS categories
        FROM posts
                 LEFT JOIN post_categories ON posts.id = post_categories.postId
                 LEFT JOIN categories ON post_categories.categoryId = categories.id
        WHERE posts.userId = ?
        GROUP BY posts.id
        ORDER BY posts.updated_at DESC
    `;

    db.query(query, [userId], callback);
};

const getArticlesById = (id, callback) => {
    const query = `
        SELECT posts.*, GROUP_CONCAT(categories.name) AS categories
        FROM posts
                 LEFT JOIN post_categories ON posts.id = post_categories.postId
                 LEFT JOIN categories ON post_categories.categoryId = categories.id
        WHERE posts.id=?
        GROUP BY posts.id
        ORDER BY posts.updated_at DESC
    `;

    db.query(query, [id], callback);
};

const updateArticle = (article, callback) => {
    const query = `
        UPDATE posts
        SET title = ?, abstract = ?, content = ?, statusName = ?, updated_at = NOW(), tags = ?, premium = ?
        WHERE id = ?
    `;
    db.query(
        query,
        [
            validateInput(article.title),
            validateInput(article.abstract),
            article.content,
            "Pending-Approval",
            article.tags,
            article.is_premium,
            article.id,
        ],
        (err, result) => {
            if (err) return callback(err);

            // Update post_categories
            const deleteQuery = `DELETE FROM post_categories WHERE postId = ?`;
            db.query(deleteQuery, [article.id], (deleteErr) => {
                if (deleteErr) return callback(deleteErr);

                if (article.categories && article.categories.length > 0) {
                    const categoryQuery = `
                        INSERT INTO post_categories (postId, categoryId)
                        VALUES ?
                    `;
                    const categoryValues = article.categories.map((catId) => [
                        article.id,
                        catId,
                    ]);
                    db.query(categoryQuery, [categoryValues], callback);
                } else {
                    callback(null, result);
                }
            });
        }
    );
};

const getCategoryById = (id, callback) => {
    const query = "SELECT name FROM categories WHERE id = ?";
    db.query(query, [id], callback);
};

module.exports = {
    insertArticle,
    getNextId,
    getArticlesByStatus,
    getArticlesByUserId,
    getArticlesById,
    updateArticle,
    getCategoryById,
};
