const pool = require('../../../database')

const db = {}

db.add = (name_playlist, id_account, playlist_status) => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO playlist (name_playlist, id_account, playlist_status) VALUES ($1, $2, $3) RETURNING *',
            [name_playlist, id_account, playlist_status],
            (err, result) => {
                if (err) return reject(err)
                return resolve(result.rows[0])
            }
        )
    })
}

db.getPlaylist = (id_playlist) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_playlist, name_playlist, playlist_status FROM playlist WHERE id_playlist=$1",
            [id_playlist],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.has = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT name_playlist FROM playlist WHERE id_playlist=$1",
            [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.delete = (id_playlist) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM playList where id_playlist = $1',
            [id_playlist],
            (err, result) => {
                if (err) return reject(err)
                return resolve(result.rows[0])
            }
        )
    })
}

db.update = (id_playlist, playlist) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE playlist SET name_playlist=$1, playlist_status=$2 WHERE id_playlist=$3 RETURNING *',
            [playlist.name_playlist, playlist.playlist_status, id_playlist],
            (err, result) => {
                if (err) return reject(err)
                return resolve(result.rows[0])
            }
        )
    })
}

db.hasName = (name_playlist) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM playlist WHERE name_playlist=$1", [name_playlist], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rowCount > 0);
        })
    })
}

db.hasNameID = (id_playlist) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT name_playlist FROM playlist WHERE id_playlist=$1", [id_playlist], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0].name_playlist);
        })
    })
}

db.findId_playlist = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM playlist WHERE id_account=$1 ORDER BY id_playlist DESC", [id_account], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows);
        })
    })
}

db.countSongOfPlaylist = (id_playlist) => {
    return new Promise((resolve, reject) => {
        pool.query("select * from playlist_song where id_playlist=$1",
            [id_playlist],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount)
            })
    })
}

db.listPlaylistAccount = (id_account, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query("SELECT id_playlist, name_playlist, playlist_status FROM playlist WHERE id_account=$1 ORDER BY id_playlist DESC",
                [id_account],
                (err, result) => {
                    if (err) return reject(err)
                    return resolve(result.rows)
                })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT id_playlist, name_playlist, playlist_status FROM playlist WHERE id_account=$1 ORDER BY id_playlist DESC LIMIT 10 OFFSET $2 `,
                [id_account, (page - 1) * 10], (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        })
    }
}

module.exports = db