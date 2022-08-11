const pool = require('../../../database')

const db = {}


db.has = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT EXISTS (SELECT account_name FROM account WHERE id_account=$1)", [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].exists)
            })
    })
}

db.updateAccountDeviceToken = (id_account, token) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET device_token = $1 where id_account = $2", [token, id_account], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0])
        })
    })
}

module.exports = db