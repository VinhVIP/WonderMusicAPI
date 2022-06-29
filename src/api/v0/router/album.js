const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const e = require('express');
const res = require('express/lib/response');
var Album = require('../module/album');
var Auth = require('../../../middleware/auth');
var Song = require('../module/song');
var Account = require('../module/account');

//Tạo Album
router.post('/', Auth.authenGTUser, async (req, res, next) => {
    try {
        let nameAlbum = req.body.name_album;
        console.log(nameAlbum);
        //let acc = await Account.selectId(Auth.tokenData(req).id_account);
        let acc = await Auth.getTokenData(req).id_account

        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }

        if (nameAlbum) {
            let existAlbum = await Album.hasNameAlbum(nameAlbum);
            if (!existAlbum) {
                let album = await Album.createAlbum(nameAlbum, acc);
                res.status(200).json({
                    message: 'Thêm mới album thành công',
                    data: album
                })
            }
            else {
                res.status(400).json({
                    message: 'Tên album đã tồn tại'
                })
            }
        }
        else {
            res.status(400).json({
                message: 'Thiếu dữ liệu'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

//Sửa Album
router.put('/edit/:id_album', Auth.authenGTUser, async (req, res, next) => {
    try {
        let acc = await Auth.getTokenData(req).id_account;
        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }

        let idAlbum = req.params.id_album;

        // Kiểm tra id có tồn tại không
        let existAlbum = await Album.hasIdAlbum(idAlbum);
        if (existAlbum) {
            if (existAlbum.id_account == acc) {
                let nameAlbum = req.body.name_album;

                // Kiểm tra tên album đã tồn tại chưa
                let existName = await Album.hasNameAlbum(nameAlbum);
                //console.log(existName)
                if (!existName) {
                    let result = await Album.updateAlbum(idAlbum, nameAlbum);

                    res.status(200).json({
                        message: 'Chỉnh sửa thành công',
                        data: result
                    })
                }
                else {
                    res.status(400).json({
                        message: 'Tên Album đã tồn tại'
                    })
                }
            }
            else {
                res.status(403).json({
                    message: 'Bạn không có quyền chỉnh sửa'
                })
            }
        }
        else {
            res.status(404).json({
                message: 'Album này không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

//Xóa Album
router.delete('/delete/:id_album', Auth.authenGTUser, async (req, res, next) => {
    try {
        let acc = await Auth.getTokenData(req).id_account;
        let idAlbum = req.params.id_album;

        // Tài khoản bị khóa
        // if (acc.account_status != 0) {
        //     return res.status(403).json({
        //         message: 'Tài khoản đã bị khóa, không thể thêm bài'
        //     })
        // }

        let existAlbum = await Album.hasIdAlbum(idAlbum);
        if (existAlbum) {

            let existSong = await Album.hasSongInAlbum(idAlbum);
            if (!existSong) {
                if (existAlbum.id_account == acc) {
                    await Album.deleteAlbum(idAlbum);
                    res.status(200).json({
                        message: 'Xóa Album thành công'
                    })
                }
                else {
                    res.status(400).json({
                        message: 'Bạn không thể xóa album của người khác'
                    })
                }
            }
            else {
                res.status(400).json({
                    message: 'Album còn bài hát, không thể xóa!'
                })
            }

        }
        else {
            res.status(400).json({
                message: 'Album không tồn tại'
            })
        }

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

//Chuyển bài hát qua album khác
router.patch('/move/:id_album/song/:id_song', Auth.authenGTUser, async (req, res, next) => {
    try {
        let acc = await Auth.getTokenData(req).id_account;
        let idAlbum = req.params.id_album;
        let idSong = req.params.id_song;

        let existAlbum = await Album.hasIdAlbum(idAlbum);
        if (existAlbum) {
            let existSong = await Song.hasSong(idSong);
            if (existSong) {
                if (existSong.id_account == acc && existAlbum.id_account == acc) {
                    await Album.moveSongToAlbum(idAlbum, idSong);
                    return res.status(200).json({
                        message: 'Chuyển thành công'
                    })
                }
                else {
                    return res.status(400).json({
                        message: 'Không có quyền tác giả'
                    })
                }
            }
            else {
                res.status(404).json({
                    message: 'Bài hát không tồn tại'
                })
            }
        }
        else {
            res.status(404).json({
                message: 'Album không tồn tại'
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

    delete song['id_account'];
    delete song['id_album'];

    return song;
}

router.get('/list', Auth.authenGTUser, async (req, res, next) => {
    try {
        let accId = await Auth.getTokenData(req).id_account;

        let albums = await Album.getListAlbum(accId);
        for (let i = 0; i < albums.length; i++) {
            let totalSong = await Album.countSongOfAlbum(albums[i].id_album)
            albums[i].total_song = parseInt(totalSong.cnt)
        }

        return res.status(200).json({
            message: 'Lấy danh sách thành công',
            data: albums
        })
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
})

router.get('/all', Auth.authenGTUser, async (req, res, next) => {
    try {
        let accId = await Auth.getTokenData(req).id_account;
        let account = await Account.selectId(accId)

        let albums = await Album.getListAlbum(accId);
        for (let i = 0; i < albums.length; i++) {
            let songsId = await Album.getAllSongsOfAlbum(albums[i].id_album)
            let songs = []
            for (songElement of songsId) {
                let song = await getSong(songElement.id_song)
                songs.push(song)
            }
            albums[i].account = account
            albums[i].songs = songs
        }

        return res.status(200).json({
            message: 'Lấy danh sách album thành công',
            data: albums
        })
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
})

router.get('/:id/songs', async (req, res, next) => {
    try {
        let idAlbum = req.params.id

        let exists = await Album.has(idAlbum)
        if (!exists) {
            return res.status(404).json({
                message: 'Album không tồn tại'
            })
        }

        let idUser = Auth.getUserID(req)
        let album = await Album.selectId(idAlbum)
        let idAccount = album.id_account

        let songsId
        if (idUser === idAccount) {
            // Nếu là chủ sở hữu album thì hiển thị tất cả bài hát (kể cả ẩn)
            songsId = await Album.getAllSongsOfAlbum(idAlbum)
        } else {
            // Chỉ hiện các bài hát công khai
            songsId = await Album.getPublicSongsOfAlbum(idAlbum)
        }


        let songs = []
        for (element of songsId) {
            let song = await getSong(element.id_song, idUser)
            songs.push(song)
        }

        return res.status(200).json({
            message: 'Lấy danh sách thành công',
            data: songs
        })
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
})


module.exports = router;