const express = require('express')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Notification = require('../module/notification')

/**
 * Lấy số lượng thông báo chưa đọc của bản thân
 */
router.get('/count', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_account = Auth.getUserID(req)
        const count = await Notification.countUnreadNotification(id_account)

        if (count === 0) {
            return res.status(200).json({
                message: "Tài khoản của bạn không có thông báo mới",
                data: count
            })
        }

        if (count) {
            return res.status(200).json({
                message: 'Lấy số lượng thông báo chưa đọc',
                data: count,
            })
        } else {
            return res.status(400).json({
                message: 'Lỗi không lấy được thông báo'
            })
        }

    } catch (err) {
        return res.sendStatus(500)
    }
})


/**
 * Đọc tất cả thông báo
 */
router.get('/read_all', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_account = Auth.getUserID(req)
        const result = await Notification.readAllNotification(id_account)

        if (result) {
            return res.status(200).json({
                message: 'Đánh dấu đọc tất cả thông báo thành công',
            })
        } else {
            return res.status(400).json({
                message: 'Không có thông báo để đọc',
            })
        }
    } catch (err) {
        return res.sendStatus(500)
    }
})


/**
 * Lấy tất cả thông báo của bản thân
 */
router.get('/all', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_account = Auth.getUserID(req)
        const data = await Notification.listAllNotification(id_account)

        if (data) {
            return res.status(200).json({
                message: 'Danh sách thông báo thành công',
                data: data,
            })
        }
    } catch (err) {
        return res.sendStatus(500)
    }
})


/**
 * Xóa tất cả thông báo
 */
router.delete('/delete_all', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_account = Auth.getUserID(req)
        const result = await Notification.deleteAllNotification(id_account)

        if (result) {
            return res.status(200).json({
                message: 'Xóa tất cả thông báo thành công',
            })
        } else {
            return res.status(400).json({
                message: 'Không có thông báo để xóa',
            })
        }

    } catch (err) {
        return res.sendStatus(500)
    }
})


/**
 * Lấy 1 thông báo và đọc thông báo đó
 */
router.get('/:id_notification/read', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_notification = req.params.id_notification
        const notification_account = await Notification.has(id_notification)
        const id_account = Auth.getUserID(req)

        if (!notification_account) {
            return res.status(404).json({
                message: 'Thông báo không tồn tại'
            })
        } else {
            if (+notification_account.id_account !== +id_account) {
                return res.status(403).json({
                    message: 'Bạn không có quyền đọc thông báo của người khác!'
                })
            }
            await Notification.readNotification(id_notification);
            return res.status(200).json({
                message: 'Đọc thông báo thành công',
            })
        }

    } catch (err) {
        console.log(err)
        return res.sendStatus(500)
    }
})


/**
 * Xóa 1 thông báo
 */

router.delete('/:id_notification/delete', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_notification = req.params.id_notification
        const notification_account = await Notification.has(id_notification)
        const id_account = Auth.getUserID(req)

        if (!notification_account) {
            return res.status(404).json({
                message: 'Thông báo không tồn tại'
            });
        }

        if (notification_account.id_account != id_account) {
            return res.status(401).json({
                message: 'Bạn không có quyền xóa thông báo này',
            })
        } else {
            await Notification.deleteNotification(id_notification)
            return res.status(200).json({
                message: 'Xóa thông báo thành công'
            })
        }
    } catch (err) {
        return res.sendStatus(500)
    }
})

module.exports = router