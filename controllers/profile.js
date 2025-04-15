const User = require('../models/user');

module.exports.show = (req,res) =>{
    const user = req.session.user;
    // Định dạng ngày thành 'YYYY-MM-DD'
    User.findById(req.session.user.id,(err,user)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.birthday) {
            const formattedBirthday = new Date(user.birthday).toISOString().split('T')[0];
            user.birthday = formattedBirthday; 
        }
        res.render('vwUser/profile',{
            layout: "main",
            title: "Hồ sơ cá nhân",
            user: user
        })
    })
}

module.exports.viewEdit = (req,res) =>{
    console.log(req.headers.referer);
    req.session.retUrl = req.headers.referer;
    res.render('vwUser/editProfile',{
        layout: "main",
        title: "Chỉnh sửa hồ sơ",
        user: req.session.user
    })
}

module.exports.Edit = (req,res) =>{
    const id = req.session.user.id;
    const user = req.body;

    console.log(req.file)
    if (!req.file) {
        return res.status(400).send('Vui lòng tải lên một ảnh.');
    }

    const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedFormats.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'File định dạng không hợp lệ!' });
    }

    const imageUrl = req.file.path;

    User.editUser(id,user,imageUrl,(err)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect(req.session.retUrl);
    })
}