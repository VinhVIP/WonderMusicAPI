const pool = require('../../../database');

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

db.selectId = (idAccount, idUser = -1) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT A.id_account, A.account_name, A.avatar, A.email, A.create_date, A.account_status, A.role,
        (select count(*) from follow_account FA where id_follower = $1) as follower,
        (select count(*) from follow_account FA where id_following = $1) as following,
        (select exists(select * from follow_account where id_follower = $1 and id_following = $2)) as follow_status,
        (select count(*) as total_song from singer_song where id_account = $1),
        (select sum(CL.count_love_song) as total_love
            from (select count(L.id_song) as count_love_song
                from love L, song S
                where L.id_song = S.id_song and S.id_account = $1
                group by S.id_song ) as CL)
        FROM account A
        WHERE A.id_account = $1`, [idAccount, idUser],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}


db.selectRole = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT role from account where id_account=$1", [id], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0].role);
        })
    })
}

db.selectName = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT account_name from account where id_account=$1", [id], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0].account_name);
        })
    })
}

db.selectByEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM account WHERE email = $1', [email],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.hasEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM account WHERE email = $1", [email],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.selectAllId = (page = 0) => {
    if (page === 0) {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account from account order by id_account desc`, [],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account from account order by id_account desc LIMIT 10 OFFSET $1`, [(page - 1) * 10],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    }

}

db.getSearch = (search, page = 0) => {
    if (page === 0) {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account
                from account
                where lower(account_name) like $1 order by id_account desc`, ['%' + search + '%'],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account
                from account
                where lower(account_name) like $1 order by id_account desc LIMIT 10 OFFSET $2`, ['%' + search + '%', (page - 1) * 10],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    }
}

db.add = (account) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO account (account_name, email, password, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id_account", [account.account_name, account.email, account.password, account.role, account.avatar],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].id_account);
            });
    });
}

db.update = (id, account_name, avatar = '') => {
    if (avatar == '') {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE account SET account_name=$1 WHERE id_account=$2 RETURNING *", [account_name, id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows[0]);
                });
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE account SET account_name=$1, avatar=$2 WHERE id_account=$3 RETURNING *", [account_name, avatar, id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows[0]);
                });
        })
    }
}


db.updateAvatar = (id, avatar) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET avatar=$1 WHERE id_account=$2 ", [avatar, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}


db.updateRole = (id, id_chucvu) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET role=$1 WHERE id_account=$2 RETURNING *", [id_chucvu, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}


db.updateStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET account_status=$1 WHERE id_account=$2 RETURNING *", [status, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.updatePassword = (id, password) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET password=$1 WHERE id_account=$2", [password, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.getListAccountHot = (idUser = -1) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT A.id_account, A.account_name, A.avatar, A.email, A.create_date, A.account_status, A.role,
                (select count(*) from follow_account FA where id_follower = A.id_account) as follower,
                (select count(*) from follow_account FA where id_following = A.id_account) as following,
                (select exists(select * from follow_account where id_follower = A.id_account and id_following = $1)) as follow_status,
                (select sum(CL.count_love_song) as total_love
                    from (select count(L.id_song) as count_love_song
                        from love L, song S
                        where L.id_song = S.id_song and S.id_account = A.id_account
                        group by S.id_song ) as CL)
                FROM account A
                order by follower desc`, [idUser],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    });
}

db.getAccountDevice = (id) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT account_device FROM account WHERE id_account=$1", [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].account_device)
            })
    })
}

db.updateAccountDeviceToken = (id_account, token) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET account_device = $1 where id_account = $2", [token, id_account], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rows[0])
        })
    })
}

db.hasDeviceToken = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT account_device FROM account WHERE id_account=$1", [id_account], (err, result) => {
            if (err) return reject(err);
            return resolve(result.rowCount > 0 && result.rows[0].account_device != null && result.rows[0].account_device != '')
        })
    })
}

module.exports = db