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
    connectionString: 'postgres://vqiajhjomedmjz:34384d7a60dd1eb64387a50094180b8000361c418fc1ac7f01c08d7bc1b21d57@ec2-44-195-100-240.compute-1.amazonaws.com:5432/dbltrr6rcjgctc',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.log("Error: " + err);
    process.exit(-1);
})


module.exports = pool;