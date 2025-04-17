const User = require('../models/user');
const Category = require('../models/category');
const Post =require('../models/post');
const Subscribe = require('../models/subscription');

module.exports.showAll = (req,res) =>{
    User.getAllUser((err,users)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Lấy danh sách danh mục
        Category.getAllCategories((err, categories) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            Post.getAllPosts((err, posts) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                Category.getParentCat((err,parentCat)=>{
                    if(err){
                        return res.status(500).json({ error: err.message });
                    }
                
            res.render('admin/home',{
                posts,users,
                categories,
                user: req.session.user,
                parentCat
            })
        })
    })
})
}
)}
/*module.exports.viewPost = (req,res) =>{
    Post.getAllPosts((err, posts) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
    res.render('admin/showPost',{posts: posts[0]});
    })
}*/
module.exports.viewPost = (req, res) => {
    const postId = req.params.id;

    Post.getPostById(postId, (err, post) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!post) {
            return res.status(404).send('Không tìm thấy bài viết');
        }

        res.render('admin/showPost', { posts: post });
    });
};
/*module.exports.acceptPost = (req,res) =>{
    const id = req.params.id;
    Post.updatePublished(id,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}*/
/*module.exports.acceptPost = async (req, res) => {
    try {
      const id = req.params.id;
      
      // Kiểm tra bài viết tồn tại trước
      const post = await new Promise((resolve, reject) => {
        Post.getPostById(id, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Duyệt bài viết
      await new Promise((resolve, reject) => {
        Post.updatePublished(id, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.redirect('/admin');
    } catch (err) {
      console.error('Error accepting post:', err);
      res.status(500).json({ error: err.message });
    }
  };*/
module.exports.acceptPost = async (req, res) => {
    try {
      // Kiểm tra đăng nhập và quyền admin
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
          message: 'Bạn không có quyền thực hiện thao tác này'
        });
      }
  
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).render('error', {
          message: 'ID bài viết không hợp lệ'
        });
      }
  
      // Kiểm tra bài viết tồn tại
      const post = await new Promise((resolve, reject) => {
        Post.getPostById(id, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
  
      if (!post) {
        return res.status(404).render('error', {
          message: 'Bài viết không tồn tại'
        });
      }
  
      // Duyệt bài viết
      await new Promise((resolve, reject) => {
        Post.updatePublished(id, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
  
      req.flash('success', 'Duyệt bài viết thành công');
      res.redirect('/admin');
      
    } catch (err) {
      console.error('Lỗi khi duyệt bài viết:', err);
      res.status(500).render('error', {
        message: 'Đã xảy ra lỗi khi duyệt bài viết'
      });
    }
  };
module.exports.notAcceptPost = (req,res) =>{
    const id = req.params.id;
    Post.deletePost(id,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}
module.exports.viewEditCategory = (req,res) =>{
    const id = req.params.id;
    Category.getCatById(id,(err,category)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.render('admin/editCategory',{category: category[0]})
    })
}
module.exports.viewAddCategory = (req,res) =>{
    User.getEditor((err,user)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        Category.getParentCat((err,category)=>{
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.render('admin/addCategory', 
                { 
                    layout:false ,
                    user:user,
                    category:category
    
                });
        })
    })
}
module.exports.addCategory = (req,res) =>{
    const newCat = req.body;
    const editorId = req.body.editorId === "" ? null : req.body.editorId;
    const parentId = req.body.parentId === "" ? null : req.body.parentId;
    if (!newCat || !newCat.name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    Category.add(editorId,parentId,newCat,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}
module.exports.EditCategory = (req,res) =>{
    const id = req.params.id;
    const cat = req.body;
    Category.update(id,cat,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}
module.exports.deleteCategory = (req,res) =>{
    const id = req.params.id;
    Category.deletes(id,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}
module.exports.viewUser = (req,res) =>{
    const id = req.params.id;
    User.findUser(id,(err,users)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.render('admin/showUser',{users: users[0]})
    })
}
module.exports.viewEditUser = (req,res) =>{
    const id = req.params.id;
    User.findUser(id,(err,user)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.render('admin/editUser',{user: user[0]})
    })
}
module.exports.deleteUser = (req,res) =>{
    const id = req.params.id;
    User.deletes(id,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}

module.exports.EditUser = (req,res) =>{
    const id = req.params.id;
    const user = req.body;
    User.updateRole(id,user,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}

module.exports.viewEditPost = (req,res) =>{
    const id = req.params.id;
    Post.getPostById(id,(err,post)=>{
        if(err){
            return res.status(500).json({ error: err.message });
        }
        res.render('admin/editPost',{post:post[0]})
    })

}
module.exports.EditPost = (req,res) =>{
    const id = req.params.id;
    const post = req.body;
    Post.updatePost(id,post,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/admin');
    })
}
/*module.exports.Delay = (req,res) =>{
    const userId = req.params.id;
    User.findById(userId,(err,user)=>{
        if(err){
            console.log(err);
        }
        if (!user) {
            return res.status(404).send('Người dùng không tồn tại.');
        }
        Subscribe.getSubscriptionByUserId(userId,(err,subscription)=>{
            if(err){
                console.log(err);
            }
            if (!subscription) {
                return res.status(404).send('Người dùng chưa có tài khoản subscriber.');
            }
            const newEndDate = new Date(subscription[0].end_date);
            newEndDate.setDate(newEndDate.getDate() + 7); // Cộng thêm 7 ngày
            Subscribe.extendSubscriptions(newEndDate,userId,(err)=>{
                if(err){
                    console.log(err);
                }
                res.redirect('/admin');
            })
        })
    })
}*/
module.exports.Delay = async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    try {
      // Kiểm tra người dùng
      const pool = await connectDB();
      const userResult = await pool.request()
        .input("id", sql.Int, userId)
        .query("SELECT * FROM users WHERE id = @id");
      const user = userResult.recordset[0];
  
      if (!user) {
        return res.status(404).send("Người dùng không tồn tại.");
      }
  
      // Kiểm tra subscription
      const subscriptionResult = await pool.request()
        .input("userId", sql.Int, userId)
        .execute("GetSubscriptionByUserId");
      const subscription = subscriptionResult.recordset;
  
      if (!subscription || subscription.length === 0) {
        return res.status(404).send("Người dùng chưa có tài khoản subscriber.");
      }
  
      // Gia hạn subscription thêm 7 ngày
      await pool.request()
        .input("userId", sql.Int, userId)
        .input("days", sql.Int, 7)
        .execute("ExtendSubscription");
  
      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.status(500).send("Lỗi server");
    }
  };