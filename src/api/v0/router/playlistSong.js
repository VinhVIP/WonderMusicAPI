const express = require('express')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Playlist_Song = require('../module/playlistSong')
const Playlist = require('../module/playList')
const Account = require('../module/account')
const Song = require('../module/song')
const Album = require('../module/album')

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

router.post('/:id_playlist/song/:id_song', Auth.authenGTUser, async (req, res, next) => {
    try {
        const id_song = req.params.id_song
        const id_playlist = req.params.id_playlist

        const songExists = await Playlist_Song.hasSong(id_song)
        if (songExists) {
            const playlist_songExists = await Playlist_Song.has(id_playlist, id_song)
            const play_list_exists = await Playlist.has(id_playlist)
            if (playlist_songExists) {
                return res.status(400).json({
                    message: 'Bạn đã thêm bài hát này vào playlist'
                })
            }

            if (!play_list_exists) {
                return res.status(400).json({
                    message: 'PlayList không tồn tại'
                })
            }

            await Playlist_Song.add(id_playlist, id_song)
            return res.status(200).json({
                message: 'Thêm vào playlist thành công'
            })
        } else {
            return res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})


router.delete('/:id_playlist/song/:id_song', Auth.authenGTUser, async (req, res, next) => {
    try {
        const id_song = req.params.id_song
        const id_playlist = req.params.id_playlist

        const songExists = await Playlist_Song.hasSong(id_song)
        if (songExists) {
            const play_list_exists = await Playlist.has(id_playlist)

            if (!play_list_exists) {
                return res.status(400).json({
                    message: 'PlayList không tồn tại'
                })
            }

            const playlist_songExists = await Playlist_Song.has(id_playlist, id_song)
            if (playlist_songExists) {
                await Playlist_Song.delete(id_playlist, id_song)
                return res.status(200).json({
                    message: 'Xóa bài hát ra khỏi playlist thành công'
                })
            }

            return res.status(400).json({
                message: 'Bài hát này chưa thêm vào playlist'
            })
        } else {
            return res.status(404).json({
                message: 'Bài hát không tồn tại'
            })
        }
    } catch (error) {
        console.log(error)
        return res.sendStatus(500)
    }
})

router.get('/prominent', async (req, res, next) => {
    try {
        const listPlaylist = await Playlist_Song.listPlaylistTotalListenSong()
        let songId
        let data = []

        for (let i = 0; i < listPlaylist.length; i++) {
            let song = []
            songId = await Playlist_Song.listPlaylistSong(listPlaylist[i].id_playlist)
            const acc = await Account.selectId(listPlaylist[i].id_account);

            for (let i = 0; i < songId.length; i++) {
                song.push(await getSong(songId[i].id_song))
            }

            data.push({
                id_playlist: listPlaylist[i].id_playlist,
                name_playlist: listPlaylist[i].name_playlist,
                playlist_status: listPlaylist[i].playlist_status,
                total_listen: +listPlaylist[i].total_listen,
                account: acc,
                songs: song
            })
        }
        return res.status(200).json({
            message: 'Lấy danh sách 10 playlist nổi bật có tổng lượt nghe các bài hát cao nhất thành công',
            data: data
        })

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
router.get('/:id_playlist', async (req, res, next) => {
    let page = req.query.page
    // const id_account = Auth.getTokenData(req).id_account
    const id_playlist = req.params.id_playlist

    try {
        const listPlaylistSong = await Playlist_Song.listPlaylistSong(id_playlist, page)
        const playlistExist = await Playlist_Song.hasStatusPlaylist(id_playlist)
        const playlist = await Playlist.getPlaylist(id_playlist)

        if (playlistExist) {
            return res.status(400).json({
                message: "Playlist chưa công khai",
            })
        }

        let song = []

        for (let i = 0; i < listPlaylistSong.length; i++) {
            song.push(await getSong(listPlaylistSong[i].id_song))
        }

        return res.status(200).json({
            message: "Lấy danh sách bài hát công khai trong 1 playlist công khai thành công",
            data: {
                id_playlist: playlist.id_playlist,
                name_playlist: playlist.name_playlist,
                playlist_status: playlist.playlist_status,
                song: song
            }
        })
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.get('/', Auth.authenGTUser, async (req, res, next) => {
    try {
        const page = req.query.page
        const id_account = Auth.getTokenData(req).id_account
        const listPlaylist = await Playlist.findId_playlist(id_account)
        let songId
        let data = []
        const account = await Account.selectId(id_account)

        for (let i = 0; i < listPlaylist.length; i++) {
            let song = []
            songId = await Playlist_Song.listPlaylistSong(listPlaylist[i].id_playlist, page)


            for (let i = 0; i < songId.length; i++) {
                song.push(await getSong(songId[i].id_song, id_account))
            }

            data.push({
                id_playlist: listPlaylist[i].id_playlist,
                name_playlist: listPlaylist[i].name_playlist,
                playlist_status: listPlaylist[i].playlist_status,
                song: song
            })
        }
        return res.status(200).json({
            message: 'Lấy danh sách playlist thành công',
            data: data,
            account: account
        })

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
module.exports = router