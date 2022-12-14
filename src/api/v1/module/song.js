const pool = require('../../../database')

const db = {}

db.addSong = (id_account, linkSong, imgSong, song) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO song(id_account, name_song, link, lyrics,description, id_album, image_song) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", [id_account, song.name_song, linkSong, song.lyrics, song.description, song.id_album, imgSong],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

//Xóa tất cả thể loại của bài hát (khi cập nhật bài hát thì xóa hết rồi thêm mới lại)
db.deleteTypeSong = (id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM song_type WHERE id_song = $1", [id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.addTypeSong = (id_song, id_type) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO song_type (id_song, id_type) VALUES ($1, $2)", [id_song, id_type],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            })
    })
}

//Lấy danh sách ca sĩ của bài hát
db.getSingerSong = (id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT account.id_account, account.account_name FROM singer_song INNER JOIN account ON singer_song.id_account = account.id_account WHERE id_song = $1", [id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}


//Lấy danh sách thể loại của bài hát
db.getTypes = (id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT type.id_type, type.name_type FROM type INNER JOIN song_type ON type.id_type = song_type.id_type WHERE song_type.id_song = $1", [id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.deleteSongSingerSong = (idSong) => {
    return new Promise((resolve, reject) => {
        pool.query(`DELETE FROM singer_song WHERE id_song = $1`, [idSong],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.addSingerSong = (id_acc, id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO singer_song (id_account, id_song) VALUES ($1, $2)", [id_acc, id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            })
    })
}

db.getSong = (id_song, idAccount = -1) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT song.id_song, song.name_song, song.link, song.lyrics, song.listen,song.image_song, count(love.id_song) as qtylove,song.description,song.song_status, song.created, exists(select 1 from love where love.id_account = $1 and love.id_song = $2) as lovestatus, song.id_account, song.id_album " +
            "FROM(((song " +
            "LEFT JOIN love ON song.id_song = love.id_song) " +
            "INNER JOIN album ON song.id_album = album.id_album) " +
            "INNER JOIN account ON song.id_account = account.id_account) " +
            "WHERE song.id_song = $2 " +
            "GROUP BY song.id_song, account.account_name, album.name_album, account.id_account", [idAccount, id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.getTotalListenOfSong = (idSong) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * from listen where id_song = $1", [idSong],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount);
            })
    })
}

db.getAuthorOfSong = (idSong) => {
    return new Promise((resolve, reject) => {
        pool.query("select id_account from song where id_song=$1", [idSong],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].id_account);
            })
    })
}

db.hasSong = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM song WHERE id_song=$1", [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

// Kiểm tra tài khoản có phải tác giả của bài hát hay không?
db.authorSong = (idAccount, idSong) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM song WHERE id_song = $1 AND id_account = $2 ", [idSong, idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

// Kiểm tra tài khoản có phải tác giả của bài hát hay không?
db.singerOfSong = (idAccount, idSong) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM singer_song WHERE id_song = $1 AND id_account = $2 ", [idSong, idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.updateSong = (id_song, linkImage, song) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE song SET name_song = $1, lyrics= $3, description= $4, id_album= $5, image_song = $6 WHERE id_song = $7 RETURNING *", [song.name_song, '', song.lyrics, song.description, song.id_album, linkImage, id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.deleteSong = (id_song, idAccount) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM song WHERE id_song = $1 AND id_account = $2", [id_song, idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.getListSongtype = (id_type, page) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT song.* FROM song, song_type WHERE song.id_song = song_type.id_song AND song_type.id_type = $1 ORDER BY song.created DESC 
                LIMIT 20 OFFSET $2`, [id_type, (page - 1) * 20],
            (err, result) => {
                if (err) return reject(err);
                return resolve({ list: result.rows, exist: result.rowCount > 0 });
            })
    })
}

//Lấy danh sách 20 bài hát nhiều lượt nghe nhất
db.getBestSong = () => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT song.* FROM song ORDER BY song.listen DESC FETCH FIRST 100 ROWS ONLY",
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.getTop10Days = () => {
    return new Promise((resolve, reject) => {
        pool.query(`select song.id_song, count(listen_time) as total
                from song left join listen on song.id_song = listen.id_song
                and listen_time::date > now()::date - '10 day'::interval
                group by song.id_song
                order by total desc
                limit 100 offset 0`, [],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.getTop3Songs = () => {
    return new Promise((resolve, reject) => {
        pool.query(`select id_song, count(*) as listen10d from listen
            where listen_time::date > now()::date - '10 day'::interval
            group by id_song
            order by listen10d desc
            limit 3 offset 0`, [],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.getListenTop3Songs = (idSong) => {
    return new Promise((resolve, reject) => {
        pool.query(`select listen_time::date as day, count(*) as listenofday 
            from listen
            where id_song = $1
            group by day
            order by day asc`, [idSong],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

//Xóa bản thân khỏi bài hát được tag, nếu là tác giả thì không cho xóa bản thân.
db.deleteSingerSong = (idAccount, idSong) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM singer_song WHERE id_song = $1 AND id_account = $2 ", [idSong, idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}


// Auto tăng lượt nghe
db.autoListen = (idSong, idAccount) => {
    return new Promise((resolve, reject) => {
        pool.query(`insert into listen(id_song, id_account) values ($1, $2)`, [idSong, idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

// lấy danh sách mới nhất
db.getListNewestSong = (page = 1) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT song.id_song FROM song order by id_song DESC LIMIT 20 OFFSET $1`, [(page - 1) * 20],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}


db.getListSongIdOfAccount = (id, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM Song
            WHERE id_account = $1
            order by id_song desc`, [id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
            FROM Song
            WHERE id_account = $1 order by id_song desc LIMIT 10 OFFSET $2`, [id_account, (page - 1) * 10], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

db.getListSongIdPublicOfAccount = (id, page = 0) => {
    if (page == 0) {
        return new Promise((resolve, reject) => {
            pool.query(`select SS.id_song 
            from singer_song SS inner join song S on SS.id_song = S.id_song 
            where SS.id_account = $1 and S.song_status = 0 order by S.id_song desc`, [id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`select SS.id_song 
            from singer_song SS inner join song S on SS.id_song = S.id_song 
            where SS.id_account = $1 and S.song_status = 0 order by S.id_song desc LIMIT 20 OFFSET $2`, [id_account, (page - 1) * 20], (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
        })
    }
}

db.getSongsOfFollowing = (idUser, page = 1) => {
    return new Promise((resolve, reject) => {
        pool.query(`select SS.id_song 
        from singer_song SS inner join follow_account FA on FA.id_follower = SS.id_account
        where FA.id_following = $1
        order by SS.id_song desc
        limit 20 offset $2`, [idUser, (page - 1) * 20],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

module.exports = db