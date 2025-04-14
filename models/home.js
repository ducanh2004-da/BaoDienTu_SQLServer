// models/home.js
const { connectDB, sql } = require('../utils/db');

// 1. Highlighted posts (chưa có SP, dùng dynamic SQL với DATEADD/GETDATE và OFFSET–FETCH)
const getHighlightedPosts = async (callback) => {
  const baseInterval = 7;   // ngày
  const maxInterval = 365;  // ngày
  let currentInterval = baseInterval;
  try {
    const pool = await connectDB();
    let records = [];

    do {
      const result = await pool.request()
        .query(`
          SELECT TOP 4
            p.*,
            c.name AS category_name
          FROM posts p
            JOIN post_categories pc ON p.id = pc.postId
            JOIN categories c ON pc.categoryId = c.id
          WHERE p.statusName = 'Published'
            AND p.publish_date >= DATEADD(day, -${currentInterval}, GETDATE())
          ORDER BY p.premium DESC, p.views DESC, p.likes DESC;
        `);
      records = result.recordset;
      if (records.length === 0 && currentInterval < maxInterval) {
        currentInterval += 7;
      } else {
        break;
      }
    } while (true);

    callback(null, records);
  } catch (err) {
    callback(err, null);
  }
};

// 2. Highlighted posts (no premium)
const getHighlightedPostsNoPremium = async (callback) => {
  const baseInterval = 7;
  const maxInterval = 365;
  let currentInterval = baseInterval;
  try {
    const pool = await connectDB();
    let records = [];

    do {
      const result = await pool.request()
        .query(`
          SELECT TOP 4
            p.*,
            c.name AS category_name
          FROM posts p
            JOIN post_categories pc ON p.id = pc.postId
            JOIN categories c ON pc.categoryId = c.id
          WHERE p.statusName = 'Published'
            AND p.premium = 0
            AND p.publish_date >= DATEADD(day, -${currentInterval}, GETDATE())
          ORDER BY p.views DESC, p.likes DESC;
        `);
      records = result.recordset;
      if (records.length === 0 && currentInterval < maxInterval) {
        currentInterval += 7;
      } else {
        break;
      }
    } while (true);

    callback(null, records);
  } catch (err) {
    callback(err, null);
  }
};

// 3. Top 10 liked posts
const getTop10MostViewedPosts = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .execute('GetTop10ViewedPosts');
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 4. Top 10 newest posts
const getTop10NewestPosts = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .execute('GetLatest10Posts');
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 5. Categories list
const getCategories = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .execute('GetCategories');
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

// 6. Top categories with newest posts (chưa có SP, vẫn dùng dynamic SQL)
const getTopCategoriesWithNewestPosts = async (callback) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .query(`
        WITH TopCategories AS (
          SELECT TOP 10
            c.id AS category_id,
            c.name AS category_name,
            SUM(p.views) AS total_views
          FROM categories c
            JOIN post_categories pc ON c.id = pc.categoryId
            JOIN posts p ON pc.postId = p.id
          WHERE p.statusName = 'Published'
          GROUP BY c.id, c.name
          ORDER BY total_views DESC
        ),
        RankedPosts AS (
          SELECT
            p.*,
            pc.categoryId,
            ROW_NUMBER() OVER (
              PARTITION BY pc.categoryId
              ORDER BY p.premium DESC, p.publish_date DESC
            ) AS row_num
          FROM posts p
            JOIN post_categories pc ON p.id = pc.postId
            JOIN TopCategories tc ON pc.categoryId = tc.category_id
          WHERE p.statusName = 'Published'
        )
        SELECT
          c.name AS category_name,
          rp.*
        FROM RankedPosts rp
          JOIN categories c ON rp.categoryId = c.id
        WHERE rp.row_num <= 3
        ORDER BY c.name, rp.publish_date DESC;
      `);
    callback(null, result.recordset);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = {
  getHighlightedPosts,
  getHighlightedPostsNoPremium,
  getTop10MostViewedPosts,
  getTop10NewestPosts,
  getCategories,
  getTopCategoriesWithNewestPosts
};
