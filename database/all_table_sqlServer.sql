
-- Sử dụng cơ sở dữ liệu
USE baodientu8;
GO

-- Tạo bảng users
CREATE TABLE users (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100),
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255),
    githubId NVARCHAR(255),
    googleId NVARCHAR(255),
    role NVARCHAR(20) CHECK (role IN ('subscriber', 'writer', 'editor', 'admin', 'non-subscriber')) DEFAULT 'subscriber',
    penName NVARCHAR(50),
    birthday DATE,
    imgURL NVARCHAR(255) DEFAULT NULL,
    otp_code NVARCHAR(6),
    otp_expires_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Tạo bảng categories
CREATE TABLE categories (
    categoryId INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    parent_id INT,
    editorId INT
);
GO

-- Tạo bảng posts
CREATE TABLE posts (
    postId INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    publish_date DATE,
    premium BIT,
    abstract NVARCHAR(MAX),
    content NVARCHAR(MAX),
    statusName NVARCHAR(20) CHECK (statusName IN ('Published', 'Rejected', 'Pending-Approval', 'Approved')) NOT NULL,
    media NVARCHAR(255),
    userId INT NOT NULL,
    refuse NVARCHAR(255),
    scheduled_publish_date DATETIME NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    tags NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);
GO

-- Tạo chỉ mục FULLTEXT

-- Thêm phần tạo Full-Text Catalog trước khi tạo Index
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ftCatalog')
    CREATE FULLTEXT CATALOG ftCatalog AS DEFAULT;
GO
-- Tạo index đặc biệt cho full-text
CREATE UNIQUE INDEX UX_posts_postId ON posts(postId);
GO

-- Tạo full-text index
CREATE FULLTEXT INDEX ON posts(title, abstract, tags)
KEY INDEX UX_posts_postId
ON ftCatalog;
GO

CREATE FULLTEXT INDEX ON posts(tags) 
KEY INDEX PK__posts__postId
ON ftCatalog;
GO



-- Tạo bảng post_categories (quan hệ nhiều - nhiều)
CREATE TABLE post_categories (
    postId INT,
    categoryId INT,
    PRIMARY KEY (postId, categoryId),
    FOREIGN KEY (postId) REFERENCES posts(postId) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(categoryId) ON DELETE CASCADE
);
GO

-- Tạo bảng comments
CREATE TABLE comments (
    commentId INT IDENTITY(1,1) PRIMARY KEY,
    postId INT,
    commentDate DATETIME DEFAULT GETDATE(),
    content NVARCHAR(MAX) NOT NULL,
    userId INT NOT NULL,
    FOREIGN KEY (postId) REFERENCES posts(postId) ON DELETE NO ACTION,
	FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE NO ACTION


);
GO

-- Tạo bảng subscriptions
CREATE TABLE subscriptions (
    subscriptionId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    start_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    end_date DATE NOT NULL DEFAULT DATEADD(DAY, 7, GETDATE()),
    status NVARCHAR(10) CHECK (status IN ('Active', 'Expired')) DEFAULT 'Active',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);
GO

-- Tạo bảng likes
CREATE TABLE likes (
    likeId INT IDENTITY(1,1) PRIMARY KEY,
    postId INT NOT NULL,
    userId INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (postId) REFERENCES posts(postId) ON DELETE NO ACTION,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE NO ACTION,
    CONSTRAINT unique_like UNIQUE (postId, userId) -- Đặt sau cùng
);
GO


-- Tạo trigger để cập nhật số lượt thích
CREATE TRIGGER after_like_insert
ON likes
AFTER INSERT
AS
BEGIN
    UPDATE posts
    SET likes = ISNULL(likes, 0) + 1
    WHERE postId IN (SELECT postId FROM inserted);
END;
GO

CREATE TRIGGER after_like_delete
ON likes
AFTER DELETE
AS
BEGIN
    UPDATE posts
    SET likes = ISNULL(likes, 0) - 1
    WHERE postId IN (SELECT postId FROM deleted);
END;
GO


-- Tạo trigger để thêm subscription mặc định
CREATE TRIGGER after_user_insert
ON users
AFTER INSERT
AS
BEGIN
    INSERT INTO subscriptions (userId)
    SELECT userId FROM inserted 
    WHERE role = 'subscriber' AND NOT EXISTS (
        SELECT 1 FROM subscriptions WHERE subscriptions.userId = inserted.userId
    );
END;
GO


-- Tạo job cập nhật trạng thái subscription
-- Xóa job cũ nếu tồn tại
IF EXISTS (SELECT job_id FROM msdb.dbo.sysjobs WHERE name = 'UpdateSubscriptionStatus')
    EXEC msdb.dbo.sp_delete_job @job_name = 'UpdateSubscriptionStatus';
GO

-- Tạo job mới
EXEC msdb.dbo.sp_add_job @job_name = 'UpdateSubscriptionStatus';
EXEC msdb.dbo.sp_add_jobstep @job_name = 'UpdateSubscriptionStatus',
    @step_name = 'Update Subscriptions',
    @subsystem = 'TSQL',
    @command = N'
    UPDATE subscriptions 
    SET status = ''Expired'' 
    WHERE end_date < GETDATE() AND status = ''Active'';

    UPDATE users 
    SET role = ''non-subscriber'' 
    WHERE userId IN (
        SELECT userId FROM subscriptions WHERE status = ''Expired''
    ) AND role = ''subscriber'';
    ',
    @on_success_action = 1;

-- Sửa phần tạo schedule
DECLARE @schedule_id INT;

-- Xóa schedule cũ nếu tồn tại
IF EXISTS (SELECT 1 FROM msdb.dbo.sysschedules WHERE name = 'DailySchedule')
BEGIN
    SELECT @schedule_id = schedule_id 
    FROM msdb.dbo.sysschedules 
    WHERE name = 'DailySchedule';
    
    EXEC msdb.dbo.sp_detach_schedule 
        @job_name = 'UpdateSubscriptionStatus',
        @schedule_id = @schedule_id;
        
    EXEC msdb.dbo.sp_delete_schedule 
        @schedule_id = @schedule_id;
END

-- Tạo schedule mới
EXEC msdb.dbo.sp_add_schedule 
    @schedule_name = 'DailySchedule',
    @freq_type = 4,            -- Daily
    @freq_interval = 1,        -- Every day
    @active_start_time = 010000, -- 1:00 AM
    @schedule_id = @schedule_id OUTPUT;

-- Attach schedule bằng schedule_id
EXEC msdb.dbo.sp_attach_schedule 
    @job_name = 'UpdateSubscriptionStatus',
    @schedule_id = @schedule_id;

EXEC msdb.dbo.sp_add_jobserver @job_name = 'UpdateSubscriptionStatus';
GO

