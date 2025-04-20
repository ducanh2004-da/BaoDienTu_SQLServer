const express = require("express");
const { engine } = require("express-handlebars");
const hbs_sections = require("express-handlebars-sections");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const numeral = require("numeral");
const path = require("path");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("./middlewares/auth.js");
const { updateScheduledPosts } = require("./middlewares/publishPost.js");
const { connectDB } = require("./utils/db.js");

// Routes
const mainRoutes = require("./routes/main");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const editorRoutes = require("./routes/editor.js");
const homeRoutes = require("./routes/home.js");
const writerRoutes = require("./routes/writer.js");

require("./config/passport"); // Passport configuration should be required here

dotenv.config(); // Load environment variables from .env file
const PORT = process.env.PORT || 5000;

// //check time and publish post
// updateScheduledPosts();

// // Middleware setup
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(express.json()); // To parse JSON bodies
const morgan = require("morgan");

//ngăn chặn request từ các trang web khác
app.use(
  cors({
    origin: "http://localhost:8000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
// tránh xài helmet vì có thể gây lỗi form đăng nhập (nếu bị lỗi thì đổi Port khác trong file .env)
// app.use(helmet());
//thiết lập HTTP Strict Transport Security (HSTS) để bảo vệ truy cập trang web qua HTTPS
app.use(
  helmet.hsts({
    maxAge: 31536000, //1 năm
    includeSubDomains: false, // Chưa áp dụng cho subdomain nếu chưa sẵn sàng
    preload: false, // Không đăng ký preload nếu chưa hoàn toàn chuyển đổi HTTPS hoặc có subdomain chưa hỗ trợ HTTPS
  })
);
//Thiết lập giới hạn request
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500, // Giới hạn mỗi IP chỉ được 300 requests trong 15 phút
  message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
  headers: true, // Trả về headers cho biết còn bao nhiêu request có thể gửi
});
// const loginLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 phút
//   max: 10, // Chỉ cho phép 5 lần thử đăng nhập mỗi 10 phút(ko hiểu sao bị mất 1 lần :"(( )
//   message: "Bạn đã nhập sai quá nhiều lần. Hãy thử lại sau 10 phút.",
// });
// Áp dụng rate limiting cho tất cả các routes để tránh tấn công DDoS
app.use(limiter);

// Anti-clickjacking Header
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Set up Handlebars view engine
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    layoutsDir: path.join(__dirname, "/views/layouts"),
    helpers: {
      format_number(value) {
        return numeral(value).format("0,0") + "d"; // Format number with commas and suffix 'd'
      },
      eq(a, b) {
        return a === b;
      },
      ifEquals(a, b, options) {
        if (a === b) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      length(array) {
        return array.length;
      },
      ifCond(v1, operator, v2) {
        switch (operator) {
          case "==":
            return parseInt(v1) === parseInt(v2);
          case "===":
            return v1 === v2;
          case "!=":
            return parseInt(v1) !== parseInt(v2);
          case "!==":
            return v1 !== v2;
          case "<":
            return parseInt(v1) < parseInt(v2);
          case "<=":
            console.log(parseInt(v1), parseInt(v2));
            console.log(parseInt(v1) <= parseInt(v2));
            return parseInt(v1) <= parseInt(v2);
          case ">":
            return parseInt(v1) > parseInt(v2);
          case ">=":
            return parseInt(v1) >= parseInt(v2);
          case "&&":
            return v1 && v2;
          case "||":
            return v1 || v2;
          default:
            return false;
        }
      },
      // Helper 'or' để kiểm tra phép toán 'hoặc'
      or(v1, v2) {
        return v1 || v2; // Trả về kết quả boolean thay vì options.fn()
      },
      math(v1, operator, v2) {
        switch (operator) {
          case "+":
            return parseInt(v1) + parseInt(v2);
          case "-":
            return parseInt(v1) - parseInt(v2);
          case "*":
            return parseInt(v1) * parseInt(v2);
          case "/":
            return parseInt(v1) / parseInt(v2);
          case "%":
            return parseInt(v1) % parseInt(v2);
          default:
            return NaN;
        }
      },
      includes(list, value, ...keys) {
        // Filter out Handlebars metadata
        keys = keys.filter((key) => typeof key === "string");

        if (!Array.isArray(list) || typeof value !== "object") {
          return false;
        }

        return keys.length === 0
          ? list.some((item) =>
              Object.keys(value).every((key) => item[key] === value[key])
            )
          : list.some((item) => keys.every((key) => item[key] === value[key]));
      },
      section: hbs_sections(),
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views")); // Use path.join for cross-platform compatibility
app.use("/public", express.static("public"));
// // Static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));
// Use cookie-parser middleware
app.use(cookieParser());
// // Session setup (Express session with flash messages)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret", // Use environment variable for session secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60, // 1 giờ
    }, // Đặt secure thành true nếu sử dụng HTTPS
  })
);

// // Passport initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
// // Flash messages middleware
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Redirect based on user role
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/home");
  } else if (req.session.user.role === "admin") {
    return res.redirect("/admin");
  } else if (req.session.user.role === "editor") {
    return res.redirect("/editor");
  } else if (req.session.user.role === "writer") {
    return res.redirect("/writer");
  } else {
    return res.redirect("/main");
  }
});
``;
// Define routes
app.use("/writer", writerRoutes);
app.use("/editor", editorRoutes);
app.use("/main", authMiddleware.isSubscriber, mainRoutes);
app.use("/home", homeRoutes);
app.use("/api", authRoutes);
app.use("/admin", authMiddleware.isAdmin, adminRoutes);

app.use((err, req, res, next) => {
  console.error("Lỗi xảy ra:", err); // Ghi nhật ký lỗi đầy đủ để dễ gỡ lỗi
  res
    .status(404)
    .render("404", { error: "Có lỗi xảy ra, vui lòng thử lại sau." });
});

// Start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Không thể kết nối database. Dừng server.", err);
  });
