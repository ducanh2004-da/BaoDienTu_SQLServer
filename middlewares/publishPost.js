const schedule = require('node-schedule');
const db = require('../utils/db');

// Kiểm tra và cập nhật trạng thái bài viết mỗi phút
const updateScheduledPosts = () => {
    schedule.scheduleJob('* * * * *', () => {
        const currentTime = new Date();
        db.query(
            "UPDATE posts SET statusName = 'Published' WHERE scheduled_publish_date <= ? AND statusName = 'Approved'",
            [currentTime],
            (err, results) => {
                if (err) console.error("Error updating scheduled posts:", err.message);
            }
        );
    });
};

module.exports = { updateScheduledPosts };
