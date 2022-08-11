const pg = require("pg");
pg.types.setTypeParser(1114, function(stringValue) {
    return stringValue; //1114 for time without timezone type
    // found in: node_modules/pg-types/lib/textParsers.js
});

const Pool = pg.Pool

const pool = new Pool({
    host: 'localhost',
    database: "wonder_music",
    user: "postgres",
    password: "123456",
    port: 5432
});

// const pool = new Pool({
//     connectionString: 'postgres://yqthabozijitzv:db66e40f9d9b05dce63703dd4083e53bd160101ba3fd9b147eedbb3ac500d033@ec2-3-223-169-166.compute-1.amazonaws.com:5432/de4s4iuukk0q07',
//     ssl: {
//         rejectUnauthorized: false
//     }
// });

pool.on('error', (err) => {
    console.log("Error: " + err);
    process.exit(-1);
})


module.exports = pool;