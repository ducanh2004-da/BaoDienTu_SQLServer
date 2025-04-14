// middlewares/publishPost.js
const schedule = require('node-schedule');
const { connectDB, sql } = require('../utils/db');

// Kiểm tra và cập nhật trạng thái bài viết mỗi phút
const updateScheduledPosts = () => {
  schedule.scheduleJob('* * * * *', async () => {
    try {
      const pool = await connectDB();
      const currentTime = new Date();

      const result = await pool.request()
        .input('currentTime', sql.DateTime, currentTime)
        .query(`
          UPDATE posts
          SET statusName = 'Published'
          WHERE scheduled_publish_date <= @currentTime
            AND statusName = 'Approved';
        `);

      console.log('✔️ Scheduled posts updated, rowsAffected:', result.rowsAffected);
    } catch (err) {
      console.error('❌ Error updating scheduled posts:', err.message);
    }
  });
};

module.exports = { updateScheduledPosts };
