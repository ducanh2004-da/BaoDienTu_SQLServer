USE baodientu4;
GO
-- Tạo các role cho từng loại người dùng
CREATE ROLE SubscriberRole;
CREATE ROLE WriterRole;
CREATE ROLE EditorRole;
CREATE ROLE AdminRole;
CREATE ROLE NonSubscriberRole;
GO

GRANT SELECT ON posts TO SubscriberRole;
GO
GRANT SELECT, INSERT, UPDATE ON posts TO WriterRole;
GO
GRANT SELECT, UPDATE ON posts TO EditorRole;
GO
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO AdminRole;
GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO AdminRole;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO AdminRole;
-- Nếu có bảng tags thì:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO AdminRole;
GO
-- Gán user vào role (ví dụ: gán tài khoản 'john.doe' vào WriterRole)
EXEC sp_addrolemember 'WriterRole', 'Jane';
GO

-- Nếu cần loại bỏ:
EXEC sp_droprolemember 'WriterRole', 'Admin';
GO
