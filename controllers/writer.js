const categoryModel = require("../models/category.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const writerModel = require("../models/writer.js");
const { console } = require("inspector");

module.exports = {
  showMainPage: (req, res) => {
    res.render("vwWriter/main", {
      layout: "main",
      title: "Trang chủ của tác giả",
      user: req.session.user.userId,
    });
  },

  showPostArticlePage: (req, res) => {
    writerModel.getAllCategories((err, categories) => {
      if (err) {
        return res.status(500).send("Lỗi khi lấy danh mục");
      }
      let filteredCategories = [];
      // Group categories by parent_id
      for (let i = 0; i < categories.length; i++) {
        if (categories[i].parent_id !== null) {
          filteredCategories.push(categories[i]);
        }
      }
      res.render("vwWriter/PostArticle", {
        layout: "main",
        title: "Đăng bài viết",
        user: req.session.user.userId,
        categories: filteredCategories,
      });
    });
  },

  showMyArticlePage: (req, res) => {
    const userId = req.session.user.userId;

    writerModel.getArticlesByUserId(userId, (err, articles) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi lấy bài viết.");
      }
      const groupedArticles = [];
      articles.forEach((article) => {
        const { statusName, ...data } = article;
        const group = groupedArticles.find(
          (group) => group.statusName === statusName
        );
        if (group) {
          group.articles.push(data);
        } else {
          groupedArticles.push({
            statusName: statusName,
            articles: [data],
          });
        }
      });
      console.log(groupedArticles);
      res.render("vwWriter/MyArticle", {
        layout: "main",
        title: "Bài viết của tôi",
        user: req.session.user.userId,
        articles: groupedArticles,
      });
    });
  },

  showFixArticlePage: (req, res) => {
    const id = req.query.id;
    writerModel.getArticleById(id, (err, article) => {
      if (err) {
        return;
      }
      categoryModel.getAllCategories((err, categories) => {
        if (err) {
          console.error("Lỗi khi lấy danh mục:", err);
          return res.status(500).send("Lỗi khi lấy danh mục");
        }

        let filteredCategories = [];
        // Group categories by parent_id
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].parent_id !== null) {
            filteredCategories.push(categories[i]);
          }
        }
        res.render("vwWriter/FixArticle", {
          layout: "main",
          title: "Sửa bài viết",
          categories: filteredCategories,
          user: req.session.user.userId,
          article: article[0],
          tags: article[0].tags.split(","),
        });
      });
    });
  },

  showRefuse: (req, res) => {
    const id = req.query.id;
    writerModel.getArticlesById(id, (err, article) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi truy vấn cơ sở dữ liệu" });
      }

      if (!article) {
        return res.status(404).json({ error: "Không tìm thấy bài viết" });
      }

      const refuse = article.refuse || "Không có lý do từ chối";
      res.json({ refuse });
    });
  },

  showCategoryPage: (req, res) => {
    res.render("Category", {
      layout: "main",
    });
  },

  submitArticle: (req, res) => {
    writerModel.getPostCount((err, count) => {
      if (err) {
        console.error("Lỗi khi đếm bài viết:", err);
        return res.status(500).send("Lỗi khi đếm bài viết");
      }
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          const folderPath = `./public/posts/imgs/${count + 1}`;
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }
          cb(null, folderPath);
        },
        filename: function (req, file, cb) {
          cb(null, "thumbnail" + path.extname(file.originalname));
        },
      });
      const upload = multer({ storage }).single("thumbnail");

      upload(req, res, (err) => {
        if (err) {
          console.error("Lỗi khi upload ảnh:", err);
          return res.status(500).send("Lỗi khi upload ảnh");
        }

        const { title, abstract, content, category, tags } = req.body;
        const is_premium = req.body.is_premium === "on" ? 1 : 0;

        writerModel.insertArticle(
          {
            nextPostId: count + 1,
            title: title,
            category: category[0],
            abstract: abstract,
            content: content,
            userId: req.session.user.userId,
            is_premium: is_premium,
            tags: tags,
          },
          (insertErr, result) => {
            if (insertErr) {
              console.error("Lỗi khi thêm bài viết:", insertErr);
              return res.status(500).send("Lỗi khi thêm bài viết");
            }

            res.redirect(`/writer/my-articles`);
          }
        );
      });
    });
  },

  submitFixArticle: (req, res) => {
    const postId = req.query.id;
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const folderPath = `./public/posts/imgs/${postId}`;
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        cb(null, folderPath);
      },
      filename: function (req, file, cb) {
        cb(null, "thumbnail" + path.extname(file.originalname));
      },
    });

    const upload = multer({ storage }).single("thumbnail");

    upload(req, res, (err) => {
      if (err) {
        console.error("Lỗi khi upload ảnh:", err);
        return res.status(500).send("Lỗi khi upload ảnh");
      }

      const { title, abstract, content, category, tags } = req.body;
      const is_premium = req.body.is_premium === "on" ? 1 : 0;

      writerModel.updateArticle(
        {
          title: title,
          abstract: abstract,
          content: content,
          category: category[0],
          is_premium: is_premium,
          tags: tags,
          postId: postId,
        },
        (insertErr, result) => {
          res.redirect(`/writer/my-articles`);
        }
      );
    });
  },
};
