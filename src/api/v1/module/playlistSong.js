const pool = require('../../../database')

const db = {}

db.add = (id_playlist, id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO playlist_song (id_playlist, id_song) VALUES ($1, $2) RETURNING id_playlist", [id_playlist, id_song], (err, result) => {
            if (err) return reject(err)
            return resolve(result.rows[0].id_playlist)
        })
    })
}

db.has = (id_playlist, id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM playlist_song WHERE id_playlist=$1 AND id_song=$2", [id_playlist, id_song], (err, result) => {
            if (err) return reject(err)
            return resolve(result.rows[0])
        })
    })
}

db.delete = (id_playlist, id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM playlist_song WHERE id_playlist=$1 AND id_song=$2", [id_playlist, id_song], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0])
        })
    })
}

db.listSongsOfPlaylist = (id_playlist, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT PLS.id_song FROM playlist_song PLS
            INNER JOIN playlist PL ON PLS.id_playlist = PL.id_playlist
            WHERE PL.id_playlist = $1
            ORDER BY PLS.playlist_song_time DESC`, [id_playlist], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT PLS.id_song FROM playlist_song PLS
            INNER JOIN playlist PL ON PLS.id_playlist = PL.id_playlist
            WHERE PL.id_playlist = $1
            ORDER BY PLS.playlist_song_time DESC LIMIT 10 OFFSET $2`, [id_playlist, (page - 1) * 10], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

db.listPlaylistTotalListenSong = () => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT Pl.id_account, Pl.id_playlist, PL.name_playlist, PL.playlist_status, sum(S.listen) as total_listen FROM playlist_song PLS 
        INNER JOIN playlist PL ON PL.id_playlist = PLS.id_playlist             
        INNER JOIN song S ON S.id_song = PLS.id_song            
        WHERE PL.playlist_status = 0
        GROUP BY Pl.id_playlist
        ORDER BY total_listen DESC
        LIMIT 10`, (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows);
        })
    })
}

db.listPlaylistSong = (id_playlist, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT PLS.id_song FROM playlist_song PLS
            INNER JOIN playlist PL ON PLS.id_playlist = PL.id_playlist
            WHERE PL.id_playlist = $1
            ORDER BY PLS.playlist_song_time DESC`, [id_playlist], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT PLS.id_song FROM playlist_song PLS
            INNER JOIN playlist PL ON PLS.id_playlist = PL.id_playlist
            WHERE PL.id_playlist = $1
            ORDER BY PLS.playlist_song_time DESC LIMIT 10 OFFSET $2`, [id_playlist, (page - 1) * 10], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

module.exports = db