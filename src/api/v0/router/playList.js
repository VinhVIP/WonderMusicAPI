const express = require('express')
const router = express.Router()
const Auth = require('../../../middleware/auth')
const Playlist = require('../module/playList')
const jwt = require('jsonwebtoken')
const Album = require('../module/album');
const Account = require('../module/account')
const Song = require('../module/song');
const PlaylistSong = require('../module/playlistSong');

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

//playList
router.post('/fake', async (req, res, next) => {
    const id_account = req.body
    const accessToken = jwt.sign(id_account, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' });

    return res.status(200).json({
        accessToken: accessToken
    })
})

router.post('/', Auth.authenGTUser, async (req, res, next) => {
    try {
        const { name_playlist, playlist_status } = req.body
        const id_account = Auth.getTokenData(req).id_account

        //Tài khoản bị khóa không thể tạo playlist


        if (name_playlist) {
            //Kiểm tra tên playlist có trùng không
            const name_playlistExists = await Playlist.hasName(name_playlist)
            if (name_playlistExists) {
                return res.status(400).json({
                    message: 'Tên playlist bị trùng'
                })
            }

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

router.put('/:id', Auth.authenGTUser, async (req, res, next) => {
    try {
        const id = req.params.id
        const playlistExists = await Playlist.has(id)

        if (playlistExists) {
            const { name_playlist, playlist_status } = req.body

            if (name_playlist) {
                const oldName_playlist = await Playlist.hasNameID(id)
                if (name_playlist != oldName_playlist) {
                    const name_playlistExists = await Playlist.hasName(name_playlist)
                    if (name_playlistExists) {
                        return res.status(400).json({
                            message: 'Tên playlist bị trùng'
                        })
                    }
                }

                const playList = {
                    name_playlist,
                    playlist_status
                }
                const playlist = await Playlist.update(id, playList)

                return res.status(200).json({
                    message: 'Cập nhật playlist thành công',
                    data: playlist
                })
            } else {
                return res.status(400).json({
                    message: 'Thiếu tên playlsit'
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

router.delete('/:id', Auth.authenGTUser, async (req, res, next) => {
    try {
        const id = req.params.id
        const playlistExists = await Playlist.has(id)

        if (playlistExists) {
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
                message: 'Không tìm thấy playlist để xóa'
            })
        }
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.get('/', Auth.authenGTUser, async (req, res, next) => {
    let page = req.query.page
    const id_account = Auth.getTokenData(req).id_account

    try {
        const listPlaylist = await Playlist.listPlaylistAccount(id_account, page)
        let acc = await Account.selectId(id_account);

        let data = [];
        for (let i = 0; i < listPlaylist.length; i++) {
            let playList = await Playlist.getPlaylist(listPlaylist[i].id_playlist);
            let songs = await PlaylistSong.listPlaylistSong(playList.id_playlist);

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
module.exports = router;