const express = require('express')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Search = require('../module/search')
const jwt = require('jsonwebtoken')
const Account = require('../module/account')
const Song = require('../module/song')
const Album = require('../module/album')
const Playlist_Song = require('../module/playlistSong')

const getSong = async (idSong, idUser = -1) => {
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

router.get('/', async (req, res, next) => {
    try {
        let { k } = req.query

        if (!k || k.trim().length == 0) {
            return res.status(400).json({
                message: "Chưa có từ khóa tìm kiếm"
            })
        }

        k = k.toLowerCase()

        let idUser = Auth.getUserID(req)

        if (idUser) {
            const list_id_song = await Search.getSearchSong(k)
            const listPlaylist = await Search.getSearchNamePlaylist(k)
            const list_id_account = await Search.getSearchNameAccount(k)

            let account = []
            let song = []

            let playListSongAccount = [];

            for (let i = 0; i < listPlaylist.length; i++) {
                let song = []
                songId = await Playlist_Song.listPlaylistSong(listPlaylist[i].id_playlist)
                const acc = await Account.selectId(listPlaylist[i].id_account);

                for (let i = 0; i < songId.length; i++) {
                    song.push(await getSong(songId[i].id_song))
                }

                playListSongAccount.push({
                    id_playlist: listPlaylist[i].id_playlist,
                    name_playlist: listPlaylist[i].name_playlist,
                    playlist_status: listPlaylist[i].playlist_status,
                    account: acc,
                    songs: song
                })
            }

            for (let i = 0; i < list_id_song.length; i++) {
                song.push(await getSong(list_id_song[i].id_song, idUser))
            }

            for (let i = 0; i < list_id_account.length; i++) {
                account.push(await Account.selectId(list_id_account[i].id_account))
            }

            const data = {
                songs: song,
                playLists: playListSongAccount,
                accounts: account
            }

            return res.status(200).json({
                message: 'Kết quả tìm kiếm',
                data: data
            })

        } else {
            const list_id_song = await Search.getSearchSong(k)
            const list_id_account = await Search.getSearchNameAccount(k)

            let account = []
            let song = []

            for (let i = 0; i < list_id_song.length; i++) {
                song.push(await getSong(list_id_song[i].id_song))
            }

            for (let i = 0; i < list_id_account.length; i++) {
                account.push(await Account.selectId(list_id_account[i].id_account))
            }

            const data = {
                song: song,
                account: account
            }

            return res.status(200).json({
                message: 'Kết quả tìm kiếm',
                data: data
            })
        }


    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


module.exports = router