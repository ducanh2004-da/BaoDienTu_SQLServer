const { connectDB, sql } = require("../utils/db.js");

// Fetch 3-4 highlighted posts in the past week, expanding interval if needed
const getHighlightedPosts = (callback) => {
  connectDB()
    .then(pool => {
      let currentInterval = 7;
      const maxInterval = 365;

      const fetchPosts = async () => {
        try {
          const request = pool.request();
          request.input("IntervalDays", sql.Int, currentInterval);
          const result = await request.execute("GetHighlightedPosts");
          const posts = result.recordset;
          if (posts.length === 0 && currentInterval < maxInterval) {
            currentInterval += 7;
            await fetchPosts();
          } else {
            callback(null, posts);
          }
        } catch (err) {
          callback(err, null);
        }
      };

      fetchPosts();
    })
    .catch(err => callback(err, null));
};

const getHighlightedPostsNoPremium = (callback) => {
  connectDB()
    .then(pool => {
      let currentInterval = 7;
      const maxInterval = 365;

      const fetchPosts = async () => {
        try {
          const request = pool.request();
          request.input("IntervalDays", sql.Int, currentInterval);
          const result = await request.execute("GetHighlightedPostsNoPremium");
          const posts = result.recordset;
          if (posts.length === 0 && currentInterval < maxInterval) {
            currentInterval += 7;
            await fetchPosts();
          } else {
            callback(null, posts);
          }
        } catch (err) {
          callback(err, null);
        }
      };

      fetchPosts();
    })
    .catch(err => callback(err, null));
};

// Fetch the top 10 most viewed posts, including category name
const getTop10MostViewedPosts = (callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .execute("GetTop10ViewedPosts", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

const getTop10MostViewedPostsNoPremium = (callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .execute("GetTop10MostViewedPostsNoPremium", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

// Fetch the top 10 newest posts, including category name
const getTop10NewestPosts = (callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .execute("GetTop10NewestPosts", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

const getTop10NewestPostsNoPremium = (callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .execute("GetTop10NewestPostsNoPremium", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

// Fetch 3 newest posts for each of the top 10 categories
const getTopCategoriesWithNewestPosts = (callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .execute("GetTopCategoriesWithNewestPosts", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

const getTopCategoriesWithNewestPostsNoPremium = (callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .execute("GetTopCategoriesWithNewestPostsNoPremium", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

// Fetch the top 5 most liked posts by category
const getTop5MostLikedPostsByCategory = (categoryId, callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .input("CategoryId", sql.Int, categoryId)
        .execute("GetTop5MostLikedPostsByCategory", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

const getTop5MostLikedPostsByCategoryNoPremium = (categoryId, callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .input("CategoryId", sql.Int, categoryId)
        .execute("GetTop5MostLikedPostsByCategoryNoPremium", (err, result) => {
          if (err) return callback(err, null);
          callback(null, result.recordset);
        });
    })
    .catch(err => callback(err, null));
};

// Search content with total count
const searchContent = (content, limit, offset, callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .input("SearchTerm", sql.NVarChar(sql.MAX), content)
        .input("Limit", sql.Int, limit)
        .input("Offset", sql.Int, offset)
        .execute("SearchContent", (err, result) => {
          if (err) return callback(err, null);
          const posts = result.recordsets[0];
          const total = result.recordsets[1][0].total;
          callback(null, { posts, total });
        });
    })
    .catch(err => callback(err, null));
};

const searchContentNoPremium = (content, limit, offset, callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .input("SearchTerm", sql.NVarChar(sql.MAX), content)
        .input("Limit", sql.Int, limit)
        .input("Offset", sql.Int, offset)
        .execute("SearchContentNoPremium", (err, result) => {
          if (err) return callback(err, null);
          const posts = result.recordsets[0];
          const total = result.recordsets[1][0].total;
          callback(null, { posts, total });
        });
    })
    .catch(err => callback(err, null));
};

// Fetch posts by tag with total count
const getPostsByTag = (tag, limit, offset, callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .input("Tag", sql.NVarChar(100), tag)
        .input("Limit", sql.Int, limit)
        .input("Offset", sql.Int, offset)
        .execute("GetPostsByTag", (err, result) => {
          if (err) return callback(err, null);
          const posts = result.recordsets[0];
          const total = result.recordsets[1][0].total;
          callback(null, { posts, total });
        });
    })
    .catch(err => callback(err, null));
};

const getPostsByTagNoPremium = (tag, limit, offset, callback) => {
  connectDB()
    .then(pool => {
      pool.request()
        .input("Tag", sql.NVarChar(100), tag)
        .input("Limit", sql.Int, limit)
        .input("Offset", sql.Int, offset)
        .execute("GetPostsByTagNoPremium", (err, result) => {
          if (err) return callback(err, null);
          const posts = result.recordsets[0];
          const total = result.recordsets[1][0].total;
          callback(null, { posts, total });
        });
    })
    .catch(err => callback(err, null));
};
// 13. Count search results only
async function searchContentCount(searchTerm, callback) {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('SearchTerm', sql.NVarChar(4000), searchTerm)
      .execute('SearchContentCount');
    const total = result.recordset[0].total;
    callback(null, total);
  } catch (err) {
    callback(err, null);
  }
}

// 14. Count non-premium search results only
async function searchContentCountNoPremium(searchTerm, callback) {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('SearchTerm', sql.NVarChar(4000), searchTerm)
      .execute('SearchContentCountNoPremium');
    const total = result.recordset[0].total;
    callback(null, total);
  } catch (err) {
    callback(err, null);
  }
}

module.exports = {
  getHighlightedPosts,
  getHighlightedPostsNoPremium,
  getTop10MostViewedPosts,
  getTop10MostViewedPostsNoPremium,
  getTop10NewestPosts,
  getTop10NewestPostsNoPremium,
  getTopCategoriesWithNewestPosts,
  getTopCategoriesWithNewestPostsNoPremium,
  getTop5MostLikedPostsByCategory,
  getTop5MostLikedPostsByCategoryNoPremium,
  searchContent,
  searchContentNoPremium,
  searchContentCount,
  searchContentCountNoPremium,
  getPostsByTag,
  getPostsByTagNoPremium
};