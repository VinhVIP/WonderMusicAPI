const pool = require('../../../database')

const db = {}

db.createAlbum = (nameAlbum, idAccount) => {
    return new Promise((resolve, reject) => {
        pool.query(`INSERT INTO album(name_album, id_account) VALUES($1,$2)`, [nameAlbum, idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.updateAlbum = (idAlbum, nameAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`UPDATE album SET name_album = $1 WHERE id_album = $2`, [nameAlbum, idAlbum],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.deleteAlbum = (idAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`DELETE FROM album WHERE id_album = $1`, [idAlbum],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0)
            })
    })
}

db.moveSongToAlbum = (idAlbum, idSong) => {
    return new Promise((resolve, reject) => {
        pool.query(`UPDATE song SET id_album = $1 WHERE id_song = $2`, [idAlbum, idSong],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0)
            })
    })
}

db.hasSongInAlbum = (idAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT 1 FROM album INNER JOIN song ON album.id_album = song.id_album
                    WHERE album.id_album = $1 `, [idAlbum],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.hasNameAlbum = (nameAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT 1 FROM album WHERE name_album = $1`, [nameAlbum],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.hasIdAlbum = (idAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT * FROM album WHERE id_album = $1`, [idAlbum],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.getListAlbum = (idAccount) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT album.* FROM album INNER JOIN account ON album.id_account = account.id_account
                    WHERE account.id_account = $1 ORDER BY album.create_date DESC`, [idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.countSongOfAlbum = (idAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT COUNT(*) as cnt FROM song WHERE id_album=$1`, [idAlbum],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.list = (id_account, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM album 
            WHERE id_account=$1 order by create_date desc`, [id_account], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM album 
            WHERE id_account=$1 order by create_date desc LIMIT 10 OFFSET $2`, [id_account, (page - 1) * 10], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

db.selectPublicSongsOfAlbum = (id, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM Song
            WHERE id_album = $1 AND song_status = 0`, [id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM Song
            WHERE id_album = $1 AND song_status = 0 LIMIT 10 OFFSET $2`, [id, (page - 1) * 10], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

db.selectAllSongsOfAlbum = (id, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM Song
            WHERE id_album = $1`, [id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM Song
            WHERE id_album = $1 LIMIT 10 OFFSET $2`, [id, (page - 1) * 10], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

db.has = (idAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT * from album where id_album = $1`, [idAlbum], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rowCount > 0);
        })
    })
}


db.selectId = (idAlbum) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT * from album where id_album = $1`, [idAlbum], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0]);
        })
    })
}

module.exports = db