const bcrypt = require("bcryptjs");
const User = require("../models/user");
const transporter = require("../config/email");
const passport = require("passport");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const crypto = require("crypto");
dotenv.config();
require("dotenv").config();

const otpStorage = {};

// Tạo OTP ngẫu nhiên từ 100000 đến 999999
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

module.exports.showForm = (req, res) => {
  res.render("account/form", { layout: false });
};
module.exports.Register = (req, res) => {
  const users = req.body;
  try {
    User.findByEmail(users.email, (err, user) => {
      if (user) {
        req.flash("error_msg", "Email is already registered");
        return res.redirect("/api");
      }

      // Nếu người dùng chưa tồn tại, tạo mới người dùng
      if (!users.password) {
        // Nếu đăng ký qua Google/Facebook, không cần mật khẩu
        User.add(
          {
            username: users.username,
            email: users.email,
          },
          (err) => {
            if (err) throw err;
            req.flash("success_msg", "You are now registered and can log in");
            res.redirect("/api");
          }
        );
      } else {
        // Nếu đăng ký thông qua form, mật khẩu phải được mã hóa
        User.add(users, (err) => {
          if (err) throw err;
          req.flash("success_msg", "You are now registered and can log in");
          res.redirect("/api");
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.redirect("/api");
  }
};

module.exports.Login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error_msg", "Tên đăng nhập hoặc mật khẩu không đúng");
      return res.redirect("/api");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Gán thông tin người dùng vào session
      req.session.user = user;
      req.flash("success_msg", "Đăng nhập thành công");
      return res.redirect("/main");
    });
  })(req, res, next);
};

module.exports.LoginWriter = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error_msg", "Tên đăng nhập hoặc mật khẩu không đúng");
      return res.redirect("/api");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Gán thông tin người dùng vào session
      req.session.user = user;
      req.flash("success_msg", "Đăng nhập thành công");
      return res.redirect("/writer");
    });
  })(req, res, next);
};

module.exports.LoginEditor = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error_msg", "Tên đăng nhập hoặc mật khẩu không đúng");
      return res.redirect("/api");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Gán thông tin người dùng vào session
      req.session.user = user;
      req.flash("success_msg", "Đăng nhập thành công");
      return res.redirect("/editor");
    });
  })(req, res, next);
};

module.exports.LoginAdmin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error_msg", "Tên đăng nhập hoặc mật khẩu không đúng");
      return res.redirect("/api");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Gán thông tin người dùng vào session
      req.session.user = user;
      req.flash("success_msg", "Đăng nhập thành công");
      return res.redirect("/admin");
    });
  })(req, res, next);
};

module.exports.showForgotForm = (req, res) => {
  res.render("account/sendOtp");
};

// Gửi mã OTP qua email
module.exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
    User.findByEmail(email, async (err, user) => {
      if (!user) {
        req.flash("error_msg", "Không tìm thấy email nào");
        return res.render("account/sendOtp", {
          error: "Không tìm thấy email nào",
        });
      }

      // Tạo OTP ngẫu nhiên và lưu trữ
      const otp = generateOtp();
      otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

      try {
        // Gửi OTP qua email
        const info = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Your OTP to reset password",
          text: `Your OTP is: ${otp}`,
        });

        console.log("Email sent: " + info.response);
        res.render("account/checkOtp", {
          message: "OTP đã được gửi đến email của bạn",
        });
      } catch (emailError) {
        console.log(emailError);
        res
          .status(500)
          .render("account/sendOtp", { error: "Có lỗi xảy ra khi gửi OTP." });
      }
    });
  } catch (err) {
    console.log(err);
    res.render("account/sendOtp", { error: "Có lỗi xảy ra khi gửi OTP." });
  }
};

module.exports.showResetForm = (req, res) => {
  const token = req.query.token;
  res.render("account/resetPass", { token });
};

// kiểm tra mã OTP
module.exports.checkOtp = (req, res) => {
  const { email, otp } = req.body;
  const storedOtpData = otpStorage[email];

  console.log("Stored OTP Data:", storedOtpData);
  console.log("Received OTP:", otp);
  console.log("Send info to check:", storedOtpData.otp);
  console.log("Time:", storedOtpData.expiresAt);
  console.log("Current Time:", Date.now());

  // Kiểm tra xem OTP có hợp lệ và chưa hết hạn ko
  if (!storedOtpData || storedOtpData.otp != otp) {
    return res.render("account/checkOtp", {
      error: "OTP không hợp lệ hoặc đã hết hạn.",
    });
  }

  // Nếu OTP hợp lệ, chuyển đến trang reset mật khẩu với token(random)
  res.redirect(
    `/api/reset-password?token=${crypto
      .randomBytes(20)
      .toString("hex")}&email=${encodeURIComponent(email)}`
  );
};

// Đặt lại mật khẩu mới
module.exports.resetPass = async (req, res) => {
  const { token, newPassword, email } = req.body;

  // Kiểm tra token và email có hợp lệ không
  console.log("Email:", email);
  console.log("Token:", token);
  if (!email || !token) {
    return res.render("account/resetPass", { error: "Yêu cầu không hợp lệ." });
  }

  try {
    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới trong cơ sở dữ liệu
    User.resetPassword(email, hashedPassword, (err) => {
      if (err) {
        console.log(err);
        return res.render("account/resetPass", {
          error: "Có lỗi xảy ra khi đặt lại mật khẩu.",
        });
      }

      // Xóa OTP khỏi bộ nhớ
      delete otpStorage[email];

      // Chuyển hướng đến trang đăng nhập sau khi cập nhật thành công
      req.flash("success_msg", "Mật khẩu của bạn đã được đặt lại thành công.");
      res.redirect("/api");
    });
  } catch (error) {
    console.error(error);
    res.render("account/resetPass", {
      error: "Có lỗi xảy ra khi đặt lại mật khẩu.",
    });
  }
};

module.exports.Logout = (req, res) => {
  // Hủy bỏ session
  req.session.destroy((err) => {
    if (err) {
        console.log(err);
        return res.send('Không thể đăng xuất');
    }
    res.redirect('/home'); // Quay lại trang đăng nhập
});
};
