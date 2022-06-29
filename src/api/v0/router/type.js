const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Type = require('../module/type');


/**
 * Thêm mới 1 thể loại
 * @body        name, description
 * @permisson   Chỉ admin mới được thêm thẻ mới
 * @return      201: Thêm thành công, trả về thẻ vừa được thêm
 *              400: Thiếu dữ liệu (tên thể loại), tên thể loại đã tồn tại
 */
 router.post('/', Auth.authenAdmin, async (req, res, next) => {
    try {
        let { name, description } = req.body;

        if (name) {
            let typeNameExists = await Type.hasName(name);
            if (typeNameExists) {
                return res.status(400).json({
                    message: 'Tên thể loại đã bị trùng'
                });
            }
            let result = await Type.add(name, description);

             res.status(201).json({
                message: 'Tạo mới thẻ thành công',
                data: result
            })
        } else {
            res.status(400).json({
                message: 'Thiếu tên thể loại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * update 1 thể loại
 * @body        name, description
 * @permisson   Chỉ admin mới được thêm thẻ mới
 * @return      200: update thành công, trả về thẻ vừa được update
 *              400: Thiếu dữ liệu (tên thẻ), tên thể loại đã tồn tại
 */
 router.put('/:id', Auth.authenAdmin, async (req, res, next) => {
    try {
        let id = req.params.id;
        let type = await Type.has(id);

        if(type){
            let { name, description } = req.body;

            if (name) {
                let result;
                if(name === type.name_type){
                    result = await Type.updateDescription(id, description);
                }
                else{
                    let typeNameExists = await Type.hasName(name);
                    if (typeNameExists) {
                        return res.status(400).json({
                            message: 'Tên thể loại đã bị trùng'
                        });
                    }
                    result = await Type.update(id,name, description);
                }
                return res.status(201).json({
                    message: 'Tạo mới thẻ thành công',
                    data: result
                })
            } else {
                return res.status(400).json({
                    message: 'Thiếu tên thể loại'
                })
            }
        }else {
            return res.status(400).json({
                message: 'thể loại này không tồn tại'
            })
        }

        
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
})

/**
 * xóa 1 thể loại
 * @permisson   Chỉ admin mới được thêm thẻ mới
 * @return      200: xóa thành công 1 thể loại
 *             400: thể loại không tồn tại
 */
 router.delete('/:id', Auth.authenAdmin, async (req, res, next) => {
    try {
        let id = req.params.id;
        let type = await Type.has(id);

        if(type){
            let countSongOfType = await Type.countSongOfType(id);
            if(countSongOfType > 0 ){
                return res.status(403).json({
                    message: 'Thể loại đã có bài hát nên không thể xóa'
                })
            }
            let deleteType = await Type.delete(id);
            return res.status(200).json({
                message: 'Xóa thể loại thành công'
            })
        }else {
            return res.status(400).json({
                message: 'không tìm thấy thể loại để xóa'
            })
        }

        
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
})


/**
 * Lấy tất cả thể loại
 * 
 * @permisson   mọi người
 * @return      200: Thành công, trả về danh sách các thẻ
 */
 router.get('/all', async (req, res, next) => {
    try {
        let result = await Type.getListType();

        res.status(200).json({
            message: 'Lấy danh sách thể loại thành công thành công',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


module.exports = router