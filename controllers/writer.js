const categoryModel = require("../models/category.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const writerModel = require("../models/writer.js");
const { console } = require("inspector");
const editor = require("./editor.js");

module.exports = {
  showMainPage: (req, res) => {
    res.render("vwWriter/main", {
      layout: "main",
      title: "Trang chủ của tác giả",
      user: 2,
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
        user: 2,
        categories: filteredCategories,
      });
    });
  },

  showMyArticlePage: (req, res) => {
    const userId = 2;

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
        user: 2,
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
          user: 2,
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

        const { title, abstract, content, tags } = req.body;
        const category = {
          categoryId: 1,
          categoryName: "AI",
          parent_id: 1,
          editorId: 4,
        };
        const is_premium = req.body.is_premium === "on" ? 1 : 0;
        let rawTags = tags;
        // Nếu rawTags là chuỗi, tách theo dấu phẩy
        if (typeof rawTags === 'string') {
            rawTags = rawTags.split(',');  // Example: "a,b,c" → ["a","b","c"]
        }
        // Nếu không phải mảng, khởi tạo mảng rỗng
        if (!Array.isArray(rawTags)) {
           rawTags = [];
        }
        const joined = rawTags.join(",");

        const tagsArray = joined.split(",");
        const cleanTags = [
          ...new Set(
            tagsArray.map((tag) => tag.trim()).filter((tag) => tag !== "")
          ),
        ];
        const finalTagsString = cleanTags.join(", ");
        writerModel.insertArticle(
          {
            nextPostId: count + 1,
            title: title,
            category: category.categoryId,
            abstract: abstract,
            content: content,
            userId: 2,
            is_premium: is_premium,
            tags: finalTagsString,
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

      const { title, abstract, content, tags } = req.body;
      const category = {
        categoryId: 1,
        categoryName: "AI",
        parent_id: 1,
        editorId: 4,
      };
      const is_premium = req.body.is_premium === "on" ? 1 : 0;
      const rawTags = tags;
      const joined = rawTags.join(",");

      const tagsArray = joined.split(",");
      const cleanTags = [
        ...new Set(
          tagsArray.map((tag) => tag.trim()).filter((tag) => tag !== "")
        ),
      ];
      const finalTagsString = cleanTags.join(", ");
      writerModel.updateArticle(
        {
          title: title,
          abstract: abstract,
          content: content,
          category: category.categoryId,
          is_premium: is_premium,
          tags: finalTagsString,
          postId: postId,
        },
        (insertErr, result) => {
          res.redirect(`/writer/my-articles`);
        }
      );
    });
  },
};
