const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    options: {
        
        trustServerCertificate:true,
        trustedConnection:false,
        enableArithAbort:true,
        instancename:"SQLEXPRESS"
    },
    port:1433,
};

async function connectDB() {
    try {
        const pool = await sql.connect(config);
        console.log("✅ Kết nối SQL Server thành công!");
        return pool;
    } catch (err) {
        console.error("❌ Lỗi kết nối SQL Server:", err);
        throw err;
    }
}

module.exports = { connectDB, sql };
