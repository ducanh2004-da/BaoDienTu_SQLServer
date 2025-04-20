const editorModel = require("../models/editor.js");
const postModel = require("../models/post.js");
const path = require("path");

module.exports = {
  showArticleReview: (req, res) => {
    const id = req.query.id;
    const userId = req.session.user.userId;
    editorModel.isPostInEditorCategories(
      id,
      userId,
      (err, isInEditorCategories) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi kiểm tra bài viết.");
        }

        if (!isInEditorCategories) {
          return res.status(403).send("Không thể xem bài viết này.");
        }

        editorModel.getArticleById(id, (err, results) => {
          console.log("ok");
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi lấy bài viết.");
          }

          const article = results[0]; // Lấy bài viết đầu tiên từ kết quả
          if (!article) {
            return res.status(404).send("Không tìm thấy bài viết.");
          }

          // Sửa lỗi bằng cách kiểm tra article.tags và gán giá trị mặc định
          const tags = (article?.tags ?? "")
            .split(",")
            .map((tag) => tag.trim());

          postModel.getPostAuthorInfo(id, (err, authorInfo) => {
            if (err) {
              console.error("Lỗi khi lấy thông tin tác giả:", err);
              return res.status(500).send("Không thể lấy thông tin tác giả");
            }

            res.render("vwEditor/editor_postreview", {
              layout: "main",
              title: "Xem bài viết",
              article: article,
              author: authorInfo,
              tags: tags,
              user: req.session.user.userId,
            });
          });
        });
      }
    );
  },

  showMainPage: (req, res) => {
    const statusFilter = req.query.statusName;
    const userId = req.session.user.userId;

    editorModel.getArticlesByStatusOfEditor(
      statusFilter,
      userId,
      (err, articles) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi lấy bài viết.");
        }
        res.render("vweditor/editor_review", {
          layout: "main",
          title: "Danh sách bài viết",
          articles: articles,
          user: req.session.user.userId,
        });
      }
    );
  },

  articleApproved: (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Thiếu ID bài viết." });
    }

    editorModel.isPostInEditorCategories(
      id,
      req.session.user.userId,
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi kiểm tra bài viết.");
        }

        if (result.length === 0) {
          return res.status(403).send("Không thể xem bài viết này.");
        }

        editorModel.updateStatusName("Approved", id, "", (err) => {
          if (err) {
            console.error("Error updating status:", err);
            return res
              .status(500)
              .json({ message: "Có lỗi xảy ra khi cập nhật trạng thái." });
          }
          return res
            .status(200)
            .json({ message: "Cập nhật trạng thái thành công." });
        });
      }
    );
  },

  articleRejected: (req, res) => {
    const { id, rejectReason } = req.body;

    if (!rejectReason || !id) {
      return res
        .status(400)
        .json({ message: "Thiếu lý do từ chối hoặc ID bài viết." });
    }

    editorModel.isPostInEditorCategories(
      id,
      req.session.user.userId,
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi kiểm tra bài viết.");
        }

        if (result.length === 0) {
          return res.status(403).send("Không thể xem bài viết này.");
        }

        editorModel.updateStatusName("Rejected", id, rejectReason, (err) => {
          if (err) {
            console.error("Error updating status:", err);
            return res
              .status(500)
              .json({ message: "Có lỗi xảy ra khi cập nhật trạng thái." });
          }
          return res
            .status(200)
            .json({ message: "Cập nhật trạng thái thành công." });
        });
      }
    );
  },
};

module.exports.acceptPost = (req, res) => {
  const id = req.params.id;
  postModel.updatePublished(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.redirect("/editor");
  });
};

module.exports.schedulePost = (req, res) => {
  const id = req.params.id;
  const { publish_date } = req.body;

  // Cập nhật thời gian đăng bài
  postModel.updateScheduledPublishDate(id, publish_date, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.redirect("/editor");
  });
};
