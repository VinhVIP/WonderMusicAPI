const express = require('express')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Playlist = require('../module/playlist')
const Album = require('../module/album')
const Account = require('../module/account')
const Song = require('../module/song')
const PlaylistSong = require('../module/playlistSong')

router.get('/top', async(req, res, next) => {
    try {
        const listPlaylist = await PlaylistSong.listPlaylistTotalListenSong()
        let songId
        let data = []

        for (let i = 0; i < listPlaylist.length; i++) {
            let song = []
            songId = await PlaylistSong.listPlaylistSong(listPlaylist[i].id_playlist)
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

/**
 * Thêm playlist
 */
router.post('/', Auth.authenGTUser, async(req, res, next) => {
    try {
        const { name_playlist, playlist_status } = req.body
        const id_account = Auth.getUserID(req)

        if (name_playlist) {
            const playList = await Playlist.add(name_playlist, id_account, playlist_status)
            return res.status(201).json({
                message: 'Tạo playlist thành công',
                data: playList
            })
        } else {
            return res.status(400).json({
                message: 'Thiếu tên playlsit'
            })
        }
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

/**
 * Cập nhật playlist
 */
router.put('/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        let idUser = Auth.getUserID(req)
        const id = req.params.id
        const { name_playlist, playlist_status } = req.body

        if (!name_playlist) {
            return res.status(400).json({
                message: 'Tên playlist không được bỏ trông'
            })
        }

        if (!playlist_status) {
            return res.status(400).json({
                message: 'Trạng thái playlist không được bỏ trông'
            })
        }

        let exists = await Playlist.has(id)
        if (exists) {
            let playlist = await Playlist.getPlaylist(id)
            if (playlist.id_account == idUser) {
                const updated = await Playlist.update(id, req.body)

                return res.status(200).json({
                    message: 'Cập nhật playlist thành công',
                    data: updated
                })
            } else {
                return res.status(404).json({
                    message: 'Bạn không thể sửa playlist của người khác'
                })
            }
        } else {
            return res.status(404).json({
                message: 'Playlist không tồn tại'
            })
        }

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

/**
 * Xóa playlist
 */
router.delete('/:id', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id = req.params.id
        let idUser = Auth.getUserID(req)
        const playlistExists = await Playlist.has(id)

        if (playlistExists) {
            let playlist = await Playlist.getPlaylist(id)
            if (playlist.id_account == idUser) {
                const countSongOfPlaylist = await Playlist.countSongOfPlaylist(id)
                if (countSongOfPlaylist > 0) {
                    return res.status(403).json({
                        message: 'Playlist đã có bài hát không thể xóa'
                    })
                }

                await Playlist.delete(id)
                return res.status(200).json({
                    message: 'Xóa playlist thành công'
                })
            } else {
                return res.status(404).json({
                    message: 'Bạn không thể xóa playlist của người khác'
                })
            }

        } else {
            return res.status(404).json({
                message: 'Không tìm thấy playlist để xóa'
            })
        }
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

/**
 * Lấy danh sách playlist của bản thân
 */
router.get('/', Auth.authenGTUser, async(req, res, next) => {
    try {
        let page = req.query.page
        const id_account = Auth.getUserID(req)
        const listPlaylist = await Playlist.listPlaylistAccount(id_account, page)
        let acc = await Account.selectId(id_account);

        let data = [];
        for (let i = 0; i < listPlaylist.length; i++) {
            let playList = await Playlist.getPlaylist(listPlaylist[i].id_playlist);
            let songs = await PlaylistSong.listSongsOfPlaylist(playList.id_playlist);

            let songList = [];
            for (let j = 0; j < songs.length; j++) {
                let song = await getSong(songs[j].id_song, id_account);
                songList.push(song);;

            }
            playList['songs'] = songList;
            playList['account'] = acc;
            data.push(playList);
        }
        res.status(200).json({
            message: 'Lấy danh sách các playlist thành công',
            data: data
        })
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
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

module.exports = router