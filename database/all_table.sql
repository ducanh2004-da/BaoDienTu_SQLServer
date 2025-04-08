-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS baodientu;

-- Use the database
USE baodientu;

-- Create the `users` table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100), 
    email VARCHAR(100) NOT NULL UNIQUE, 
    password VARCHAR(255),
    githubId VARCHAR(255) UNIQUE,
    googleId VARCHAR(255) UNIQUE,
    role ENUM('subscriber', 'writer', 'editor', 'admin', 'non-subscriber') DEFAULT 'subscriber',
    penName VARCHAR(50),
    birthday DATE,
    imgURL VARCHAR(255) DEFAULT NULL,
	otp_code VARCHAR(6),
    otp_expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the `categories` table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    parent_id INT,
    editorId INT
);

-- Create the `posts` table
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    publish_date DATE,
    premium BOOLEAN,
    abstract TEXT,
    content LONGTEXT,
    statusName ENUM('Published', 'Rejected', 'Pending-Approval', 'Approved') NOT NULL,
    media VARCHAR(255),
    userId INT NOT NULL,
    refuse VARCHAR(255),
    scheduled_publish_date DATETIME NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Add a full-text index to the `title` and `abstract` columns
ALTER TABLE posts ADD FULLTEXT(title, abstract);

-- Add a full-text index to the `tags` column
ALTER TABLE posts ADD FULLTEXT(tags);


-- Create the `post_categories` table (many-to-many relationship)
CREATE TABLE post_categories (
    postId INT,
    categoryId INT,
    PRIMARY KEY (postId, categoryId),
    CONSTRAINT fk_post_categories_post
        FOREIGN KEY (postId) REFERENCES posts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_post_categories_category
        FOREIGN KEY (categoryId) REFERENCES categories(id)
        ON DELETE CASCADE
);

-- Create the `comments` table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    postId INT,
    commentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    userId INT NOT NULL,
    CONSTRAINT fk_comments_post
        FOREIGN KEY (postId) REFERENCES posts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create the `subscriptions` table
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY),
    status ENUM('Active', 'Expired') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create the `likes` table
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    postId INT NOT NULL,
    userId INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_likes_post
        FOREIGN KEY (postId) REFERENCES posts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_likes_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE,
    UNIQUE (postId, userId) -- Ensures a user can like a post only once
);

-- Create a trigger to handle new users and assign default subscription
DELIMITER $$

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    -- Insert default subscription for the new user only if the role is subscriber or non-subscriber
    IF NEW.role IN ('subscriber') THEN
        INSERT INTO subscriptions (userId)
        VALUES (NEW.id);
    END IF;
END$$

DELIMITER ;

-- Create an event to update subscription status and user role
DELIMITER $$

CREATE EVENT update_subscription_status
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    -- Update expired subscriptions
    UPDATE subscriptions
    SET status = 'Expired'
    WHERE end_date < CURRENT_DATE AND status = 'Active';

    -- Update users with expired subscriptions to 'non-subscriber'
    UPDATE users
    SET role = 'non-subscriber'
    WHERE id IN (
        SELECT userId
        FROM subscriptions
        WHERE status = 'Expired'
    )
    AND role = 'subscriber'; -- Only downgrade subscribers
END;

DELIMITER ;

-- Create a trigger to update the `likes` count in the `posts` table
DELIMITER $$

CREATE TRIGGER after_like_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    UPDATE posts
    SET likes = likes + 1
    WHERE id = NEW.postId;
END$$

CREATE TRIGGER after_like_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    UPDATE posts
    SET likes = likes - 1
    WHERE id = OLD.postId;
END$$

DELIMITER ;

-- Enable the event scheduler
SET GLOBAL event_scheduler = ON;
