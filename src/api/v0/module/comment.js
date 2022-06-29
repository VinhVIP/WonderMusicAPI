const pool = require('../../../database')

const db = {}

db.addCommentParent = (id_account, id_song, content) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO comment (id_account, id_song, content) VALUES ($1, $2, $3) RETURNING *, TO_CHAR(date_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(date_time:: time, 'hh24:mi') AS time ",
            [id_account, id_song, content],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.has = (id_cmt) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_song FROM comment WHERE id_cmt = $1",
            [id_cmt],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            });
    })
}

db.hasIdAccount = (id_cmt) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_account FROM comment WHERE id_cmt = $1",
            [id_cmt],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].id_account)
            });
    })
}

db.addCommentChildren = (id_account, id_song, content, id_cmt_parent) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO comment (id_account, id_song, content, id_cmt_parent) VALUES ($1, $2, $3, $4) RETURNING *",
            [id_account, id_song, content, id_cmt_parent],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            });
    });
}

db.selectAccountComment = (id_cmt) => {
    return new Promise((resolve, reject) => {
        pool.query("select id_account from comment where id_cmt = $1",
            [id_cmt],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].id_account);
            });
    })
}

db.updateComment = (id_cmt, content) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE comment SET content = $1 where id_cmt = $2 RETURNING *",
            [content, id_cmt],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.delete = (id_cmt) => {
    return new Promise((resolve, reject) => {
        pool.query("DELETE FROM comment WHERE id_cmt IN (SELECT id_cmt FROM comment WHERE id_cmt_parent = $1) OR id_cmt = $1",
            [id_cmt],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.listCommentParent = (id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_cmt, id_account, content, TO_CHAR(date_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(date_time:: time, 'hh24:mi') AS time FROM comment WHERE id_song = $1 and id_cmt_parent = 0 ORDER BY date_time DESC",
            [id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

// db.listCommentParent = (id_song) => {
//     return new Promise((resolve, reject) => {
//         pool.query("SELECT id_cmt, content, TO_CHAR(date_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(date_time:: time, 'hh24:mi') AS time FROM comment WHERE id_song = $1 and id_cmt_parent = 0 ORDER BY date_time",
//             [id_song],
//             (err, result) => {
//                 if (err) return reject(err);
//                 return resolve(result.rows);
//             })
//     })
// }

db.listCommentChildren = (id_cmt, id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_cmt, id_account, content, TO_CHAR(date_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(date_time:: time, 'hh24:mi') AS time  FROM comment WHERE id_cmt_parent = $1 and id_song = $2 ORDER BY date_time DESC",
            [id_cmt, id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}

db.getNameAccount = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT account_name FROM account WHERE id_account = $1",
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].account_name);
            })
    })
}

db.getTokenDevice = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT device_token FROM account_device WHERE id_account = $1",
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].device_token);
            })
    })
}

db.hasToken = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT device_token FROM account_device WHERE id_account = $1",
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.getIdAccountSong = (id_song) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_account FROM song WHERE id_song = $1",
            [id_song],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].id_account);
            })
    })
}

db.getComment = (id_cmt) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM comment WHERE id_cmt = $1",
            [id_cmt],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}


db.getListCommentChildren = (id_cmt_parent) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id_cmt, id_account, content, TO_CHAR(date_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(date_time:: time, 'hh24:mi') AS time  FROM comment WHERE id_cmt_parent = $1",
            [id_cmt_parent],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    })
}
module.exports = db


