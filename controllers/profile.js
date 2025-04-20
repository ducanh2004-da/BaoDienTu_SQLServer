const User = require('../models/user');

module.exports.show = (req, res) => {
  // Lấy thông tin user chi tiết từ cơ sở dữ liệu qua stored procedure sp_FindUserById
  User.findById(req.session.user.userId, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (user && user.birthday) {
      // Định dạng ngày sinh theo 'YYYY-MM-DD'
      const formattedBirthday = new Date(user.birthday).toISOString().split('T')[0];
      user.birthday = formattedBirthday;
    }
    res.render('vwUser/profile', {
      layout: "main",
      title: "Hồ sơ cá nhân",
      user: user
    });
  });
};

module.exports.viewEdit = (req, res) => {
  // Lưu lại URL hiện tại để quay lại sau khi cập nhật profile
  req.session.retUrl = req.headers.referer || '/profile';
  res.render('vwUser/editProfile', {
    layout: "main",
    title: "Chỉnh sửa hồ sơ",
    user: req.session.user
  });
};

module.exports.Edit = (req, res) => {
  const id = req.session.user.userId;
  const userData = req.body;

  // Kiểm tra xem có file được tải lên hay không
  if (!req.file) {
    return res.status(400).send('Vui lòng tải lên một ảnh.');
  }

  const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedFormats.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'File định dạng không hợp lệ!' });
  }

  const imageUrl = req.file.path;

  // Gọi hàm editUser trong model để cập nhật thông tin user qua stored procedure sp_EditUser
  User.editUser(id, userData, imageUrl, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.redirect(req.session.retUrl || '/profile');
  });
};
