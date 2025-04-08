-- View danh sách các user theo vai trò (admin, editor, writer, subscriber)
CREATE VIEW view_users_by_role AS
SELECT id, username, email, role, penName, birthday, imgURL, created_at, updated_at
FROM users
WHERE role IN ('admin', 'editor', 'writer', 'subscriber');

-- View danh sách các bài báo premium
CREATE VIEW view_premium_posts AS
SELECT id, title, publish_date, abstract, content, statusName, media, userId, views, likes, tags, created_at, updated_at
FROM posts
WHERE premium = TRUE;

-- View danh sách các bài báo không phải premium
CREATE VIEW view_non_premium_posts AS
SELECT id, title, publish_date, abstract, content, statusName, media, userId, views, likes, tags, created_at, updated_at
FROM posts
WHERE premium = FALSE;

-- View thông tin chi tiết của user (bao gồm subscription nếu có)
CREATE VIEW view_user_details AS
SELECT u.id, u.username, u.email, u.role, u.penName, u.birthday, u.imgURL, u.created_at, u.updated_at, 
       s.start_date, s.end_date, s.status AS subscription_status
FROM users u
LEFT JOIN subscriptions s ON u.id = s.userId;

-- View thông tin chi tiết của bài báo (kèm theo thông tin tác giả)
CREATE VIEW view_post_details AS
SELECT p.id, p.title, p.publish_date, p.premium, p.abstract, p.content, p.statusName, p.media, 
       p.views, p.likes, p.tags, p.created_at, p.updated_at,
       u.username AS author_username, u.penName AS author_penName
FROM posts p
JOIN users u ON p.userId = u.id;