const express = require('express')
const router = express.Router()
const Account_Device = require('../module/account_device')
const Auth = require('../../../middleware/auth')

router.post('/token', Auth.authenGTUser, async (req, res) => {
    try {
        const id_account = Auth.getTokenData(req).id_account
        const { token } = req.body

        const exist = await Account_Device.has(id_account)

        if (!exist) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại"
            })
        }

        const id_account_device_exist = await Account_Device.hasIdAccountDevice(id_account)

        if (id_account_device_exist) {
            const tokenNotification = await Account_Device.updateTokenAccountDevice(id_account, token)

            if (tokenNotification) {
                return res.status(200).json({
                    message: 'Cập nhật token thành công',
                    token: token
                })
            }

        } else {
            const tokenNotification = await Account_Device.addTokenAccountDevice(id_account, token)

            if (tokenNotification) {
                return res.status(201).json({
                    message: 'Thêm token thành công',
                    token: token
                })
            }
        }

        return res.status(404).json({
            message: 'Lỗi token'
        })
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }

})


module.exports = router