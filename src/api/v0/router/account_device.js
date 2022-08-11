const express = require('express')
const router = express.Router()
const Account_Device = require('../module/account_device')
const Auth = require('../../../middleware/auth')

router.post('/token', Auth.authenGTUser, async(req, res) => {
    try {
        const id_account = Auth.getTokenData(req).id_account
        const { token } = req.body

        const exist = await Account_Device.has(id_account)

        if (!exist) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại"
            })
        }

        await Account_Device.updateAccountDeviceToken(id_account, token)
        return res.status(200).json({
            message: 'Cập nhật token thành công',
            token: token
        })
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }

})


module.exports = router