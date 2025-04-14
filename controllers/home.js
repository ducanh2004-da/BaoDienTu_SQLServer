// controllers/main.js
const postModel = require("../models/post.js");
const categoryModel = require("../models/category.js");
const homeModel = require("../models/home.js");
const commentModel = require("../models/comment.js");
const validator = require("validator");

let categories = [];
let filteredCategories = [];

function validateInput(input) {
  if (!validator.isAlphanumeric(input)) {
    throw new Error("Dữ liệu không hợp lệ!");
  }
  return input;
}

// Khởi tạo danh mục cha-con
const initializeCategories = async () => {
  return new Promise((resolve, reject) => {
    categoryModel.getAllCategories((err, data) => {
      if (err) {
        console.error("Error initializing categories:", err);
        return reject(err);
      }
      categories = Array.isArray(data) ? data : [];
      resolve(categories);
    });
  });
};

const updateFilteredCategories = async () => {
  await initializeCategories();
  filteredCategories = categories
    .filter(cat => cat.parent_id === null || cat.parentId === null)
    .map(parent => ({
      ...parent,
      children: categories.filter(child => child.parent_id === parent.id || child.parentId === parent.id)
    }));
};

// Chạy khi khởi động
updateFilteredCategories().catch(err => console.error(err));

module.exports = {
  // Trang chủ
  showHomePage: (req, res) => {
    const notification = req.session.notification || null;

    homeModel.getHighlightedPostsNoPremium((err, highlightedPosts) => {
      if (err) return res.status(500).send("Không thể lấy bài viết nổi bật");

      homeModel.getTopCategoriesWithNewestPosts((err, posts) => {
        if (err) return res.status(500).send("Không thể lấy danh mục hàng đầu");

        const topCategories = posts.reduce((acc, p) => {
          const { category_name, ...rest } = p;
          if (!acc[category_name]) acc[category_name] = [];
          acc[category_name].push(rest);
          return acc;
        }, {});

        homeModel.getTop10NewestPosts((err, latestPosts) => {
          if (err) return res.status(500).send("Không thể lấy bài viết mới nhất");

          homeModel.getTop10MostViewedPosts((err, mostViewPosts) => {
            if (err) return res.status(500).send("Không thể lấy bài viết được xem nhiều nhất");

            res.render("vwUser/home", {
              layout: "main",
              title: "Trang chủ",
              notification,
              categories: filteredCategories,
              highlightedPosts,
              topCategories,
              latestPosts,
              mostViewPosts
            });
          });
        });
      });
    });
  },

  // Trang danh mục
  showCategory: (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).send("ID danh mục không hợp lệ");

    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1) page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    categoryModel.getCatById(id, (err, category) => {
      if (err) return res.status(500).send("Không thể lấy danh mục");

      postModel.getPostsByCategoryNoPremium(id, limit, offset, (err, posts) => {
        if (err) return res.status(500).send("Không thể lấy bài viết của danh mục này");

        homeModel.getTop5MostLikedPostsByCategory(id, (err, hotPosts) => {
          if (err) return res.status(500).send("Không thể lấy bài viết được yêu thích");

          postModel.getPostsByCategoryCountNoPremium(id, (err, countResult) => {
            if (err) return res.status(500).send("Không thể đếm bài viết");

            const total = countResult[0]?.total || 0;
            const totalPages = Math.ceil(total / limit);
            if (page > totalPages && totalPages > 0) return res.status(404).send("Không tìm thấy trang");

            const pages = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 }));
            res.render("vwPost/byCat", {
              layout: "main",
              title: category.name,
              categories: filteredCategories,
              posts,
              hotPosts,
              currentPage: page,
              totalPages,
              pages,
              id,
              message: total > 0 ? `Tìm thấy ${total} bài viết` : "Không có bài viết"
            });
          });
        });
      });
    });
  },

  // Chi tiết bài viết
  showDetail: (req, res) => {
    const id = parseInt(req.params.id, 10);

    postModel.updateView(id, err => {
      if (err) console.error("Lỗi tăng view:", err);
    });

    postModel.isPremium(id, (err, isPremium) => {
      if (err) return res.status(500).send("Không thể kiểm tra premium");
      if (isPremium) {
        req.session.notification = { type: "danger", message: "Không đủ quyền truy cập" };
        return res.redirect("/home");
      }

      postModel.getPostById(id, (err, post) => {
        if (err) return res.status(500).send("Không thể lấy bài viết");
        if (post.statusName !== "Published") return res.status(404).send("Chưa xuất bản");

        const tags = post.tags?.split(",").map(t => t.trim()) || [];

        postModel.getPostAuthorInfo(id, (err, author) => {
          if (err) return res.status(500).send("Không thể lấy tác giả");

          categoryModel.getPostCategories(id, (err, postCats) => {
            if (err) return res.status(500).send("Không thể lấy chuyên mục");

            commentModel.getCommentsByPostId(id, (err, comments) => {
              if (err) return res.status(500).send("Không thể lấy bình luận");

              postModel.get5PostsByCatNoPremium(id, (err, related) => {
                if (err) console.error(err);
                res.render("vwPost/post-detail", {
                  layout: "main",
                  title: post.title,
                  post,
                  categories: filteredCategories,
                  postCategories: postCats,
                  author,
                  comments,
                  tags,
                  relatedPosts: related || []
                });
              });
            });
          });
        });
      });
    });
  },

  // Tìm kiếm
  search: (req, res) => {
    const q = validateInput(req.query.q || "");
    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1) page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    homeModel.searchContentNoPremium(q, limit, offset, (err, results) => {
      if (err) return res.status(500).send("Lỗi tìm kiếm");
      if (results.length === 0) {
        return res.render("vwPost/search", { layout: "main", title: `Kết quả: ${q}`, posts: [], categories: filteredCategories, message: "Không tìm thấy" });
      }

      homeModel.searchContentCountNoPremium(q, (err, countRes) => {
        if (err) return res.status(500).send("Lỗi đếm kết quả");
        const total = countRes[0].total;
        const totalPages = Math.ceil(total / limit);
        const pages = [];
        for (let i = 1; i <= totalPages; i++) pages.push({ value: i });

        res.render("vwPost/search", {
          layout: "main",
          title: `Kết quả: ${q}`,
          posts: results,
          categories: filteredCategories,
          currentPage: page,
          totalPages,
          pages,
          query: q,
          message: `Tìm thấy ${total} kết quả`
        });
      });
    });
  },

  // Tag
  showTag: (req, res) => {
    const tag = req.params.name;
    let page = parseInt(req.query.page, 10) || 1;
    const limit = 2;
    const offset = (page - 1) * limit;

    homeModel.getPostsByTagNoPremium(tag, limit, offset, (err, { posts, total } = {}) => {
      if (err) return res.status(500).send("Lỗi tag");
      const totalPages = Math.ceil((total || 0) / limit);
      const pages = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 }));

      res.render("vwPost/byTag", {
        layout: "main",
        title: tag,
        posts,
        currentPage: page,
        totalPages,
        pages,
        query: tag
      });
    });
  }
};
