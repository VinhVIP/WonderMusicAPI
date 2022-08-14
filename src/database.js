const pg = require("pg");
pg.types.setTypeParser(1114, function(stringValue) {
    return stringValue; //1114 for time without timezone type
    // found in: node_modules/pg-types/lib/textParsers.js
});

const Pool = pg.Pool

// const pool = new Pool({
//     host: 'localhost',
//     database: "wonder_music",
//     user: "postgres",
//     password: "123456",
//     port: 5432
// });

const pool = new Pool({
    connectionString: 'postgres://roilovezhlpkjc:34953c0f2a9d4948b31dc3fc8202153223d3a198797817f935999f2c683efeed@ec2-44-195-100-240.compute-1.amazonaws.com:5432/dcna5vs5mr3gm3',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.log("Error: " + err);
    process.exit(-1);
})


module.exports = pool;