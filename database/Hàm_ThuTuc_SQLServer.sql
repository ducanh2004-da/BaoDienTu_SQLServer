--2.Quản lý người dùng
-- Lấy tất cả người dùng

CREATE PROCEDURE sp_GetAllUsers
AS
BEGIN
    SELECT * FROM users;
END;
GO

-- Tìm người dùng theo ID

CREATE PROCEDURE sp_FindUserById
    @id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM users WHERE userId = @id;
END;
GO

-- Tìm người dùng theo email

CREATE PROCEDURE sp_FindUserByEmail
    @Email NVARCHAR(255)
AS
BEGIN
    SELECT * FROM users WHERE email = @Email;
END;
GO

-- Tìm người dùng theo Google ID

CREATE PROCEDURE sp_FindUserByGoogleId
    @GoogleId NVARCHAR(255)
AS
BEGIN
    SELECT * FROM users WHERE googleId = @GoogleId;
END;
GO

-- Tìm người dùng theo Github ID

CREATE PROCEDURE sp_FindUserByGithubId
    @GithubId NVARCHAR(255)
AS
BEGIN
    SELECT * FROM users WHERE githubId = @GithubId;
END;
GO

-- Thêm người dùng mới:
 
CREATE PROCEDURE sp_AddUser
    @Username NVARCHAR(255),
    @Email NVARCHAR(255),
    @Password NVARCHAR(255),
    @Birthday DATE,
    @GoogleId NVARCHAR(255) = NULL,
    @GithubId NVARCHAR(255) = NULL,
    @Role NVARCHAR(50) = 'user'
AS
BEGIN
    INSERT INTO users (userId, username, email, password, birthday, googleId, githubId, role)
    VALUES (NEWID(), @Username, @Email, @Password, @Birthday, @GoogleId, @GithubId, @Role);
END;
GO

-- Cập nhật OTP:

CREATE PROCEDURE sp_SaveOTP
    @Email NVARCHAR(255),
    @OTP NVARCHAR(10),
    @Expire DATETIME
AS
BEGIN
    UPDATE users SET otp_code = @OTP, otp_expires_at = @Expire WHERE email = @Email;
END;
GO

-- Xác minh OTP

CREATE PROCEDURE sp_VerifyOTP
    @Email NVARCHAR(255),
    @OTP NVARCHAR(10)
AS
BEGIN
    SELECT * FROM users WHERE email = @Email AND otp_code = @OTP AND otp_expires_at > GETDATE();
END;
GO

-- Đặt lại mật khẩu

CREATE PROCEDURE sp_ResetPassword
    @Email NVARCHAR(255),
    @NewPassword NVARCHAR(255)
AS
BEGIN
    UPDATE users SET password = @NewPassword WHERE email = @Email;
END;
GO

-- Cập nhật vai trò người dùng

CREATE PROCEDURE sp_UpdateUserRole
    @Id UNIQUEIDENTIFIER,
    @Role NVARCHAR(50)
AS
BEGIN
    UPDATE users SET role = @Role WHERE userId = @Id;
END;
GO

-- Cập nhật thông tin người dùng

CREATE PROCEDURE sp_EditUser
    @Id UNIQUEIDENTIFIER,
    @Username NVARCHAR(255),
    @Email NVARCHAR(255),
    @PenName NVARCHAR(255),
    @Birthday DATE,
    @ImgURL NVARCHAR(500)
AS
BEGIN
    UPDATE users SET username = @Username, email = @Email, penName = @PenName, birthday = @Birthday, imgURL = @ImgURL WHERE userId = @Id;
END;
GO

-- Xóa người dùng

CREATE PROCEDURE sp_DeleteUser
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    DELETE FROM users WHERE userId = @Id;
END;
GO

-- Lấy danh sách editor

CREATE PROCEDURE sp_GetEditors
AS
BEGIN
    SELECT * FROM users WHERE role = 'editor';
END;
GO

--3.Quản lý bài báo:
-- Lấy tất cả bài viết
CREATE PROCEDURE GetAllPosts
AS
BEGIN
    SELECT * FROM posts ORDER BY premium DESC;
END;
GO

-- Lấy bài viết theo ID

CREATE PROCEDURE GetPostById @id INT
AS
BEGIN
    SELECT * FROM posts WHERE postId = @id;
END;
GO

--Cập nhật trạng thái bài viết thành 'Published'

CREATE PROCEDURE UpdatePublished @id INT
AS
BEGIN
    UPDATE posts SET statusName = 'Published' WHERE postId = @id;
END;
GO

-- Cập nhật ngày xuất bản theo lịch trình

CREATE PROCEDURE UpdateScheduledPublishDate @id INT, @publishDate DATETIME
AS
BEGIN
    UPDATE posts SET scheduled_publish_date = @publishDate, statusName = 'Approved' WHERE postId = @id;
END;
GO

--Lấy thông tin tác giả bài viết

CREATE PROCEDURE GetPostAuthorInfo @id INT
AS
BEGIN
    SELECT users.userId, users.username, users.penName, users.email
    FROM users
    JOIN posts ON users.userId = posts.userId
    WHERE posts.postId = @id;
END;
GO

--Cập nhật bài viết:

CREATE PROCEDURE UpdatePost @id INT, @title NVARCHAR(255), @abstract NVARCHAR(MAX), @content NVARCHAR(MAX)
AS
BEGIN
    UPDATE posts SET title = @title, abstract = @abstract, content = @content WHERE postId = @id;
END;
GO

-- Xóa bài viết

CREATE PROCEDURE DeletePost @id INT
AS
BEGIN
    DELETE FROM posts WHERE postId = @id;
END;
GO

--Cập nhật lượt xem bài viết

CREATE PROCEDURE UpdateView @id INT
AS
BEGIN
    UPDATE posts SET views = views + 1 WHERE postId = @id;
END;
GO

--Cập nhật lượt thích

CREATE PROCEDURE UpdateLike @postId INT, @userId INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM likes WHERE postId = @postId AND userId = @userId)
        DELETE FROM likes WHERE postId = @postId AND userId = @userId;
    ELSE
        INSERT INTO likes (postId, userId) VALUES (@postId, @userId);
END;
GO

-- Kiểm tra bài viết có phải premium không

CREATE FUNCTION IsPremium(@id INT) RETURNS BIT
AS
BEGIN
    DECLARE @premium BIT;
    SELECT @premium = premium FROM posts WHERE postId = @id;
    RETURN @premium;
END;
GO

--4.Các thao tác trên trang chủ:
-- Lấy danh sách 10 bài viết nhiều lượt like nhất
CREATE PROCEDURE GetTop10LikedPosts
AS
BEGIN
    SELECT TOP 10 *
    FROM posts
    WHERE statusName = 'Published'
    ORDER BY likes DESC, publish_date DESC;
END;
GO

-- Lấy danh sách 10 bài viết mới nhất
CREATE PROCEDURE GetLatest10Posts
AS
BEGIN
    SELECT TOP 10 *
    FROM posts
    WHERE statusName = 'Published'
    ORDER BY publish_date DESC;
END;
GO

-- Lấy danh mục bài viết
CREATE PROCEDURE GetCategories
AS
BEGIN
    SELECT * FROM categories;
END;
GO

-- Trigger tự động cập nhật số lượng like
CREATE TRIGGER trg_UpdateLikes
ON posts
AFTER INSERT, UPDATE
AS
BEGIN
    UPDATE posts
    SET likes = (SELECT COUNT(*) FROM likes WHERE likes.postId = posts.postId)
    FROM posts
    INNER JOIN inserted i ON posts.postId = i.postId;
END;
GO

-- Lấy danh sách 10 bài viết nhiều lượt xem nhất
CREATE PROCEDURE GetTop10ViewedPosts
AS
BEGIN
    SELECT TOP 10 *
    FROM posts
    WHERE statusName = 'Published'
    ORDER BY views DESC, publish_date DESC;
END;
GO


--5.Quản lý gói đăng ký của người dùng:
-- Lấy tất cả subscription

CREATE PROCEDURE GetAllSubscriptions
AS
BEGIN
    SELECT * FROM subscriptions;
END;
GO

-- Lấy subscription theo ID

CREATE PROCEDURE GetSubscriptionById
    @subscriptionId INT
AS
BEGIN
    SELECT * FROM subscriptions WHERE subscriptionId = @subscriptionId;
END;
GO

-- Lấy subscription theo UserId:

CREATE PROCEDURE GetSubscriptionByUserId
    @userId INT
AS
BEGIN
    SELECT * FROM subscriptions WHERE userId = @userId;
END;
GO

-- Lấy số ngày còn lại của subscription

CREATE FUNCTION GetUserSubscriptionDaysLeft(@userId INT)
RETURNS INT
AS
BEGIN
    DECLARE @daysLeft INT;
    SELECT @daysLeft = DATEDIFF(DAY, GETDATE(), end_date) FROM subscriptions WHERE userId = @userId;
    RETURN @daysLeft;
END;
GO

-- Gia hạn subscription

CREATE PROCEDURE ExtendSubscription
    @userId INT,
    @days INT
AS
BEGIN
    UPDATE subscriptions
    SET end_date = CASE
                      WHEN status = 'Active' THEN DATEADD(DAY, @days, end_date)
                      ELSE DATEADD(DAY, @days, GETDATE())
                  END,
        status = 'Active',
        updated_at = GETDATE()
    WHERE userId = @userId;
END;
GO

-- Đăng ký subscription

CREATE PROCEDURE Subscribe
    @userId INT,
    @days INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM subscriptions WHERE userId = @userId)
    BEGIN
        UPDATE subscriptions
        SET start_date = GETDATE(),
            end_date = DATEADD(DAY, @days, GETDATE()),
            status = 'Active',
            updated_at = GETDATE()
        WHERE userId = @userId;
    END
    ELSE
    BEGIN
        INSERT INTO subscriptions (userId, start_date, end_date, status, created_at, updated_at)
        VALUES (@userId, GETDATE(), DATEADD(DAY, @days, GETDATE()), 'Active', GETDATE(), GETDATE());
    END
END;
GO

-- Hủy subscription

CREATE PROCEDURE CancelSubscription
    @userId INT
AS
BEGIN
    UPDATE subscriptions
    SET status = 'Expired',
        end_date = GETDATE(),
        updated_at = GETDATE()
    WHERE userId = @userId AND status = 'Active';

    UPDATE users
    SET role = 'non-subscriber'
    WHERE userId = @userId;
END;
GO

-- Lấy ngày hết hạn của subscription

CREATE PROCEDURE SelectEndDay
    @userId INT
AS
BEGIN
    SELECT end_date FROM subscriptions WHERE userId = @userId;
END;
GO

-- Trigger cập nhật trạng thái subscription khi hết hạn

CREATE TRIGGER trg_UpdateSubscriptionStatus
ON subscriptions
AFTER UPDATE
AS
BEGIN
    UPDATE subscriptions
    SET status = 'Expired'
    WHERE end_date <= GETDATE() AND status = 'Active';
END;
GO

--6.Quản lý danh mục:
-- Lấy tất cả danh mục

CREATE PROCEDURE GetAllCategories
AS
BEGIN
    SELECT * FROM categories;
END;
GO

-- Thêm danh mục mới

CREATE PROCEDURE AddCategory
    @editorId INT,
    @parentId INT NULL,
    @name NVARCHAR(255)
AS
BEGIN
    INSERT INTO categories(name, parent_id, editorId)
    VALUES (@name, @parentId, @editorId);
END;
GO

-- Cập nhật danh mục

CREATE PROCEDURE UpdateCategory
    @id INT,
    @name NVARCHAR(255)
AS
BEGIN
    UPDATE categories
    SET name = @name
    WHERE categoryId = @id;
END;
GO

-- Lấy danh mục theo ID

CREATE PROCEDURE GetCategoryById
    @id INT
AS
BEGIN
    SELECT * FROM categories WHERE categoryId = @id;
END;
GO

-- Xóa danh mục

CREATE PROCEDURE DeleteCategory
    @id INT
AS
BEGIN
    DELETE FROM categories WHERE categoryId = @id;
END;
GO

-- Lấy danh mục cha (parent categories)

CREATE PROCEDURE GetParentCategories
AS
BEGIN
    SELECT * FROM categories WHERE parent_id IS NULL;
END;
GO
-- Lấy danh mục theo editorId

CREATE PROCEDURE GetEditorCategories
    @editorId INT
AS
BEGIN
    SELECT * FROM categories WHERE editorId = @editorId;
END;
GO

-- Lấy danh mục của bài viết theo postId

CREATE PROCEDURE GetPostCategories
    @postId INT
AS
BEGIN
    SELECT c.categoryId, c.name
    FROM categories c
    JOIN post_categories pc ON c.categoryId = pc.categoryId
    WHERE pc.postId = @postId;
END;
GO

--7.Tạo và thao tác với bài viết của writer:
-- Tạo stored procedure để thêm bài viết

CREATE PROCEDURE InsertArticle
    @id UNIQUEIDENTIFIER,
    @title NVARCHAR(255),
    @publish_date DATETIME NULL,
    @abstract NVARCHAR(MAX),
    @content NVARCHAR(MAX),
    @tags NVARCHAR(255),
    @statusName NVARCHAR(50),
    @userId INT,
    @premium BIT
AS
BEGIN
    INSERT INTO posts (postId, title, publish_date, abstract, content, tags, statusName, created_at, updated_at, userId, premium)
    VALUES (@id, @title, @publish_date, @abstract, @content, @tags, @statusName, GETDATE(), GETDATE(), @userId, @premium);
END
GO

-- Tạo stored procedure để lấy bài viết theo trạng thái

CREATE PROCEDURE GetArticlesByStatus
    @statusName NVARCHAR(50),
    @userId INT
AS
BEGIN
    IF @statusName = 'all'
    BEGIN
        SELECT p.*, STRING_AGG(c.name, ', ') AS categories
        FROM posts p
        LEFT JOIN post_categories pc ON p.postId = pc.postId
        LEFT JOIN categories c ON pc.categoryId = c.categoryId
        WHERE p.userId = @userId
        GROUP BY p.postId, p.title, p.publish_date, p.abstract, p.content, p.tags, p.statusName, p.created_at, p.updated_at, p.userId, p.premium;
    END
    ELSE
    BEGIN
        SELECT p.*, STRING_AGG(c.name, ', ') AS categories
        FROM posts p
        LEFT JOIN post_categories pc ON p.postId = pc.postId
        LEFT JOIN categories c ON pc.categoryId = c.categoryId
        WHERE p.statusName = @statusName AND p.userId = @userId
        GROUP BY p.postId, p.title, p.publish_date, p.abstract, p.content, p.tags, p.statusName, p.created_at, p.updated_at, p.userId, p.premium;
    END
END
GO

-- Tạo stored procedure để lấy bài viết theo userId

CREATE PROCEDURE GetArticlesByUserId
    @userId INT
AS
BEGIN
    SELECT p.*, STRING_AGG(c.name, ', ') AS categories
    FROM posts p
    LEFT JOIN post_categories pc ON p.postId = pc.postId
    LEFT JOIN categories c ON pc.categoryId = c.categoryId
    WHERE p.userId = @userId
    GROUP BY p.postId, p.title, p.publish_date, p.abstract, p.content, p.tags, p.statusName, p.created_at, p.updated_at, p.userId, p.premium
    ORDER BY p.updated_at DESC;
END
GO

-- Tạo stored procedure để cập nhật bài viết

CREATE PROCEDURE UpdateArticle
    @id UNIQUEIDENTIFIER,
    @title NVARCHAR(255),
    @abstract NVARCHAR(MAX),
    @content NVARCHAR(MAX),
    @statusName NVARCHAR(50),
    @tags NVARCHAR(255),
    @premium BIT
AS
BEGIN
    UPDATE posts
    SET title = @title, abstract = @abstract, content = @content, statusName = @statusName, updated_at = GETDATE(), tags = @tags, premium = @premium
    WHERE postId = @id;

    DELETE FROM post_categories WHERE postId = @id;
END
GO

-- Trigger để tự động cập nhật ngày cập nhật của bài viết

CREATE TRIGGER trg_UpdatePostTimestamp
ON posts
AFTER UPDATE
AS
BEGIN
    UPDATE posts
    SET updated_at = GETDATE()
    FROM posts
    INNER JOIN inserted i ON posts.postId = i.id;
END
GO

--8.Duyệt và đăng bài viết của editor:
-- Lấy tất cả bài viết

CREATE PROCEDURE GetAllPosts
AS
BEGIN
    SELECT * FROM posts;
END;
GO

-- Lấy bài viết theo ID

CREATE PROCEDURE GetPostById
    @postId INT
AS
BEGIN
    SELECT * FROM posts WHERE postId = @postId;
END;
GO

-- Cập nhật trạng thái bài viết thành 'Published'

CREATE PROCEDURE UpdatePublished
    @postId INT
AS
BEGIN
    UPDATE posts SET statusName = 'Published' WHERE postId = @postId;
END;
GO

-- Lấy các bài viết theo trạng thái của editor

CREATE PROCEDURE GetArticlesByStatusOfEditor
    @statusName NVARCHAR(50),
    @editorId INT
AS
BEGIN
    SELECT posts.*, STRING_AGG(categories.name, ', ') AS categories
    FROM posts
    LEFT JOIN post_categories ON posts.postId = post_categories.postId
    LEFT JOIN categories ON post_categories.categoryId = categories.categoryId
    WHERE posts.statusName = @statusName AND categories.editorId = @editorId
    GROUP BY posts.postId;
END;
GO

-- Kiểm tra xem bài viết có nằm trong danh mục của editor không

CREATE FUNCTION IsPostInEditorCategories(@postId INT, @editorId INT)
RETURNS BIT
AS
BEGIN
    DECLARE @isInEditorCategories BIT = 0;
    IF EXISTS (
        SELECT 1
        FROM post_categories pc
        JOIN categories c ON pc.categoryId = c.categoryId
        WHERE pc.postId = @postId AND c.editorId = @editorId
    )
    BEGIN
        SET @isInEditorCategories = 1;
    END;
    RETURN @isInEditorCategories;
END;
GO

-- Lấy bài viết theo ID kèm danh mục

CREATE PROCEDURE GetArticleById
    @Id INT
AS
BEGIN
    SELECT posts.*, STRING_AGG(categories.name, ', ') AS categories
    FROM posts
    LEFT JOIN post_categories ON posts.postId = post_categories.postId
    LEFT JOIN categories ON post_categories.categoryId = categories.categoryId
    WHERE posts.postId = @id
    GROUP BY posts.postId;
END;
GO

-- Lấy danh mục theo danh sách ID

CREATE PROCEDURE GetCategoriesByIds
    @ids NVARCHAR(MAX)
AS
BEGIN
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = 'SELECT id, name FROM categories WHERE id IN (' + @ids + ')';
    EXEC sp_executesql @sql;
END;
GO

-- Lấy danh sách người dùng theo ID

CREATE PROCEDURE GetUsersByIds
    @ids NVARCHAR(MAX)
AS
BEGIN
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = 'SELECT id, username FROM users WHERE id IN (' + @ids + ')';
    EXEC sp_executesql @sql;
END;
GO

-- Lấy danh mục theo ID

CREATE PROCEDURE GetCategoryById
    @categoryId INT
AS
BEGIN
    SELECT name FROM categories WHERE categoryId = @categoryId;
END;
GO

-- Cập nhật trạng thái bài viết

CREATE PROCEDURE UpdateStatusName
    @statusName NVARCHAR(50),
    @postId INT,
    @refuse NVARCHAR(MAX) = NULL
AS
BEGIN
    IF @statusName = 'Approved'
    BEGIN
        UPDATE posts SET statusName = @statusName WHERE postId = @postId;
    END
    ELSE IF @statusName = 'Rejected'
    BEGIN
        UPDATE posts SET statusName = @statusName, refuse = @refuse WHERE postId = @postId;
    END
END;
GO

-- Trigger tự động cập nhật số lượng bài viết của editor khi có bài mới

CREATE TRIGGER trg_UpdateEditorPostCount
ON posts
AFTER INSERT, DELETE
AS
BEGIN
    UPDATE categories
    SET postCount = (SELECT COUNT(*) FROM posts p JOIN post_categories pc ON p.postId = pc.postId WHERE pc.categoryId = categories.categoryId)
    FROM categories;
END;
GO

--9.Quản lý bình luận:

-- Tạo stored procedure để lấy tất cả bình luận

CREATE PROCEDURE GetAllComments
AS
BEGIN
    SELECT * FROM comments;
END;
GO

-- Tạo stored procedure để lấy bình luận theo ID

CREATE PROCEDURE GetCommentById
    @CommentId INT
AS
BEGIN
    SELECT * FROM comments WHERE commentId = @CommentId;
END;
GO

-- Tạo stored procedure để lấy bình luận theo bài viết

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

-- Tạo stored procedure để thêm bình luận:

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