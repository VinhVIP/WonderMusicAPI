const pool = require('../../../database')

const db = {}


db.has = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT EXISTS (SELECT account_name FROM account WHERE id_account=$1)",
            [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].exists)
            })
    })
}

db.hasIdAccountDevice = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT EXISTS (SELECT id_account FROM account_device WHERE id_account=$1)",
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].exists)
            })
    })
}

db.addTokenAccountDevice = (id_account, token) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO account_device values($1, $2) RETURNING device_token",
            [id_account, token],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].device_token);
            })
    })
}

db.updateTokenAccountDevice = (id_account, token) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account_device SET device_token = $1 WHERE id_account = $2",
            [token, id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

module.exports = db