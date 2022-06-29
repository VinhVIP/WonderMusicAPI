const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

var Auth = require('../../../middleware/auth');
var Type = require('../module/type');
var Song = require('../module/song');
var Album = require('../module/album');
var Account = require('../module/account')
var Listen = require('../module/listen')
const e = require('express');
const res = require('express/lib/response');

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
    // song['listenof10d'] = 0

    delete song['id_account'];
    delete song['id_album'];

    return song;
}

//Lấy danh sách bài hát có lượt nghe nhiều nhất 10 ngày gần đây
router.get('/best-new-10day', async (req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req);
        let getListen = await Listen.getListenOf10Day();
        let getAllSong = await Song.getAllSong()

        let getListenSong = getListen.map(song => song.id_song)
        getAllSong = getAllSong.map(song => song.id_song)

        const all_id_song = [...getListenSong, ...getAllSong]
        let unique_all_id_song

        unique_all_id_song = [...new Set(all_id_song)]

        let data = []
        for (let i = 0; i < unique_all_id_song.length; i++) {
            let idSong = unique_all_id_song[i];
            let song = await getSong(idSong, idAccount);
            let listenof10d

            if (i >= getListen.length) {
                listenof10d = 0
            } else {
                // song.listenof10d = +getListen[i].listen10d
                listenof10d = +getListen[i].listen10d
            }

            data.push({
                song: song,
                listenof10d: listenof10d
            })

        }

        res.status(200).json({
            message: 'Lấy danh sách thành công',
            data: data
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

//Lấy top3 trong 10 day
//Lấy danh sách bài hát có lượt nghe nhiều nhất 10 ngày gần đây
router.get('/best-new-3day', async (req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req);
        let top3 = await Listen.getListenOf3Day();


        for (let i = 0; i < top3.length; i++) {
            let idSong = top3[i].id_song;
            let song = await getSong(idSong, idAccount)
            let listentop3 = await Listen.getListen(idSong)

            for (let j = 0; j < listentop3.length; j++) {
                delete listentop3[j].id_song
            }

            top3[i].song = song
            top3[i].listen = listentop3

            delete top3[i].id_song
        }

        res.status(200).json({
            message: 'Lấy danh sách thành công',
            data: top3
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})




module.exports = router;