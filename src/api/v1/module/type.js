const pool = require('../../../database')

const db = {}

db.add = (name, description) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO type (name_type, description) VALUES ($1, $2) RETURNING *", [name, description],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.delete = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM type WHERE id_type=$1", [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.update = (id, name, description) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE type set name_type=$1, description=$2 WHERE id_type=$3 RETURNING *", [name, description, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.getListType = () => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * from type order by id_type asc", [],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows)
            })
    })
}

db.hasName = (name) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT name_type from type WHERE name_type = $1", [name],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.has = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * from type WHERE id_type = $1", [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.countSongOfType = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * from song_type WHERE id_type = $1", [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount)
            })
    })
}

module.exports = db