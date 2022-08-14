const express = require('express')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Playlist_Song = require('../module/playlistSong')
const Playlist = require('../module/playlist')
const Account = require('../module/account')
const Song = require('../module/song')
const Album = require('../module/album')


/**
 * Thêm bài hát vào playlist
 */
router.post('/:id_playlist/song/:id_song', Auth.authenGTUser, async(req, res, next) => {
    try {
        const id_song = req.params.id_song
        const idUser = Auth.getUserID(req)
        const id_playlist = req.params.id_playlist

        const songExists = await Song.hasSong(id_song)
        if (songExists) {
            const play_list_exists = await Playlist.has(id_playlist)
            if (!play_list_exists) {
                return res.status(400).json({
                    message: 'Playlist không tồn tại'
                })
            }

            let playlist = await Playlist.getPlaylist(id_playlist)
            if (playlist.id_account !== idUser) {
                return res.status(400).json({
                    message: 'Bạn không thể thêm vào playlist của người khác'
                })
            }

            const playlist_songExists = await Playlist_Song.has(id_playlist, id_song)
            if (playlist_songExists) {
                return res.status(200).json({
                    message: 'Bạn đã thêm bài hát này vào playlist'
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

/**
 * Xóa bài hát khỏi playlist
 */
router.delete('/:id_playlist/song/:id_song', Auth.authenGTUser, async(req, res, next) => {
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

            let playlist = await Playlist.getPlaylist(id_playlist)
            if (playlist.id_account != idUser) {
                return res.status(400).json({
                    message: 'Bạn không thể sửa playlist của người khác'
                })
            }

            const playlist_songExists = await Playlist_Song.has(id_playlist, id_song)
            if (playlist_songExists) {
                await Playlist_Song.delete(id_playlist, id_song)
                return res.status(200).json({
                    message: 'Xóa bài hát ra khỏi playlist thành công'
                })
            }

            return res.status(200).json({
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

/**
 * Lấy danh sách bài hát công khai của 1 playlist công khai
 */
router.get('/:id_playlist', async(req, res, next) => {
    let page = req.query.page
    const id_playlist = req.params.id_playlist

    try {
        const playlistExist = await Playlist.has(id_playlist)
        if (!playlistExist) {
            return res.status(404).json({
                message: "Playlist không tồn tại",
            })
        }

        const playlist = await Playlist.getPlaylist(id_playlist)
        if (playlist.playlist_status != 0) {
            return res.status(403).json({
                message: "Playlist này là riêng tư",
            })
        }

        const listPlaylistSong = await Playlist_Song.listSongsOfPlaylist(id_playlist, page)
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


const getSong = async(idSong, idUser = -1) => {
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