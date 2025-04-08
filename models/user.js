const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const {v4: uuidv4} = require("uuid");
const validator = require("validator");


//Prepared Statements for SQL Injection

function validateInput(input) {
    if (!validator.isAlphanumeric(input)) {
      throw new Error("Dữ liệu không hợp lệ!");
    }
    return input;
  }

const getAllUser = (callback) => {
    db.query('SELECT * FROM users', callback);
}

const findById = (id, callback) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0] || null);
    });
};

const findUser = (id,callback) =>{
    db.query('SELECT * FROM users WHERE id = ?',
        [id],callback)
}

const add = (newUser, callback) => {
    //chuyển định dạng nam-thang-ngay để lưu được vào database
    const birthday = moment(newUser.birthday,'DD/MM/YYYY').format('YYYY-MM-DD');
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
        return callback(new Error("Invalid email format."));
    }
    const userId = uuidv4(); // Tạo UUID mới cho mỗi lần thêm user
    if (newUser.password) {
        // Only hash the password if it's provided (for normal registrations)
        bcrypt.hash(validateInput(newUser.password), 10, (err, hash) => {
            if (err) throw err;
            db.query(
                'INSERT INTO users(id,username, email, password,birthday) VALUES (?,?, ?, ?, ?)',
                [userId,validateInput(newUser.username), newUser.email, hash, birthday],
                callback
            );
        });
    }
    else if(newUser.githubId) {
        db.query(
            'INSERT INTO users(id,username, email, githubId) VALUES (?,?, ?, ?)',
            [userId,validateInput(newUser.username), newUser.email, newUser.githubId],
            callback
        );
    }
    else {
        // If no password, create the user without hashing (for Google/Github logins)
            db.execute(
                'INSERT INTO users (id,username, email, googleId, role) VALUES (?,?, ?, ?, ?)',
                [userId,validateInput(newUser.username), newUser.email, newUser.googleId, newUser.role || 'user'],
                callback
            );
    }
};

const findByEmail = (email, callback) => {
    db.execute('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0] || null); 
    });
}

const findByGithubId = (githubId,callback) =>{
    db.execute('SELECT * FROM users WHERE githubId = ?', [githubId], function (err, results) {
        if (err) {
            console.error('Error occurred while querying:', err);
            return callback(err);  // Trả về lỗi nếu có
        }
        return callback(null, results[0] || null);  // Trả về kết quả đầu tiên tìm thấy
    });
}

const findByGoogleId = (googleId, callback) => {
    db.execute('SELECT * FROM users WHERE googleId = ?', [googleId], function (err, results) {
        if (err) {
            console.error('Error occurred while querying:', err);
            return callback(err);  // Trả về lỗi nếu có
        }
        if (results.length === 0) {
            console.log('No user found with Google ID:', googleId);
            return callback(null, null); // Trả về null nếu không tìm thấy user
        }
        return callback(null, results[0] || null);  // Trả về kết quả đầu tiên tìm thấy
    });
}

const saveOTP = (email,otp,expire,callback) =>{
    db.query('UPDATE users SET otp_code=?, otp_expires_at=? WHERE email =?',
        [otp,expire,email],callback
    )
}

const verifyOtp = (email,otp,callback) =>{
    db.query('SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()',
        [email,otp],callback
    )
}

const resetPassword = (email,newPassword,callback) =>{
    db.query('UPDATE users SET password = ? WHERE email = ?', [validateInput(newPassword), email], callback);
}

const updateRole = (id,user, callback) =>{
    db.query('UPDATE users SET role = ? WHERE id = ? ',
        [user.role,id],callback
    )
}

const editUser = (id,user,imageUrl,callback) =>{
    db.query(
        'UPDATE users SET username = ?, email = ?, penName = ?, birthday = ?, imgURL = ? WHERE id = ?',
        [user.username, user.email, user.penName, user.birthday,imageUrl, id],
        callback
    );
}

const deletes = (id,callback) =>{
    db.query('DELETE FROM users WHERE id = ?',
        [id],callback
    )
}

const getEditor = (callback) =>{
    db.query("SELECT * FROM users WHERE role = 'editor'", 
        callback
    );
}

module.exports = {
    getAllUser, 
    findById,
    findUser,
    findByEmail,
    findByGithubId,
    findByGoogleId,
    add,
    saveOTP,
    verifyOtp,
    resetPassword,
    updateRole,
    deletes,
    getEditor,
    editUser
};