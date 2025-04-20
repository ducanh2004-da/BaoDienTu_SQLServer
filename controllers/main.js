const postModel = require("../models/post.js");
const categoryModel = require("../models/category.js");
const homeModel = require("../models/home.js");
const subscriptionModel = require("../models/subscription.js");
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
  await initializeCategories(); // Ensure categories is populated
  filteredCategories = categories
    .filter((category) => category.parent_id === null)
    .map((parent) => ({
      ...parent,
      children: categories.filter((child) => child.parent_id === parent.id),
    }));
};

updateFilteredCategories().then(() => {}).catch((error) => {
  console.error("Error updating filtered categories:", error);
});

module.exports = {
  showMainPage: (req, res) => {
    let { notification } = req.session;
    const { isSubscriber, isUser } = req.session;
    req.session.notification = null;
    if (isSubscriber) {
      homeModel.getHighlightedPosts((err, highlightedPosts) => {
        if (err) {
          return res.status(500).send("Không thể lấy bài viết nổi bật");
        }
        homeModel.getTopCategoriesWithNewestPosts((err, posts) => {
          if (err) {
            return res.status(500).send("Không thể lấy danh mục hàng đầu");
          }
          const topCategories = posts.reduce((grouped, post) => {
            const { category_name, ...data } = post;
            if (!grouped[category_name]) {
              grouped[category_name] = [];
            }
            grouped[category_name].push(data);
            return grouped;
          }, {});
          homeModel.getTop10NewestPosts((err, latestPosts) => {
            if (err) {
              return res.status(500).send("Không thể lấy bài viết mới nhất");
            }
            homeModel.getTop10MostViewedPosts((err, mostViewPosts) => {
              if (err) {
                return res.status(500).send("Không thể lấy bài viết được xem nhiều nhất");
              }
              res.render("vwUser/home", {
                layout: "main",
                title: "Trang chủ",
                notification: notification,
                categories: filteredCategories,
                highlightedPosts,
                topCategories,
                latestPosts,
                mostViewPosts,
                user: req.session.user,
              });
            });
          });
        });
      });
    } else if (isUser) {
      homeModel.getHighlightedPostsNoPremium((err, highlightedPosts) => {
        if (err) {
          return res.status(500).send("Không thể lấy bài viết nổi bật");
        }
        homeModel.getTopCategoriesWithNewestPostsNoPremium((err, posts) => {
          if (err) {
            return res.status(500).send("Không thể lấy danh mục hàng đầu");
          }
          const topCategories = posts.reduce((grouped, post) => {
            const { category_name, ...data } = post;
            if (!grouped[category_name]) {
              grouped[category_name] = [];
            }
            grouped[category_name].push(data);
            return grouped;
          }, {});
          homeModel.getTop10NewestPostsNoPremium((err, latestPosts) => {
            if (err) {
              return res.status(500).send("Không thể lấy bài viết mới nhất");
            }
            homeModel.getTop10MostViewedPostsNoPremium((err, mostViewPosts) => {
              if (err) {
                return res.status(500).send("Không thể lấy bài viết được xem nhiều nhất");
              }
              notification = {
                type: "info",
                content: "Hãy trở thành subscriber để được đọc những bài viết premium",
              };
              res.render("vwUser/home", {
                layout: "main",
                title: "Trang chủ",
                notification: notification,
                categories: filteredCategories,
                highlightedPosts,
                topCategories,
                latestPosts,
                mostViewPosts,
                user: req.session.user,
              });
            });
          });
        });
      });
    }
  },

  showDetail: (req, res) => {
    const { id } = req.params;
    postModel.isPremium(id, (err, isPremium) => {
      if (err) {
        return res.status(500).send("Không thể lấy bài viết");
      }
      if (isPremium && req.session.isSubscriber) {
        // Cập nhật lượt xem, nhưng chỉ ghi log lỗi nếu có
        postModel.updateView(id, (err) => {
          if (err) {
            console.error("Lỗi khi cập nhật lượt xem:", err);
            // Không dùng return, để tiếp tục xử lý
          }
        });
        postModel.getPostById(id, (err, post) => {
          if (err) {
            console.error("Lỗi khi lấy bài viết:", err);
            return res.status(500).send("Không thể lấy chi tiết bài viết");
          }
          if (post.statusName !== "Published") {
            return res.status(404).send("Bài viết không tồn tại hoặc chưa được xuất bản");
          }
          const tags = post.tags?.split(",").map((tag) => tag.trim());
          postModel.getPostAuthorInfo(post.postId, (err, author) => {
            if (err) {
              console.error("Lỗi khi lấy thông tin tác giả:", err);
              return res.status(500).send("Không thể lấy thông tin tác giả");
            }
            categoryModel.getPostCategories(post.postId, (err, cats) => {
              if (err) {
                console.error("Lỗi khi lấy thông tin:", err);
                return res.status(500).send("Không thể lấy thông tin");
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
                      post: post,
                      categories: filteredCategories,
                      postCategories: cats,
                      author: author,
                      user: req.session.user,
                      comments: comments,
                      tags: tags,
                      relatedPosts,
                    });
                  });
              });
            });
          });
        });
      } else {
        req.session.notification = {
          type: "warning",
          content: "Bài viết này chỉ dành cho người đăng ký",
        };
        res.redirect("/main");
      }
    });
  },
  

  showCategory: (req, res) => {
    const query = req.query.q || ""; // Lấy giá trị q từ query string hoặc để trống
    const id = parseInt(req.params.id || 0);
    if (isNaN(id) || id <= 0) {
      return res.status(400).send("ID danh mục không hợp lệ");
    }
    const { isSubscriber, isUser } = req.session;
    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1;

    const limit = 5;
    const startIndex = (page - 1) * limit;
    categoryModel.getCatById(id, (err, category) => {
      if (err) {
        return res.status(500).send("Không thể lấy danh mục");
      }
      if (isSubscriber) {
        postModel.getPostsByCategory(id, limit, startIndex, (err, posts) => {
          if (err) {
            return res.status(500).send("Không thể lấy bài viết của danh mục này");
          }
          homeModel.getTop5MostLikedPostsByCategory(id, (err, hotPosts) => {
            if (err) {
              return res.status(500).send("Không thể lấy bài viết được yêu thích nhất của danh mục này");
            }
            postModel.getPostsByCategoryCount(id, (err, countResult) => {
              if (err) {
                return res.status(500).send("Không thể lấy danh mục");
              }
              // Giả sử countResult trả về dạng [{ total: number }]
              const nRows = countResult[0]?.total || 0;
              const totalPages = Math.ceil(nRows / limit);

              if (page > totalPages && totalPages > 0) {
                return res.status(404).send("Không tìm thấy trang");
              }
              const pages = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 }));
              res.render("vwPost/byCat", {
                layout: "main",
                user: req.session.user,
                title: category[0].name,
                categories: filteredCategories, // Danh mục dạng cây
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
      } else if (isUser) {
        postModel.getPostsByCategoryNoPremium(id, limit, startIndex, (err, posts) => {
          if (err) {
            return res.status(500).send("Không thể lấy bài viết của danh mục này");
          }
          homeModel.getTop5MostLikedPostsByCategoryNoPremium(id, (err, hotPosts) => {
            if (err) {
              return res.status(500).send("Không thể lấy bài viết được yêu thích nhất của danh mục này");
            }
            postModel.getPostsByCategoryCount(id, (err, countResult) => {
              if (err) {
                return res.status(500).send("Không thể lấy danh mục");
              }
              const nRows = countResult[0]?.total || 0;
              const totalPages = Math.ceil(nRows / limit);

              if (page > totalPages && totalPages > 0) {
                return res.status(404).send("Không tìm thấy trang");
              }
              const pages = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 }));
              res.render("vwPost/byCat", {
                layout: "main",
                user: req.session.user,
                title: category[0].name,
                categories: filteredCategories, // Danh mục dạng cây
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
      }
    });
  },

  likePost: (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.userId;
    if (req.session.isUser) {
      postModel.updateLike(id, userId, (err) => {
        if (err) {
          console.error("Lỗi khi cập nhật lượt thích:", err);
          return res.status(500).send("Không thể cập nhật lượt thích");
        }
        postModel.getLikes(id, (err, likes) => {
          if (err) {
            console.error("Lỗi khi lấy số lượt thích:", err);
            return res.status(500).send("Không thể lấy số lượt thích");
          }
          res.json({
            success: true,
            likes: likes,
          });
        });
      });
    } else {
      res.redirect("/login");
    }
  },

  search: (req, res) => {
    let query;
    try {
      query = validateInput(req.query.q) || "";
    } catch (error) {
      return res.status(400).send(error.message);
    }
    if (!req.query.page) {
      return res.redirect("./search?q=" + query + "&page=1");
    }
    let { page } = req.query;
    page = Math.max(page, 1);
    const limit = 10;
    const startIndex = (page - 1) * limit;
    if (req.session.isSubscriber) {
      homeModel.searchContent(query, limit, startIndex, (err, results) => {
        if (err) {
          console.error("Lỗi khi tìm kiếm bài viết:", err);
          return res.status(500).send("Không thể tìm kiếm bài viết");
        }
        if (results.posts.length === 0) {
          return res.render("vwPost/search", {
            layout: "main",
            posts: results.posts,
            user: req.session.user,
            message: "Không tìm thấy kết quả phù hợp",
          });
        }
        homeModel.searchContentCount(query, (err, totalCount) => {
          if (err) {
            console.error("Lỗi khi đếm số kết quả:", err);
            return res.status(500).send("Không thể đếm số kết quả");
          }
          const nRows = totalCount; // totalCount đã là số
          const totalPages = Math.ceil(nRows / limit);
          if (page > totalPages) {
            return res.status(404).send("Không tìm thấy trang");
          }
          let pages = [];
          const dotsIndex = page + 3;
          for (let i = 1; i <= totalPages; i++) {
            if (i === dotsIndex) {
              pages.push({
                value: "...",
              });
              break;
            }
            pages.push({
              value: i,
            });
          }
          for (let i = totalPages - 3; i <= totalPages; i++) {
            if (i > dotsIndex) {
              pages.push({
                value: i,
              });
            }
          }
          res.render("vwPost/search", {
            layout: "main",
            title: "Kết quả tìm kiếm " + query,
            posts: results.posts,
            user: req.session.user,
            currentPage: page,
            categories: filteredCategories,
            totalPages,
            pages,
            query,
            message: "Tìm thấy " + nRows + " kết quả phù hợp",
          });
        });
      });
    } else if (req.session.isUser) {
      homeModel.searchContentNoPremium(query, limit, startIndex, (err, results) => {
        if (err) {
          console.error("Lỗi khi tìm kiếm bài viết:", err);
          return res.status(500).send("Không thể tìm kiếm bài viết");
        }
        if (results.posts.length === 0) {
          return res.render("vwPost/search", {
            layout: "main",
            posts: results.posts,
            user: req.session.user,
            message: "Không tìm thấy kết quả phù hợp",
          });
        }
        homeModel.searchContentCountNoPremium(query, (err, totalCount) => {
          if (err) {
            console.error("Lỗi khi đếm số kết quả:", err);
            return res.status(500).send("Không thể đếm số kết quả");
          }
          const nRows = totalCount;
          const totalPages = Math.ceil(nRows / limit);
          if (page > totalPages) {
            return res.status(404).send("Không tìm thấy trang");
          }
          let pages = [];
          const dotsIndex = page + 3;
          for (let i = 1; i <= totalPages; i++) {
            if (i === dotsIndex) {
              pages.push({
                value: "...",
              });
              break;
            }
            pages.push({
              value: i,
            });
          }
          for (let i = totalPages - 3; i <= totalPages; i++) {
            if (i > dotsIndex) {
              pages.push({
                value: i,
              });
            }
          }
          res.render("vwPost/search", {
            layout: "main",
            title: "Kết quả tìm kiếm " + query,
            posts: results.posts,
            user: req.session.user,
            currentPage: page,
            totalPages,
            pages,
            query,
            message: "Tìm thấy " + nRows + " kết quả phù hợp",
          });
        });
      });
    }
  },

  showSubscription: (req, res) => {
    const { user, isUser, isSubscriber } = req.session;
    subscriptionModel.getSubscriptionByUserId(user.userId, (err, subscription) => {
      if (err) {
        console.error("Lỗi khi lấy thông tin đăng ký:", err);
        return res.status(500).send("Không thể lấy thông tin đăng ký");
      }
      if (subscription.length === 0) {
        return res.render("vwUser/subscription", {
          layout: "main",
          title: "Đăng ký gói dịch vụ",
          user,
          isUser,
          isSubscriber,
        });
      } else {
        subscriptionModel.getUserSubscriptionDaysLeft(user.userId, (err, daysLeft) => {
          if (err) {
            console.error("Lỗi khi lấy số ngày còn lại của đăng ký:", err);
            return res.status(500).send("Không thể lấy số ngày còn lại của người dùng");
          }
          res.render("vwUser/subscription", {
            layout: "main",
            title: "Gói dịch vụ",
            user,
            subscription: subscription[0],
            isSubscriber,
            daysLeft,
            almostExpired: daysLeft <= 3,
          });
        });
      }
    });
  },

  subscribe: (req, res) => {
    if (req.session.user && req.session.user.role === "subscriber") {
      req.session.notification = {
        type: "warning",
        content: "Bạn đã đăng ký gói dịch vụ này",
      };
      return res.redirect("/main");
    }
    subscriptionModel.subscribe(req.session.user.userId, 30, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Lỗi khi tạo đăng ký");
      }
      req.session.notification = {
        type: "success",
        content: "Bạn đã đăng ký thành công gói dịch vụ!",
      };
      res.redirect("/main");
    });
  },

  extendSubscription: (req, res) => {
    const { user } = req.session;
    subscriptionModel.getSubscriptionByUserId(user.userId, (err, subscription) => {
      if (err) {
        console.error("Lỗi khi lấy thông tin đăng ký:", err);
        return res.status(500).send("Không thể lấy thông tin đăng ký");
      }
      if (subscription.length === 0) {
        req.session.notification = {
          type: "warning",
          content: "Bạn chưa đăng ký gói dịch vụ nên không thể gia hạn",
        };
        return res.redirect("/main");
      }
      subscriptionModel.extendSubscription(user.userId, 30, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Lỗi khi gia hạn đăng ký");
        }
        req.session.notification = {
          type: "success",
          content: "Đăng ký cơ bản 30 ngày",
        };
        res.redirect("/main");
      });
    });
  },

  comment: (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.session.user.userId;
    commentModel.addComment(id, userId, content, (err) => {
      if (err) {
        console.error("Lỗi khi thêm bình luận:", err);
        return res.status(500).send("Không thể thêm bình luận");
      }
      res.redirect(req.headers.referer);
    });
  },
};

module.exports.showTag = (req, res) => {
  const tag = req.params.name;
  const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
  const limit = 2; // Số bài viết trên mỗi trang
  const offset = (page - 1) * limit;
  homeModel.getPostsByTag(tag, limit, offset, (err, result) => {
    if (err) {
      console.error("Lỗi:", err);
      return res.status(500).send("Không thể ra kết quả");
    }
    const { posts, total } = result; // Lấy posts và tổng số bài viết
    const totalPages = Math.ceil(total / limit);
    res.render("vwPost/byTag", {
      layout: "main",
      categories: filteredCategories,
      user: req.session.user,
      title: tag,
      posts,
      currentPage: page,
      totalPages,
      pages: Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 })),
      query: tag, // Truyền query để sử dụng trong View
    });
  });
};
