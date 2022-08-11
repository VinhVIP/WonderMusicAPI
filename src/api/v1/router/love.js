const express = require('express')
const router = express.Router()

var Account = require('../module/account')
var Song = require('../module/song')
var Love = require('../module/love')
var Album = require('../module/album')
var Auth = require('../../../middleware/auth')
const Notification = require('../module/notification')
const sendNotification = require('../../../firebaseConfig/sendNotification')

/**
 * Yêu thích bài hát
 */
router.post('/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        let idUser = Auth.getUserID(req)
        let acc = await Account.selectId(idUser)
        let idSong = req.params.id;

        let existLove = await Love.hasLove(idUser, idSong)
        if (!existLove) {
            let data = await Love.addLove(idUser, idSong)
            let song = await Song.getSong(idSong)

            const account_name_send = acc.account_name
            const id_account_song = song.id_account

            const hasToken = await Account.hasDeviceToken(id_account_song)
            const token_device = hasToken ? await Account.getAccountDevice(id_account_song) : null
            const message = {
                data: {
                    title: `Tài khoản ${account_name_send} đã yêu thích bài hát của bạn`,
                    content: "",
                    action: `love/${idSong}`
                },
                token: token_device
            }
            await Notification.addNotification(message.data.title, message.data.action, id_account_song)
            if (hasToken) {
                await sendNotification(message)
            }
            res.status(200).json({
                data: data,
                message: 'Yêu thích thành công'
            })
        } else {
            res.status(200).json({
                message: 'Đã có trong danh sách yêu thích'
            })
        }

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Bỏ yêu thích bài hát
 */
router.delete('/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        let acc = Auth.getUserID(req)
        let idSong = req.params.id

        let existLove = await Love.hasLove(acc, idSong)
        if (existLove) {
            let data = await Love.deleteLove(acc, idSong)
            res.status(200).json({
                data: data,
                message: 'Đã bỏ yêu thích'
            })
        } else {
            res.status(200).json({
                message: 'Chưa yêu thích'
            })
        }

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Lấy danh sách bài hát mà bản thân yêu thích
 */
router.get('/love-song', Auth.authenGTUser, async(req, res, next) => {
    try {
        let page = req.query.page
        if (!page || page < 1) page = 1

        let idUser = Auth.getUserID(req)

        let list = await Love.getLoveSongs(idUser, page);
        let data = []
        for (element of list) {
            let song = await getSong(element.id_song, idUser)
            data.push(song)
        }

        return res.status(200).json({
            message: 'Lấy danh sách thành công',
            data: data
        })

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


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

module.exports = router