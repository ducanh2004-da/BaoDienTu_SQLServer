-- Chọn cơ sở dữ liệu
USE baodientu8;
GO

-- Thêm dữ liệu vào bảng users
INSERT INTO users (username, email, password, role, created_at)
VALUES
    ('John', 'john@example.com', '$2a$10$Ufb9xTeA.1.e08gvS8KZt.uoREaCkyhJrrNMXwN1ExfB2SXyQ8bv.', 'subscriber', GETDATE()),
    ('Jane', 'jane@example.com', '$2a$10$Ufb9xTeA.1.e08gvS8KZt.uoREaCkyhJrrNMXwN1ExfB2SXyQ8bv.', 'writer', GETDATE()),
    ('Admin', 'admin@example.com', '$2a$10$Ufb9xTeA.1.e08gvS8KZt.uoREaCkyhJrrNMXwN1ExfB2SXyQ8bv.', 'admin', GETDATE());
GO
-- 0909090909 password

-- Thêm dữ liệu vào bảng categories
INSERT INTO categories (name, parent_id, editorId) VALUES
    ('Technology', NULL, NULL),
    ('Lifestyle', NULL, NULL),
    ('Education', NULL, NULL),
    ('AI', 1, 4),
    ('Gadgets', 1, 4),
    ('Health', 2, 4),
    ('Travel', 2, 4),
    ('Online Courses', 3, 4);
GO

-- Thêm dữ liệu vào bảng posts
INSERT INTO posts (title, publish_date, premium, abstract, content, statusName, userId, tags) VALUES
    ('Introduction to AI', '2024-12-01', 1, 'Abstract about AI', 'Nội dung về AI...', 'Published', 2, 'AI, Machine Learning'),
    ('Top Gadgets of 2024', '2024-11-15', 0, 'Abstract about gadgets', 'Nội dung về Gadgets...', 'Published', 2, 'Gadgets, Technology'),
    ('Healthy Living Tips', '2024-10-20', 1, 'Abstract about health', 'Nội dung về sức khỏe...', 'Published', 2, 'Health, Fitness'),
    ('Best Travel Destinations', '2024-09-25', 0, 'Abstract about travel', 'Nội dung về du lịch...', 'Published', 2, 'Travel, Adventure'),
    ('Top Online Courses', '2024-08-30', 1, 'Abstract about courses', 'Nội dung về khóa học...', 'Published', 2, 'Education, Online Courses'),
    ('AI in Education', '2024-12-02', 1, 'Abstract about AI in education', 'Nội dung về AI trong giáo dục...', 'Published', 2, 'AI, Education'),
    ('Fitness Gadgets', '2024-10-22', 0, 'Abstract about fitness gadgets', 'Nội dung về fitness gadgets...', 'Published', 2, 'Health, Gadgets'),
    ('Travel Gadgets', '2024-09-28', 1, 'Abstract about travel gadgets', 'Nội dung về travel gadgets...', 'Published', 2, 'Travel, Gadgets'),
    ('AI and Healthcare', '2024-12-03', 1, 'Abstract about AI and healthcare', 'Nội dung về AI và y tế...', 'Published', 2, 'AI, Health'),
    ('Budget Travel Tips', '2024-09-29', 0, 'Abstract about budget travel', 'Nội dung về du lịch giá rẻ...', 'Published', 2, 'Travel, Budget');
GO


-- Associate posts with categories
INSERT INTO post_categories (postId, categoryId) VALUES
    (1, 4), (2, 5), (3, 6), (4, 7), (5, 8),
    (6, 4), (7, 5), (8, 5), (9, 6), (10, 7);
GO
-- Insert sample comments
INSERT INTO comments (postId, content, userId)
VALUES
    (1, 'Great insights on AI!', 1),
    (2, 'This is very helpful, thanks!', 1),
    (3, 'Python is my favorite language!', 1),
    (4, 'Amazing article on travel tips!', 2),
    (5, 'This helped me a lot, thanks!', 1);
GO
-- Insert sample likes
INSERT INTO likes (postId, userId)
VALUES
    (1, 1),
    (2, 1),
    (3, 2),
    (4, 2),
    (5, 1),
    (6, 2);
GO