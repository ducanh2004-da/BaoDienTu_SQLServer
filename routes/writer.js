const express = require("express");
const router = express.Router();
const writerController = require("../controllers/writer.js");
const authMiddleware = require("../middlewares/auth");
const writerModel = require("../models/writer");

router.get("/", authMiddleware.isUser, authMiddleware.isWriter, (req, res) => {
    res.redirect("/writer/my-articles");
});
router.get("/post-article", writerController.showPostArticlePage);
router.get("/my-articles", writerController.showMyArticlePage);
router.get("/fix-article", writerController.showFixArticlePage);
router.post("/fix-article/submit", writerController.submitFixArticle);
router.get("/refuse-article", writerController.showRefuse);
router.get("/category", writerController.showCategoryPage);
router.post("/submit-article", writerController.submitArticle);

module.exports = router;
