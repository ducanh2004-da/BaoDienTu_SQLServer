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
    await initializeCategories(); // Ensure categories is populated
    filteredCategories = categories
        .filter((category) => category.parent_id === null)
        .map((parent) => ({
            ...parent,
            children: categories.filter((child) => child.parent_id === parent.id),
        }));
};

// Call the function to initialize and update
updateFilteredCategories().then(() => {}).catch((error) => {
    console.error("Error updating filtered categories:", error);
});

module.exports = {
    // Hiển thị trang chủ
    showHomePage: (req, res) => {

        let notification = req.session.notification || null;

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

                        notification = req.session.notification || null;

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
    // Show the category page
        showCategory: (req, res) => {
            const query = req.query.q || ""; // Lấy giá trị q từ query string hoặc để trống
            const id = parseInt(req.params.id || 0);
            if (isNaN(id) || id <= 0) {
                return res.status(400).send("ID danh mục không hợp lệ");
            }
    
            let page = parseInt(req.query.page) || 1;
                if (page < 1) page = 1;
        
                const limit = 5;
                const startIndex = (page - 1) * limit;
    
            categoryModel.getCatById(id, (err, category) => {
                if (err) {
                    return res.status(500).send("Không thể lấy danh mục");
                }
    
                    postModel.getPostsByCategoryNoPremium(id, limit, startIndex, (err, posts) => {
                        if (err) {
                            return res.status(500).send("Không thể lấy bài viết của danh mục này");
                        }
    
                        homeModel.getTop5MostLikedPostsByCategory(id, (err, hotPosts) => {
                            if (err) {
                                return res.status(500).send("Không thể lấy bài viết được yêu thích nhất của danh mục này");
                            }
                            postModel.getPostsByCategoryCountNoPremium(id,(err,countResult)=>{
                                if (err) {
                                    return res.status(500).send("Không thể lấy danh mục");
                                }
    
                                console.log("Count Result:", countResult);
    
                                const nRows = countResult[0]?.total || 0;
                                const totalPages = Math.ceil(nRows / limit);
                        
                                if (page > totalPages && totalPages > 0) {
                                    return res.status(404).send("Không tìm thấy trang");
                                }
                        
                                // Tạo danh sách số trang
                                const pages = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 }));
                            // Render the homepage view
                            res.render("vwPost/byCat", {
                                layout: "main",
                                title: category[0].name,
                                categories: filteredCategories,    // Hierarchical categories
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
                    })
            });
        },
    
    // Hiển thị chi tiết bài viết
    showDetail: (req, res) => {
        const id = req.params.id;

        postModel.updateView(id, (err) => {
            if (err) {
                console.error("Lỗi khi tăng lượt xem:", err);
                return res.status(500).send("Không thể tăng lượt xem");
            }
        });

        postModel.isPremium(id, (err, result) => {
            if (err) {
                console.error("Lỗi khi kiểm tra bài viết có phải premium:", err);
                return res.status(500).send("Không thể kiểm tra bài viết");
            }

            if (result[0].premium) {
                req.session.notification = {
                    type: "danger",
                    message: "Bạn không có đủ quyền truy cập bài viết này",
                };
                return res.redirect("/home");
            } else {
                postModel.getPostById(id, (err, post) => {
                    if (err) {
                        console.error("Lỗi khi lấy chi tiết bài viết:", err);
                        return res.status(500).send("Không thể lấy chi tiết bài viết");
                    }

                    if (post.statusName != "Published") {
                        return res.status(404).send("Bài viết không tồn tại hoặc chưa được xuất bản");
                    }

                    const tags = post.tags?.split(',').map(tag => tag.trim());

                    postModel.getPostAuthorInfo(post.id, (err, author) => {
                        if (err) {
                            console.error("Lỗi khi lấy thông tin tác giả:", err);
                            return res.status(500).send("Không thể lấy thông tin tác giả");
                        }
                        categoryModel.getPostCategories(post.id,(err, cats)=>{
                            if (err) {
                                console.error("Lỗi khi lấy thông tin :", err);
                                return res.status(500).send("Không thể lấy thông tin");
                            }

                            console.log(cats);

                            // Fetch comments for the post
                            commentModel.getCommentsByPostId(id, (err, comments) => {
                                if (err) {
                                    console.error("Lỗi khi lấy bình luận:", err);
                                    return res.status(500).send("Không thể lấy bình luận");
                                }
                                postModel.get5PostsByCatNoPremium(id,(err,relatedPosts)=>{
                                    if (err) {
                                        console.error("Lỗi khi lấy bình luận:", err);
                                        return res.status(500).send("Không thể lấy bình luận");
                                    }

                                // Render post detail view
                                res.render("vwPost/post-detail", {
                                    layout: "main",
                                    title: post.title,
                                    post: post, // Single post data
                                    categories: filteredCategories, // Hierarchical categories
                                    postCategories: cats, // Category information
                                    author: author, // Author information
                                    comments: comments, // Comments for the post
                                    tags: tags,
                                    relatedPosts
                                });
                            });
                        });
                    });
                })
                });
            }
        });
    },

    // Tìm kiếm bài viết
    search: (req, res) => {
        const query = validateInput(req.query.q) || "";

        if (!req.query.page) {
            return res.redirect("./search?q=" + query + "&page=1");
        }

        let page = req.query.page;
        if (page < 1) page = 1;

        const limit = 10;
        const startIndex = (page - 1) * limit;

        homeModel.searchContentNoPremium(query, limit, startIndex, (err, results) => {
            if (err) {
                console.error("Lỗi khi tìm kiếm bài viết:", err);
                return res.status(500).send("Không thể tìm kiếm bài viết");
            }

            if (results.length === 0) {
                return res.render("vwPost/search", {
                    layout: "main",
                    title: "Kết quả tìm kiếm cho " + query,
                    posts: results,
                    categories: filteredCategories,
                    user: req.session.user,
                    message: "Không tìm thấy kết quả phù hợp",
                });
            }

            homeModel.searchContentCountNoPremium(query, (err, count) => {
                if (err) {
                    console.error("Lỗi khi đếm số kết quả:", err);
                    return res.status(500).send("Không thể đếm số kết quả");
                }

                const nRows = count[0].total;
                const totalPages = Math.ceil(nRows / limit);

                if (page > totalPages) {
                    return res.status(404).send("Không tìm thấy trang");
                }

                pages = [];
                const dotsIndex = page + 3;
                for (let i = 1; i <= totalPages; i++) {
                    if (i === dotsIndex) {
                        pages.push({
                            value: "...",
                        });
                        break;
                    }
                    if (i <= totalPages) {
                        pages.push({
                            value: i,
                        });
                    }
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
                    title: "Kết quả tìm kiếm cho " + query,
                    posts: results,
                    categories: filteredCategories,
                    currentPage: page,
                    totalPages,
                    pages,
                    query,
                    message: "Tìm thấy " + nRows + " kết quả phù hợp",
                });
            });
        });
    }
};
module.exports.showTag = (req, res) => {
    const tag = req.params.name;
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = 2; // Số bài viết trên mỗi trang
    const offset = (page - 1) * limit;

    homeModel.getPostsByTagNoPremium(tag, limit, offset, (err, result) => {
        if (err) {
            console.error("Lỗi:", err);
            return res.status(500).send("Không thể ra kết quả");
        }

        const { posts, total } = result; // Lấy posts và tổng số bài viết
        const totalPages = Math.ceil(total / limit);

        res.render("vwPost/byTag", {
            layout: "main",
            title: tag,
            posts,
            currentPage: page,
            totalPages,
            pages: Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 })),
            query: tag, // Truyền query để sử dụng trong View
        });
    });
};

