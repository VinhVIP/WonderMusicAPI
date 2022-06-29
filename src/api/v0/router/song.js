const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

var Auth = require('../../../middleware/auth');
var Type = require('../module/type');
var Song = require('../module/song');
var Album = require('../module/album');
var Account = require('../module/account')
var Listen = require('../module/listen')

var MyDrive = require('../../../../drive');
const e = require('express');
const res = require('express/lib/response');

const Comment = require('../module/comment')
const FollowAccount = require('../module/follow');
const Notification = require('../module/notification')
const sendNotification = require('../../../firebaseConfig/sendNotification')

// router.get('/test/456', (req, res, next) => {
//     const path = "https://drive.google.com/uc?export=view&id=123";
//     let pos = path.lastIndexOf('=');
//     console.log(path.substr(pos + 1));
// })
// router.post('/test/abc', (req, res, next) => {
//     //console.log(req.files);
//     //console.log(req.files.song);
//     //let drive = MyDrive.uploadSong(req.files.song,req.body.name_song);
//     let drive = MyDrive.deleteSong('123');
// })

// Thêm bài hát mới
router.post('/', Auth.authenGTUser, async (req, res, next) => {
    try {
        if (!req.files) {
            return res.status(400).json({
                message: 'Không có file được tải lên'
            });
        }

        let song = req.files.song;
        let image = req.files.img;

        // if (song.size > 20 * 1024 * 1024) {
        //     return res.status(400).json({
        //         message: "Bài hát tải lên có dung lượng lớn hơn 20MB"
        //     })
        // }

        // if (image.size > 20 * 1024 * 1024) {
        //     return res.status(400).json({
        //         message: "Ảnh tải lên có dung lượng lớn hơn 20MB"
        //     })
        // }

        if (!song) {
            return res.status(400).json({
                message: 'Không có file bài hát được tải lên'
            });
        }

        let { name_song, lyrics, description, id_album, types, accounts } = req.body;

        //let acc = await Account.selectId(Auth.tokenData(req).id_account);
        let acc = Auth.getTokenData(req).id_account;

        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }

        if (name_song && id_album && types) { //&&idaccount
            // Loại bỏ các thể loại trùng lặp (nếu có)
            // types = [...new Set(types)];

            //Loại bỏ các tài khoản bị trùng
            // accounts = [...new Set(accounts)]; // danh sach các singer

            // Kiểm tra type có hợp lệ hay không
            // for (let id_type of types) {
            //     let tagExists = await Type.has(id_type);
            //     if (!tagExists) {
            //         return res.status(404).json({
            //             message: 'Thẻ không hợp lệ'
            //         })
            //     }
            // }

            //Kiểm tra Album có tồn tại không
            let existAlbum = await Album.hasIdAlbum(req.body.id_album);
            if (!existAlbum) {
                return res.status(400).json({
                    message: 'Album không tồn tại'
                })
            }
            else {
                //upload fil song lên drive trả về id của song đó trong drive
                let idIMGDrive;
                let idSongDrive = await MyDrive.uploadSong(song, name_song);
                if (!idSongDrive) {
                    return res.status(400).json({
                        message: "Lỗi upload song"
                    })
                }
                else {
                    //upload file image
                    if (image) {
                        idIMGDrive = await MyDrive.uploadIMG(image, name_song);
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
                    let songResult = await Song.addSong(acc, songPath, imgPath, req.body);

                    let idSongInsert = songResult.id_song;

                    if (Array.isArray(accounts)) {
                        for (let id_account of accounts) {
                            await Song.addSingerSong(id_account, idSongInsert);
                            if (+id_account !== +acc) {
                                const hasToken = await Comment.hasToken(id_account)
                                const token_device = hasToken ? await Comment.getTokenDevice(id_account) : null
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
                    const data = await FollowAccount.listFollowingOf(acc)
                    const account_name = await Comment.getNameAccount(acc)
                    for (let item of data) {
                        // console.log(item.id_following)
                        const hasToken = await Comment.hasToken(item.id_following)
                        const token_device = hasToken ? await Comment.getTokenDevice(item.id_following) : null
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

// Lấy bài hát theo thể loại
router.get('/type/:id', async (req, res, next) => {
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
        }
        else {
            res.status(404).json({
                message: 'Không có bài hát nào thuộc thể loại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

//Lấy danh sách xem nhiều nhất , 100 bài
router.get('/best-list', async (req, res, next) => {
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

//Lấy danh sách mới nhất (theo trang)
router.get('/new-list', async (req, res, next) => {
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

    delete song['id_account'];
    delete song['id_album'];

    return song;
}

// Lấy thông tin bài hát theo id_song
router.get('/:id', async (req, res, next) => {
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
        }
        else {
            res.status(404).json({
                message: 'Bài hát không tồn tại',
            })
        }


    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

// Chỉnh sửa bài hát
router.put('/:id', Auth.authenGTUser, async (req, res, next) => {
    try {

        let idSong = req.params.id;

        //let acc = await Account.selectId(Auth.tokenData(req).id_account);
        let acc = await Auth.getTokenData(req).id_account; // idAcc của tài khoản đang đăng nhập
        // console.log(acc)

        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }

        let songExits = await Song.hasSong(idSong);
        if (songExits) { //&& acc === songExits.id_account

            let song = await Song.getSong(idSong);
            // console.log(songExits.id_account)

            if (acc == songExits.id_account) {

                let { name_song, lyrics, description, id_album, types, accounts } = req.body;

                let linkSong = songExits.link
                let linkImage = songExits.image_song

                let songFile;
                let imageFile;
                if (req.files && req.files.song) songFile = req.files.song
                if (req.files && req.files.img) imageFile = req.files.img


                let existAlbum = await Album.hasIdAlbum(req.body.id_album);
                if (!existAlbum) {
                    return res.status(400).json({
                        message: 'Album không tồn tại'
                    })
                }

                //accounts.push(acc);
                if (name_song && types && accounts) {
                    // 2 lệnh bên dưới là BUG
                    // types = [...new Set(types)]; // loại bỏ các type trùng nhau
                    // accounts = [...new Set(accounts)]; // loại bỏ các account trùng nhau

                    console.log(accounts)
                    // Thêm lại những tag mới
                    let t = await Song.deleteTypeSong(idSong);
                    //console.log(t);

                    if (Array.isArray(types)) {
                        for (let id_type of types) {
                            await Song.addTypeSong(idSong, id_type);
                        }
                    } else {
                        await Song.addTypeSong(idSong, types);
                    }


                    // Thêm lại những singer_song mới
                    let flag = await Song.deleteSongSingerSong(idSong);
                    //console.log(flag);

                    if (Array.isArray(accounts)) {
                        for (let id_account of accounts) {
                            await Song.addSingerSong(id_account, idSong);
                        }
                    } else {
                        await Song.addSingerSong(accounts, idSong);
                    }



                    // Nếu có file mới được tải lên thì cập nhật lại file
                    // Nếu không thì giữ nguyên file cũ
                    if (songFile) {
                        //Thêm lại file song
                        let idFileSong = await MyDrive.uploadSong(songFile, name_song);
                        linkSong = "https://drive.google.com/uc?export=view&id=" + idFileSong;
                        if (songExits.link) {
                            await MyDrive.deleteSong(await MyDrive.getImageId(songExits.link));
                        }
                    }

                    // Thêm lại file image
                    if (imageFile) {
                        let idFileImage = await MyDrive.uploadIMG(imageFile, name_song);
                        linkImage = "https://drive.google.com/uc?export=view&id=" + idFileImage;
                        if (songExits.image_song) {
                            await MyDrive.deleteIMG(await MyDrive.getImageId(songExits.image_song));
                        }
                    }


                    // Cập nhật lại bài hát
                    let result = await Song.updateSong(idSong, linkSong, linkImage, req.body);

                    res.status(201).json({
                        song: result,
                        message: 'Cập nhật bài hát thành công'
                    })
                }
                else {
                    res.status(400).json({
                        message: 'Thiếu dữ liệu'
                    })
                }
            }
            else {
                res.status(403).json({
                    message: 'Không thể sửa bài viết của người khác'
                })
            }
        }
        else {
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
router.post('/listen/:id_song', async (req, res, next) => {
    try {
        let idSong = req.params.id_song;

        let existSong = await Song.hasSong(idSong);
        if (existSong) {
            let qtyListen = (await Song.getListen(idSong)).listen;
            await Song.autoListen(idSong, qtyListen + 1);


            let d = new Date();
            let year = d.getFullYear();
            let month = d.getMonth() + 1;
            let day = d.getDate();
            let toDay = year + '-' + month + '-' + day;

            let checkSongOfToDay = await Listen.hasSongOfDay(idSong, toDay);
            if (checkSongOfToDay) {
                var listen = await Listen.getListenOfDay(idSong, toDay);
                await Listen.updateListenOfDay(idSong, toDay, listen + 1);
            }
            else {
                await Listen.createListen(idSong);
            }

            res.status(200).json({
                message: 'Tăng lượt nghe thành công'
            })
        }
        else {
            return res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


// xóa bài hát
router.delete('/deleteSong/:id', Auth.authenGTUser, async (req, res, next) => {
    try {
        //let acc = await Account.selectId(Auth.tokenData(req).id_account);
        var idAccount = Auth.getTokenData(req).id_account;

        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }
        let idSong = req.params.id;
        let songExits = await Song.hasSong(idSong);
        if (songExits) {
            let author = await Song.authorSong(idAccount, idSong);
            if (!author) {
                res.status(400).json({
                    message: 'Chỉ tác giả mới được xóa bài hát!'
                })
            }
            else {
                let song = await Song.getSong(idSong);

                if (song.link) {
                    let idFile = await MyDrive.getImageId(song.link);
                    await MyDrive.deleteSong(idFile);
                }

                if (song.image_song) {
                    let idFileimg = await MyDrive.getImageId(song.image_song);
                    await MyDrive.deleteIMG(idFileimg);
                }

                let result = await Song.deleteSong(idSong, idAccount);
                if (result) {
                    return res.status(200).json({
                        message: 'Xóa thành công'
                    })
                }
                else {
                    return res.status(400).json({
                        message: 'Xóa không thành công'
                    })
                }
            }
        }
        else {
            res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

// xóa bản thân khỏi bài hát được tag
router.delete('/deleteSinger/:id', Auth.authenGTUser, async (req, res, next) => {
    try {

        //let acc = await Account.selectId(Auth.tokenData(req).id_account);
        let acc = await Auth.getTokenData(req).id_account;

        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }

        //let author = await Song.authorSong(acc,idSong));
        let idSong = req.params.id;
        let author = await Song.authorSong(acc, idSong);
        if (!author) {
            //await Song.deleteSingerSong(acc,idSong);
            await Song.deleteSingerSong(acc, idSong);
            res.status(200).json({
                message: 'Xóa thành công'
            })
        }
        else {
            res.status(400).json({
                message: 'Tác giả không thể xóa bản thân ra khỏi bài hát'
            })
        }
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

})



module.exports = router;
