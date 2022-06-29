const pool = require('../../../database')

const db = {}

db.countUnreadNotification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('select id_notification from notification where id_account=$1 and notification_status=0',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rowCount);
            });
    });
}

db.listNotification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT *
        FROM notification 
        WHERE id_account = $1 and notification_status=0
        ORDER BY id_notification desc`,
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows)
            })
    })
}

db.listAllNotification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT id_notification, id_account, content, action, notification_status, TO_CHAR(notification_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(notification_time:: time, 'hh24:mi') AS time FROM notification
        WHERE id_account = $1
        ORDER BY id_notification desc`,
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows)
            })
    })
}

db.has = (id_notification) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT id_notification, id_account, content, action, notification_status, TO_CHAR(notification_time:: date, 'dd/mm/yyyy') AS day, TO_CHAR(notification_time:: time, 'hh24:mi') AS time  FROM notification WHERE id_notification = $1`,
            [id_notification],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.readNotification = (id_notification) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE notification SET notification_status = 1 WHERE id_notification = $1',
            [id_notification],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.deleteNotification = (id_notification) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM notification WHERE id_notification = $1',
            [id_notification],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            })
    })
}


db.readAllNotification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE notification SET notification_status = 1 WHERE id_account = $1',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result)
            })
    })
}

db.deleteAllNotification = (id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM notification WHERE id_account = $1',
            [id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0])
            })
    })
}

db.addNotification = (content, action, id_account) => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO notification (content, action, id_account) VALUES ($1, $2, $3) returning *',
            [content, action, id_account],
            (err, result) => {
                if (err) return reject(err);
                return resolve(result.rows[0]);
            });
    });
}
module.exports = db