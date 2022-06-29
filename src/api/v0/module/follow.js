const pool = require('../../../database');

const db = {};

db.add = (id_account, id_account_follower) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO follow_account (id_follower, id_following) VALUES ($1, $2)",
            [id_account, id_account_follower], (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            })
    })
}

db.has = (id_account, id_account_follower) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM follow_account WHERE id_follower=$1 AND id_following=$2",
            [id_account, id_account_follower], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.delete = (id_account, id_account_follower) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM follow_account WHERE id_follower=$1 AND id_following=$2",
            [id_account, id_account_follower], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

// Những tài khoản mà id_account theo dõi
db.listFollowerOf = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`select id_follower from follow_account where id_following=$1 order by follow_time desc`,
            [id_account], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.listFollowingOfLite = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id_follower FROM follow_account WHERE id_following = $1 order by follow_time desc',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows)
            })
    })
}


db.listFollowingOf = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`select id_following from follow_account where id_follower=$1 order by follow_time desc`,
            [id_account], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.deleteAll = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM follow_account WHERE id_following=$1", [id_account], (err, result) => {
            if (err) return reject(err);
            return resolve(result);
        })
    })
}

module.exports = db;