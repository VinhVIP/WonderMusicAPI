const pool = require('../../../database');

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
        WHERE A.id_account = $1`,
            [idAccount, idUser],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.selectIdLite = (idAccount) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT A.id_account, A.account_name, A.avatar, A.email, A.create_date, A.account_status, A.role
        FROM account A
        WHERE A.id_account = $1`,
            [idAccount],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.selectPasswordByEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT password FROM account WHERE email = $1',
            [email],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].password);
            })
    })
}

db.selectByEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM account WHERE email = $1',
            [email],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.hasEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM account WHERE email = $1",
            [email],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            })
    })
}

db.selectAllId = (page = 0) => {
    if (page === 0) {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account from account order by id_account desc`,
                [],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account from account order by id_account desc LIMIT 10 OFFSET $1`,
                [(page - 1) * 10],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    }

}


db.selectAllByAccount = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`select a.id_account, a.account_name, a.email, a.avatar, a.account_status,a.role
                (select count(*) from follow_account fa where fa.id_follower=a.id_account) as num_followers, 
                (select count(*) from song s where s.id_account = a.id_account and p.status=0) as num_posts,
                (select count(*) from love l inner join song s on l.id_song = s.id_song where a.id_account = s.id_account  ) as num_loves,
                (select count(*) > 0 from follow_account fa where fa.id_follower=a.id_account and fa.id_following = $1) as status
            from account a 
            order by a.id_account asc`,
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    });
}

db.getSearch = (search, page = 0) => {
    if (page === 0) {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account
                from account
                where lower(account_name) like $1 order by id_account desc`,
                ['%' + search + '%'],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    } else {
        return new Promise((resolve, reject) => {
            pool.query(`select id_account
                from account
                where lower(account_name) like $1 order by id_account desc LIMIT 10 OFFSET $2`,
                ['%' + search + '%', (page - 1) * 10],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows);
                })
        });
    }
}

db.selectAvatar = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT avatar FROM account WHERE id_account = $1`,
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].avatar);
            })
    });
}

// db.updateVerification = (id, verification) => {
//     return new Promise((resolve, reject) => {
//         pool.query('UPDATE account SET verification = $1 WHERE id_account = $2',
//             [verification, id],
//             (err, result) => {
//                 if (err) return reject(err);
//                 return resolve(result.rowCount);
//             })
//     })
// }

db.selectRole = (id) => {
    return new Promise((resolve, reject) => {
        pool.query(`select A.role from 
            account as A
            where A.id_account=$1`,
            [id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.selectName = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT account_name FROM account WHERE id_account = $1',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].real_name);
            })
    })
}

db.add = (account) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO account (account_name, email, password, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id_account",
            [account.account_name, account.email, account.password, account.role, account.avatar],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].id_account);
            });
    });
}

db.update = (id, account_name, avatar = '') => {
    if (avatar == '') {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE account SET account_name=$1 WHERE id_account=$2 RETURNING *",
                [account_name, id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows[0]);
                });
        })
    } else {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE account SET account_name=$1, avatar=$2 WHERE id_account=$3 RETURNING *",
                [account_name, avatar, id],
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result.rows[0]);
                });
        })
    }
}

db.updateAvatar = (id, avatar) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET avatar=$1 WHERE id_account=$2 ",
            [avatar, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.updateAvatarDefault = (old_image, new_image) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET avatar=$1 WHERE avatar=$2 ",
            [new_image, old_image],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.updateRole = (id, id_chucvu) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET role=$1 WHERE id_account=$2 RETURNING *",
            [id_chucvu, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.updateStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET account_status=$1 WHERE id_account=$2 RETURNING *",
            [status, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.updatePassword = (id, password) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE account SET password=$1 WHERE id_account=$2",
            [password, id],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}

db.countAdmin = () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id_account FROM account WHERE role = 0',
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount);
            });
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
                order by follower desc`,
            [idUser],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            })
    });
}

db.hasEmailAccount = (email) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id_account, account_name FROM account WHERE email = $1',
            [email],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            });
    })
}
db.insertVerification = (id_account, code) => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO verification (id_account, code) values ($1,$2)',
            [id_account, code],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            });
    })
}

db.updateVerification = (id_account, code) => {
    return new Promise((resolve, reject) => {
        pool.query(`UPDATE verification SET code=$1, create_time = timezone('Asia/Ho_Chi_Minh'::text, now()) WHERE id_account=$2`,
            [code, id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows);
            });
    })
}

db.isHasIdVerification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id_account FROM verification WHERE id_account = $1',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            });
    })
}
db.isHasCodeAndEmail = (id_account, code) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id_account FROM verification WHERE id_account = $1 AND code = $2',
            [id_account, code],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount > 0);
            });
    })
}
db.checkTimeCode = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT create_time + interval '${30}' minute >= timezone('Asia/Ho_Chi_Minh'::text, now()) AS valid FROM verification WHERE id_account = $1 ORDER BY create_time DESC LIMIT 1`,
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0].valid);
            });
    })
}

db.deleteAccountVerification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM verification WHERE id_account = $1',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(1);
            })
    })
}
module.exports = db