const bcrypt = require("bcryptjs");
const User = require("../models/user");
const transporter = require("../config/email");
const passport = require("passport");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const crypto = require("crypto");

dotenv.config();

module.exports.showForm = (req, res) => {
  res.render("account/form", { layout: false });
};

module.exports.Register = (req, res) => {
  const { username, email, password, birthday, googleId, githubId, role } = req.body;
  User.findByEmail(email, (err, existing) => {
    if (err) {
      console.error(err);
      req.flash("error_msg", "Có lỗi khi kiểm tra email.");
      return res.redirect("/api");
    }
    if (existing) {
      req.flash("error_msg", "Email đã được đăng ký");
      return res.redirect("/api");
    }
    const newUser = { username, email, password, birthday, googleId, githubId, role };
    User.add(newUser, (err) => {
      if (err) {
        console.error(err);
        req.flash("error_msg", "Đăng ký không thành công.");
        return res.redirect("/api");
      }
      req.flash("success_msg", "Bạn đã đăng ký thành công, vui lòng đăng nhập.");
      res.redirect("/api");
    });
  });
};

// Common login handler
function handleLogin(req, res, next, redirectPath) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error_msg", "Tên đăng nhập hoặc mật khẩu không đúng");
      return res.redirect("/api");
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.user = user;
      req.flash("success_msg", "Đăng nhập thành công");
      return res.redirect(redirectPath);
    });
  })(req, res, next);
}

module.exports.Login = (req, res, next) => handleLogin(req, res, next, "/main");
module.exports.LoginWriter = (req, res, next) => handleLogin(req, res, next, "/writer");
module.exports.LoginEditor = (req, res, next) => handleLogin(req, res, next, "/editor");
module.exports.LoginAdmin = (req, res, next) => handleLogin(req, res, next, "/admin");

module.exports.Logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.send('Không thể đăng xuất');
    }
    res.redirect('/home');
  });
};

module.exports.showForgotForm = (req, res) => {
  res.render("account/sendOtp");
};

module.exports.sendOtp = (req, res) => {
  const { email } = req.body;
  User.findByEmail(email, (err, user) => {
    if (err) {
      console.error(err);
      return res.render("account/sendOtp", { error: "Lỗi khi tìm email." });
    }
    if (!user) {
      return res.render("account/sendOtp", { error: "Không tìm thấy email." });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expire = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
    User.saveOTP(email, otp, expire, (err) => {
      if (err) {
        console.error(err);
        return res.render("account/sendOtp", { error: "Lỗi lưu OTP." });
      }
      transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Your OTP to reset password",
        text: `Your OTP is: ${otp}`
      }).then(info => {
        console.log("Email sent: " + info.response);
        res.render("account/checkOtp", { email, message: "OTP đã được gửi đến email của bạn" });
      }).catch(emailErr => {
        console.error(emailErr);
        res.render("account/sendOtp", { error: "Gửi OTP thất bại." });
      });
    });
  });
};

module.exports.showResetForm = (req, res) => {
  const { token, email } = req.query;
  res.render("account/resetPass", { token, email });
};

module.exports.checkOtp = (req, res) => {
  const { email, otp } = req.body;
  User.verifyOtp(email, otp, (err, records) => {
    if (err) {
      console.error(err);
      return res.render("account/checkOtp", { error: "Lỗi kiểm tra OTP." });
    }
    if (!records || records.length === 0) {
      return res.render("account/checkOtp", { error: "OTP không hợp lệ hoặc đã hết hạn." });
    }
    // OTP hợp lệ
    const token = crypto.randomBytes(20).toString("hex");
    res.redirect(`/api/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
  });
};

module.exports.resetPass = async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email) {
    return res.render("account/resetPass", { error: "Yêu cầu không hợp lệ." });
  }
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    User.resetPassword(email, hashed, (err) => {
      if (err) {
        console.error(err);
        return res.render("account/resetPass", { error: "Đặt lại mật khẩu thất bại." });
      }
      req.flash("success_msg", "Mật khẩu đã được cập nhật thành công.");
      res.redirect("/api");
    });
  } catch (hashErr) {
    console.error(hashErr);
    res.render("account/resetPass", { error: "Lỗi trong quá trình mã hóa." });
  }
};
