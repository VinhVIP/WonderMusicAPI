const express = require('express')
const router = express.Router()

var Auth = require('../../../middleware/auth')
var Type = require('../module/type')
var Song = require('../module/song')
var Album = require('../module/album')
var Account = require('../module/account')
var Listen = require('../module/listen')

var MyDrive = require('../../../../drive')
const Comment = require('../module/comment')
const FollowAccount = require('../module/follow');
const Notification = require('../module/notification')
const sendNotification = require('../../../firebaseConfig/sendNotification')


// Thêm bài hát mới
router.post('/', Auth.authenGTUser, async(req, res, next) => {
    try {
        if (!req.files) {
            return res.status(400).json({
                message: 'Không có file được tải lên'
            });
        }

        let song = req.files.song;
        let image = req.files.img;

        if (song.size > 20 * 1024 * 1024) {
            return res.status(400).json({
                message: "Kích thước bài hát không được vượt quá 20 MB"
            })
        }

        if (image.size > 5 * 1024 * 1024) {
            return res.status(400).json({
                message: "Kích thước bài hát không được vượt quá 5 MB"
            })
        }

        if (!song) {
            return res.status(400).json({
                message: 'Không có file bài hát được tải lên'
            });
        }

        let { name_song, lyrics, description, id_album, types, accounts } = req.body;

        let idUser = Auth.getUserID(req)
        let acc = await Account.selectId(idUser)

        // Tài khoản bị khóa
        if (acc.account_status != 0) {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa, không thể thêm bài'
            })
        }

        if (name_song && id_album && types) {
            // Kiểm tra type có hợp lệ hay không
            for (let id_type of types) {
                let typeExists = await Type.has(id_type);
                if (!typeExists) {
                    return res.status(404).json({
                        message: 'Thể loại không tồn tại'
                    })
                }
            }

            //Kiểm tra Album có tồn tại không
            let existAlbum = await Album.hasIdAlbum(req.body.id_album);
            if (!existAlbum) {
                return res.status(400).json({
                    message: 'Album không tồn tại'
                })
            } else {
                //upload fil song lên drive trả về id của song đó trong drive
                let idIMGDrive;
                let idSongDrive = await MyDrive.uploadSong(song, name_song);
                if (!idSongDrive) {
                    return res.status(400).json({
                        message: "Lỗi upload song"
                    })
                } else {
                    //upload file image
                    if (image) {
                        idIMGDrive = await MyDrive.uploadImage(image, name_song);
                        if (!idIMGDrive) {
                            res.status(400).json({
                                message: "Lỗi upload image"
                            })
                        }
                    }
                    //upload file song, img
                    let songPath = "https://drive.google.com/uc?export=view&id=" + idSongDrive;
                    let imgPath = "https://drive.google.com/uc?export=view&id=" + idIMGDrive;
                    // Thêm bài hát
                    let songResult = await Song.addSong(acc.id_account, songPath, imgPath, req.body);

                    let idSongInsert = songResult.id_song;

                    console.log(accounts)

                    if (Array.isArray(accounts)) {
                        for (let id_account of accounts) {
                            await Song.addSingerSong(id_account, idSongInsert);
                            if (+id_account !== acc.id_account) {
                                const hasToken = await Account.hasDeviceToken(id_account)
                                const token_device = hasToken ? await Account.getAccountDevice(id_account) : null
                                const message = {
                                    data: {
                                        title: `Bạn đã được gắn là ca sĩ cho bài hát ${name_song} mới được đăng tải lên`,
                                        content: "",
                                        action: `singer/${idSongInsert}`
                                    },
                                    token: token_device
                                }
                                await Notification.addNotification(message.data.title, message.data.action, id_account)
                                if (hasToken) {
                                    await sendNotification(message)
                                }
                            }
                        }
                    } else {
                        await Song.addSingerSong(accounts, idSongInsert);
                    }

                    // console.log(types)

                    //Thêm các liên kết type-song
                    if (Array.isArray(types)) {
                        for (let id_type of types) {
                            await Song.addTypeSong(idSongInsert, id_type);
                        }
                    } else {
                        await Song.addTypeSong(idSongInsert, types);
                    }

                    //Thông báo các tài khoản đã follow tài khoản này
                    const data = await FollowAccount.listFollowingOf(acc.id_account)
                    const account_name = acc.account_name

                    for (let item of data) {
                        // console.log(item.id_following)
                        const hasToken = await Account.hasDeviceToken(item.id_following)
                        const token_device = hasToken ? await Account.getAccountDevice(item.id_following) : null
                        const message = {
                            data: {
                                title: `Tài khoản ${account_name} mới vừa đăng tải bài hát mới có tên ${name_song}`,
                                content: "",
                                action: `newsong/${idSongInsert}`
                            },
                            token: token_device
                        }
                        await Notification.addNotification(message.data.title, message.data.action, item.id_following)
                        if (hasToken) {
                            await sendNotification(message)
                        }
                    }

                    res.status(201).json({
                        message: 'Thêm bài hát thành công',
                        data: {
                            song: songResult,
                            types: types,
                            accounts: accounts
                        }
                    })
                }
            }
        } else {
            res.status(400).json({
                message: 'Thiếu dữ liệu'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Lấy DS bài hát theo thể loại
 */
router.get('/type/:id', async(req, res, next) => {
        try {
            let page = req.query.page
            if (!page || page < 1) page = 1
            let idType = req.params.id;
            let listExits = await Song.getListSongtype(idType, page);

            if (listExits.exist) {
                let data = []
                for (element of listExits.list) {
                    let song = await getSong(element.id_song)
                    data.push(song)
                }
                res.status(200).json({
                    message: 'Lấy thành công',
                    data: data,
                })
            } else {
                res.status(404).json({
                    message: 'Không có bài hát nào thuộc thể loại'
                })
            }
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    })
    /**
     * Lấy danh sách xem nhiều nhất
     */
router.get('/best-list', async(req, res, next) => {
    try {
        let listBestSong = await Song.getBestSong();
        let data = []
        for (element of listBestSong) {
            let song = await getSong(element.id_song)
            data.push(song)
        }
        return res.status(200).json({
            data: data,
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Lấy top 100 bài hát có lượt nghe nhiều nhất trong 10 ngày gần đây
 */
router.get('/top-100', async(req, res, next) => {
    try {
        let listBestSong = await Song.getTop10Days();
        let data = []
        for (element of listBestSong) {
            let song = await getSong(element.id_song)
            data.push(song)
        }
        return res.status(200).json({
            message: "Lấy top 100 bài hát thành công",
            data: data,
        })
    } catch (error) {
        res.sendStatus(500)
    }
})

/**
 * Lấy top 3 bài hát có lượt nghe nhiều nhất trong 10 ngày gần đây
 * Chi tiết số lượt nghe theo ngày
 */
router.get('/top-3-listen', async(req, res, next) => {
    try {
        let listBestSong = await Song.getTop3Songs();
        let data = []
        for (element of listBestSong) {
            let item = {}

            item['song'] = await getSong(element.id_song)
            item['listen10d'] = element.listen10d
            item['listen'] = await Song.getListenTop3Songs(element.id_song)

            data.push(item)
        }
        return res.status(200).json({
            message: "Lấy top 3 kèm lượt nghe bài hát thành công",
            data: data,
        })
    } catch (error) {
        res.sendStatus(500)
    }
})

/**
 * Lấy danh sách mới nhất (theo trang)
 */
router.get('/new-list', async(req, res, next) => {
    try {
        let page = req.query.page
        if (!page || page < 1) page = 1
        let newestSongs = await Song.getListNewestSong(page);
        let data = []
        for (element of newestSongs) {
            let song = await getSong(element.id_song)
            data.push(song)
        }
        return res.status(200).json({
            data: data,
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})



/**
 * Lấy thông tin bài hát theo id_song
 */
router.get('/:id', async(req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req);

        let idSong = req.params.id;
        let songExits = await Song.hasSong(idSong);

        if (songExits) {
            let song = await getSong(idSong, idAccount)

            res.status(200).json({
                message: 'Lấy thông tin bài hát thành công',
                data: song
            })
        } else {
            res.status(404).json({
                message: 'Bài hát không tồn tại',
            })
        }


    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Cập nhật bài hát
 * Không cho cập nhật file bài hát
 */
router.put('/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        let idSong = req.params.id
        let idUser = Auth.getUserID(req)

        let acc = await Account.selectId(idUser)

        // Tài khoản bị khóa
        if (acc.account_status != 0) {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa, không thể cập nhật bài hát'
            })
        }

        let songExits = await Song.hasSong(idSong);
        if (songExits) {
            if (acc.id_account == songExits.id_account) {

                let { name_song, lyrics, description, id_album, types, accounts } = req.body;

                let linkSong = songExits.link
                let linkImage = songExits.image_song

                let imageFile;
                if (req.files && req.files.img) imageFile = req.files.img


                let existAlbum = await Album.hasIdAlbum(req.body.id_album);
                if (!existAlbum) {
                    return res.status(400).json({
                        message: 'Album không tồn tại'
                    })
                }

                if (name_song && types && accounts) {
                    // Xóa hết cũ, thêm mới lại từ đầu
                    await Song.deleteTypeSong(idSong);

                    if (Array.isArray(types)) {
                        for (let id_type of types) {
                            await Song.addTypeSong(idSong, id_type);
                        }
                    } else {
                        await Song.addTypeSong(idSong, types);
                    }


                    // Thêm lại những singer_song mới
                    await Song.deleteSongSingerSong(idSong);

                    if (Array.isArray(accounts)) {
                        for (let id_account of accounts) {
                            await Song.addSingerSong(id_account, idSong);
                        }
                    } else {
                        await Song.addSingerSong(accounts, idSong);
                    }



                    // Nếu có file mới được tải lên thì cập nhật lại file
                    // Nếu không thì giữ nguyên file cũ

                    // Thêm lại file image
                    if (imageFile) {
                        let idFileImage = await MyDrive.uploadImage(imageFile, name_song);
                        linkImage = "https://drive.google.com/uc?export=view&id=" + idFileImage;
                        if (songExits.image_song) {
                            await MyDrive.deleteFile(await MyDrive.getFileId(songExits.image_song));
                        }
                    }

                    // Cập nhật lại bài hát
                    let result = await Song.updateSong(idSong, linkImage, req.body);

                    res.status(201).json({
                        song: result,
                        message: 'Cập nhật bài hát thành công'
                    })
                } else {
                    res.status(400).json({
                        message: 'Thiếu dữ liệu'
                    })
                }
            } else {
                res.status(403).json({
                    message: 'Không thể sửa bài viết của người khác'
                })
            }
        } else {
            res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

// tăng listen 
router.post('/listen/:id_song', Auth.authenGTUser, async(req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req)
        let idSong = req.params.id_song;

        let existSong = await Song.hasSong(idSong);
        if (existSong) {
            await Song.autoListen(idSong, idAccount);

            res.status(200).json({
                message: 'Tăng lượt nghe thành công'
            })
        } else {
            return res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


/**
 * Xóa bài hát
 */
router.delete('/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        var idAccount = Auth.getUserID(req)
        let acc = await Account.selectId(req)

        // Tài khoản bị khóa
        if (acc.account_status != 0) {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa, không thể xóa bài hát'
            })
        }

        let idSong = req.params.id;
        let songExits = await Song.hasSong(idSong)
        if (songExits) {
            let author = await Song.authorSong(idAccount, idSong)
            if (!author) {
                res.status(400).json({
                    message: 'Chỉ tác giả mới được xóa bài hát!'
                })
            } else {
                let song = await Song.getSong(idSong);

                if (song.link) {
                    let idFile = await MyDrive.getFileId(song.link)
                    await MyDrive.deleteSong(idFile);
                }

                if (song.image_song) {
                    let idFileimg = await MyDrive.getFileId(song.image_song)
                    await MyDrive.deleteFile(idFileimg)
                }

                let result = await Song.deleteSong(idSong, idAccount);
                if (result) {
                    return res.status(200).json({
                        message: 'Xóa thành công'
                    })
                }
            }
        } else {
            res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


/**
 * Xóa bản thân ra khỏi danh sách ca sĩ
 */
router.delete('/deleteSinger/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        let idUser = Auth.getUserID(req)
        let acc = await Account.selectId(idUser)

        // Tài khoản bị khóa
        if (acc.account_status != 0) {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa, không thể thực hiện thao tác này'
            })
        }

        let idSong = req.params.id;
        let author = await Song.authorSong(idUser, idSong)
        if (author) {
            return res.status(400).json({
                message: 'Tác giả không thể xóa bản thân ra khỏi bài hát'
            })
        }

        let isSinger = await Song.singerOfSong(acc, idSong);
        if (isSinger) {
            await Song.deleteSingerSong(idUser, idSong);
            return res.status(200).json({
                message: 'Xóa bản thân khỏi danh sách thể hiện thành công'
            })
        } else {
            res.status(400).json({
                message: 'Bạn không nằm trong danh sách thể hiện của bài hát'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

})



async function getSong(idSong, idUser = -1) {
    let song = await Song.getSong(idSong, idUser);

    let album = await Album.hasIdAlbum(song.id_album);
    let singers = await Song.getSingerSong(idSong);
    let types = await Song.getTypes(idSong);

    let singerSong = [];
    for (let i = 0; i < singers.length; i++) {
        let listSinger = await Account.selectId(singers[i].id_account);
        singerSong.push(listSinger);
    }

    album['account'] = await Account.selectId(album.id_account);
    delete album['id_account'];

    song['account'] = await Account.selectId(song.id_account);
    song['album'] = album;
    song['singers'] = singerSong;
    song['types'] = types;

    song['listen'] = await Song.getTotalListenOfSong(song.id_song)

    delete song['id_account'];
    delete song['id_album'];

    return song;
}
module.exports = router