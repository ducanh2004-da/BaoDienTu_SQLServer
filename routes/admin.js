const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin');

router.get('/',AdminController.showAll);
router.get('/post/detail',AdminController.viewPost);
router.post('/post/:id/accept',AdminController.acceptPost);
router.post('/post/:id/notaccept',AdminController.notAcceptPost);
router.post('/category/create',AdminController.addCategory)
router.get('/category/:id/edit',AdminController.viewEditCategory);
router.post('/category/:id/edit',AdminController.EditCategory);
router.post('/category/:id/delete',AdminController.deleteCategory);
router.get('/category/create',AdminController.viewAddCategory);
router.get('/:id/detailUser',AdminController.viewUser);
router.get('/user/:id/edit',AdminController.viewEditUser);
router.post('/user/:id/delete',AdminController.deleteUser);
router.post('/user/:id/edit',AdminController.EditUser);
router.get('/post/:id/edit',AdminController.viewEditPost);
router.post('/post/:id/edit',AdminController.EditPost);
router.get('/user/:id/delay',AdminController.Delay);
module.exports = router;