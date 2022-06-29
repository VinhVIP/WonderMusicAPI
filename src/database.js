const { Pool } = require("pg");

const pool = new Pool({
    connectionString: 'postgres://bmdctzlcmkgnym:6d6f445a86791893efa69b5fb4a62b498faa4ef563269d4579c9aacea0f55249@ec2-35-175-68-90.compute-1.amazonaws.com:5432/db77qanjk55cnt',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.log("Error: " + err);
    process.exit(-1);
})


module.exports = pool;