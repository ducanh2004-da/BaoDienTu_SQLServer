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

const initializeCategories = async () => {
  return new Promise((resolve, reject) => {
    categoryModel.getAllCategories((err, data) => {
      if (err) {
        console.error("Error initializing categories:", err);
        reject(err);
      } else {
        categories = Array.isArray(data) ? data : [];
        resolve(categories);
      }
    });
  });
};

const updateFilteredCategories = async () => {
  await initializeCategories();
  filteredCategories = categories
    .filter((category) => category.parent_id === null)
    .map((parent) => ({
      ...parent,
      children: categories.filter((child) => child.parent_id === parent.id),
    }));
};

updateFilteredCategories().catch((error) => {
  console.error("Error updating filtered categories:", error);
});

module.exports = {
  // Hiển thị trang chủ
  showHomePage: (req, res) => {
    const notification = req.session.notification || null;

    homeModel.getHighlightedPostsNoPremium((err, highlightedPosts) => {
      if (err) return res.status(500).send("Không thể lấy bài viết nổi bật");

      homeModel.getTopCategoriesWithNewestPostsNoPremium((err, posts) => {
        if (err) return res.status(500).send("Không thể lấy danh mục hàng đầu");

        const topCategories = posts.reduce((grouped, post) => {
          const { category_name, ...data } = post;
          if (!grouped[category_name]) grouped[category_name] = [];
          grouped[category_name].push(data);
          return grouped;
        }, {});

        homeModel.getTop10NewestPostsNoPremium((err, latestPosts) => {
          if (err) return res.status(500).send("Không thể lấy bài viết mới nhất");

          homeModel.getTop10MostViewedPostsNoPremium((err, mostViewPosts) => {
            if (err) return res.status(500).send("Không thể lấy bài viết được xem nhiều nhất");

            res.render("vwUser/home", {
              layout: "main",
              title: "Trang chủ",
              notification,
              categories: filteredCategories,
              highlightedPosts,
              topCategories,
              latestPosts,
              mostViewPosts,
            });
          });
        });
      });
    });
  },

  // Hiển thị trang danh mục
  showCategory: (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).send("ID danh mục không hợp lệ");
    }

    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1) page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    categoryModel.getCatById(id, (err, category) => {
      if (err) return res.status(500).send("Không thể lấy danh mục");
      if (!category) return res.status(404).send("Danh mục không tồn tại");

      postModel.getPostsByCategoryNoPremium(id, limit, offset, (err, posts) => {
        if (err) return res.status(500).send("Không thể lấy bài viết của danh mục này");

        homeModel.getTop5MostLikedPostsByCategoryNoPremium(id, (err, hotPosts) => {
          if (err) return res.status(500).send("Không thể lấy bài viết được yêu thích nhất");

          postModel.getPostsByCategoryCountNoPremium(id, (err, totalCount) => {
            if (err) return res.status(500).send("Không thể lấy tổng số bài viết");

            const nRows = totalCount || 0;
            const totalPages = Math.ceil(nRows / limit);
            if (page > totalPages && totalPages > 0) {
              return res.status(404).send("Không tìm thấy trang");
            }

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
              message: nRows > 0 ? `Tìm thấy ${nRows} bài viết` : "Không có bài viết nào trong danh mục này",
            });
          });
        });
      });
    });
  },

  // Hiển thị chi tiết bài viết
  showDetail: (req, res) => {
    const id = parseInt(req.params.id, 10);

    postModel.updateView(id, (err) => {
      if (err) console.error("Lỗi khi tăng lượt xem:", err);
    });

    postModel.isPremium(id, (err, isPremium) => {
      if (err) {
        console.error("Lỗi khi kiểm tra premium:", err);
        return res.status(500).send("Không thể kiểm tra quyền truy cập");
      }
      if (isPremium) {
        req.session.notification = {
          type: "danger",
          message: "Bạn không có đủ quyền truy cập bài viết này",
        };
        return res.redirect("/home");
      }

      postModel.getPostById(id, (err, post) => {
        if (err) {
          console.error("Lỗi khi lấy chi tiết bài viết:", err);
          return res.status(500).send("Không thể lấy chi tiết bài viết");
        }
        if (!post || post.statusName !== "Published") {
          return res.status(404).send("Bài viết không tồn tại hoặc chưa được xuất bản");
        }

        const tags = post.tags ? post.tags.split(",").map(t => t.trim()) : [];

        postModel.getPostAuthorInfo(id, (err, author) => {
          if (err) {
            console.error("Lỗi khi lấy thông tin tác giả:", err);
            return res.status(500).send("Không thể lấy thông tin tác giả");
          }

          categoryModel.getPostCategories(id, (err, cats) => {
            if (err) {
              console.error("Lỗi khi lấy danh mục bài viết:", err);
              return res.status(500).send("Không thể lấy thông tin danh mục");
            }

            commentModel.getCommentsByPostId(id, (err, comments) => {
              if (err) {
                console.error("Lỗi khi lấy bình luận:", err);
                return res.status(500).send("Không thể lấy bình luận");
              }

              postModel.get5PostsByCatNoPremium(id, (err, relatedPosts) => {
                if (err) {
                  console.error("Lỗi khi lấy bài viết liên quan:", err);
                  return res.status(500).send("Không thể lấy bài viết liên quan");
                }

                res.render("vwPost/post-detail", {
                  layout: "main",
                  title: post.title,
                  post,
                  categories: filteredCategories,
                  postCategories: cats,
                  author,
                  comments,
                  tags,
                  relatedPosts,
                });
              });
            });
          });
        });
      });
    });
  },

  // Tìm kiếm bài viết
  search: (req, res) => {
    const query = validateInput(req.query.q || "");
    if (!req.query.page) {
      return res.redirect(`./search?q=${query}&page=1`);
    }

    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1) page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    homeModel.searchContentNoPremium(query, limit, offset, (err, result) => {
      if (err) {
        console.error("Lỗi khi tìm kiếm bài viết:", err);
        return res.status(500).send("Không thể tìm kiếm bài viết");
      }

      const posts = result.posts;
      const total = result.total;
      if (posts.length === 0) {
        return res.render("vwPost/search", {
          layout: "main",
          title: `Kết quả tìm kiếm cho ${query}`,
          posts,
          categories: filteredCategories,
          user: req.session.user,
          message: "Không tìm thấy kết quả phù hợp",
        });
      }

      const totalPages = Math.ceil(total / limit);
      if (page > totalPages) {
        return res.status(404).send("Không tìm thấy trang");
      }

      const pages = [];
      const dotsIndex = page + 3;
      for (let i = 1; i <= totalPages; i++) {
        if (i === dotsIndex) {
          pages.push({ value: "..." });
          break;
        }
        pages.push({ value: i });
      }
      for (let i = Math.max(dotsIndex + 1, totalPages - 2); i <= totalPages; i++) {
        pages.push({ value: i });
      }

      res.render("vwPost/search", {
        layout: "main",
        title: `Kết quả tìm kiếm cho ${query}`,
        posts,
        categories: filteredCategories,
        currentPage: page,
        totalPages,
        pages,
        query,
        message: `Tìm thấy ${total} kết quả phù hợp`,
      });
    });
  },

  // Hiển thị theo tag
  showTag: (req, res) => {
    const tag = req.params.name;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 2;
    const offset = (page - 1) * limit;

    homeModel.getPostsByTagNoPremium(tag, limit, offset, (err, result) => {
      if (err) {
        console.error("Lỗi khi lấy theo tag:", err);
        return res.status(500).send("Không thể ra kết quả");
      }

      const { posts, total } = result;
      const totalPages = Math.ceil(total / limit);

      res.render("vwPost/byTag", {
        layout: "main",
        title: tag,
        posts,
        currentPage: page,
        totalPages,
        pages: Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 })),
        query: tag,
      });
    });
  },
};
