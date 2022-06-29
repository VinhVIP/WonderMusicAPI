const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const saltRounds = 10;
const router = express.Router()
const Auth = require('../../../middleware/auth');
const Account = require('../module/account')
const Album = require('../module/album');
const Song = require('../module/song');
const PlayList = require('../module/playList');
const PlaylistSong = require('../module/playlistSong');
const Follow = require('../module/follow');
const MyDrive = require('../../../../drive');
const nodemailer = require("nodemailer");


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

/**
 * Đăng nhập
 * @body   account_name, password
 * @return  200: Đăng nhập thành công
 *          400: Sai thông tin đăng nhập
 *          401: TK đã bị khóa    
 *          404: Thiếu thông tin đăng nhập
 */
router.post('/login', async (req, res, next) => {
    try {
        const email = req.body.email
        const password = req.body.password

        if (!(email && password)) {
            return res.status(404).json({
                message: 'Thiếu thông tin đăng nhập',
                email: email,
                pass: password
            })
        }
        let exist = await Account.hasEmail(email);

        if (exist) {
            let acc = await Account.selectByEmail(email);
            let match = await bcrypt.compare(password, acc.password);
            if (match) {
                var data = await Account.selectId(acc.id_account)
                // let days_token = await Information.selectToken();
                const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, { expiresIn: `24d` });

                return res.status(200).json({
                    message: 'đăng nhập thành công',
                    accessToken: accessToken,
                    data: data
                });
            } else {
                return res.status(400).json({
                    message: 'Mật khẩu hoặc tài khoản không đúng'
                });
            }
        } else {
            return res.status(400).json({
                message: 'Mật khẩu hoặc tài khoản không đúng',
            });
        }


    } catch (error) {
        console.log(err);
        return res.sendStatus(500);
    }
})

/**
 * Lấy danh sách tài khoản nổi bật 
 * @permission  mọi người
 * @return      200: Thành công, trả về danh sách tài khoản 
 *              
 */
router.get('/hot', async (req, res, next) => {
    try {
        const authorizationHeader = req.headers['authorization'];

        let idUser = false;

        if (authorizationHeader) {
            const token = authorizationHeader.split(' ')[1];
            if (!token) return res.sendStatus(401);

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
                if (err) {
                    console.log(err);
                    return res.sendStatus(401);
                }
            })

            idUser = Auth.getTokenData(req).id_account;
        }
        let data;
        if (!idUser) data = await Account.getListAccountHot();
        else data = await Account.getListAccountHot(idUser);

        return res.status(200).json({
            message: 'Tìm kiếm danh sách tài khoản thành công',
            data: data
        });

    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
})

/**
 * Đổi password của cá nhân
 * @body        old_password, new_password
 * @permission  Người đang đăng nhập
 * @return      200: Đổi thành công
 *              400: Thiếu dữ liệu
 *              403: Mật khẩu cũ không chính xác
 */
router.put('/change/password', Auth.authenGTUser, async (req, res, next) => {
    try {
        let new_password = req.body.new_password;
        let old_password = req.body.old_password;
        let id_account = Auth.getTokenData(req).id_account;

        if (old_password !== "") {
            let acc = await Account.selectId(id_account);
            acc = await Account.selectByEmail(acc.email);
            let match = await bcrypt.compare(old_password, acc.password);

            if (match) {
                if (new_password !== "") {
                    bcrypt.hash(new_password, saltRounds, async (err, hash) => {
                        new_password = hash;
                        let changePassword = await Account.updatePassword(id_account, new_password);

                        return res.status(200).json({
                            message: 'Thay đổi mật khẩu thành công',
                        })
                    });
                } else {
                    return res.status(400).json({
                        message: 'Mật khẩu mới không được bỏ trống'
                    });
                }
            } else {
                return res.status(403).json({
                    message: 'Mật khẩu cũ không chính xác!'
                })

            }

        } else {
            return res.status(400).json({
                message: 'Thiếu mật khẩu cũ!'
            })
        }

    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

/**
 * Lấy thông tin của tài khoản
 * @permission  người đã đăng nhập
 * @returns     200: lấy dữ liệu thành công
 */
// TODO: Deprecated
router.get('/information', Auth.authenGTUser, async (req, res, next) => {
    try {
        let acc = await Account.selectId(Auth.getTokenData(req).id_account);
        return res.status(200).json({
            message: "Lấy thông tin thành công",
            data: acc
        })
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
})
/**
 * Lấy tất cả bài hát của bản thân
 * @permisson   chỉ bản thân
 * @return      200: Thành công, trả về các bài viết public, đã kiểm duyệt của tài khoản
 *              404: Tài khoản không tồn tại
 */
router.get('/songs', Auth.authenGTUser, async (req, res, next) => {
    try {
        let idAcc = Auth.getTokenData(req).id_account;
        let acc = await Account.selectId(idAcc);
        let page = req.query.page;

        let songsId;
        if (page) songsId = await Song.getListSongIdOfAccount(idAcc, page);
        else songsId = await Song.getListSongIdOfAccount(idAcc);

        let data = [];
        for (let i = 0; i < songsId.length; i++) {
            let song = await getSong(songsId[i].id_song, idAcc);
            data.push(song);
        }
        res.status(200).json({
            message: 'Lấy danh sách các bài hát của tài khoản thành công',
            data: data
        })


    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Lấy tất cả bài hát (public) của các tài khoản mà bản thân đang follow
 * @permisson   Ai cũng có thể thực thi
 * @return      200: Thành công, trả về các bài viết public, đã kiểm duyệt của tài khoản
 *              404: Tài khoản không tồn tại
 */
router.get('/songs_following', Auth.authenGTUser, async (req, res, next) => {
    try {
        let idUser = Auth.getUserID(req);
        let page = req.query.page;
        if (!page) page = 1

        let songsId = await Song.getSongsOfFollowing(idUser, page)

        let data = [];
        for (let i = 0; i < songsId.length; i++) {
            let song = await getSong(songsId[i].id_song, idUser);
            data.push(song);
        }
        res.status(200).json({
            message: 'Lấy danh sách các bài hát của các tài khoản đang foloow',
            data: data
        })

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


/**
 * Thêm 1 tài khoản thường
 * @body        account_name, real_name, email, password
 * @permission  Ai cũng có thể thực thi
 * @return      201: Tạo thành công, trả về id vừa được thêm
 *              400: Thiếu thông tin đăng ký,
 *                   Xác nhận mật khẩu không đúng
 */
router.post('/', async (req, res, next) => {
    try {
        var { email, account_name, password, confirmPassword } = req.body;

        if (email && account_name && password && confirmPassword) {
            if (password === confirmPassword) {
                let role = 0;
                bcrypt.hash(password, saltRounds, async (err, hash) => {
                    password = hash;
                    if (err) {
                        console.log(err);
                        return res.sendStatus(500);
                    }

                    let emailExists = await Account.hasEmail(email);
                    if (emailExists) {
                        return res.status(400).json({
                            message: 'Email này đã được sử dụng!'
                        })
                    }

                    let avatar = "";
                    let acc = { account_name, email, password, role, avatar };
                    let insertId = await Account.add(acc);

                    res.status(201).json({
                        message: 'Tạo mới tài khoản thành công',
                        data: insertId
                    });
                });
            } else {
                res.status(400).json({
                    message: 'Xác nhận mật khẩu không chính xác'
                })
            }


        } else {
            res.status(400).json({
                message: 'Thiếu dữ liệu để tạo tài khoản'
            })
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: 'Something wrong'
        })
    }

});

/**
 * Lấy thông tin 1 tài khoản theo id
 * @params      id 
 * @permission  Theo token
 * @return      200: trả về tài khoản tìm thấy
 *              404: Không tìm thấy
 */
router.get('/:id', async (req, res, next) => {
    try {
        let id = req.params.id;
        let accountExists = await Account.has(id);

        if (accountExists) {

            let idUser = Auth.getUserID(req);
            let result = await Account.selectId(id, idUser);

            res.status(200).json({
                message: 'Đã tìm thấy tài khoản',
                data: result
            })
        } else {
            res.status(404).json({
                message: 'Không tìm thây tài khoản',
            })
        }

    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: 'Something wrong!'
        })
    }
})

/**
 * Thay đổi thông tin tài khoản, chỉ có thể đổi của chính bản thân
 * 
 * @permission  phải đăng nhập thì mới được thực thi (user trở lên)
 * @return      401: Không được sửa thông tin của người khác
 *              400: Thiếu thông tin bắt buộc
 *              200: Cập nhật thành công, trả về tài khoản vừa cập nhật
 */
// TODO: Deprecated
router.put('/:id', Auth.authenGTUser, async (req, res, next) => {
    try {

        let updateId = req.params.id;
        let userId = Auth.getTokenData(req).id_account;
        let oldAccount = await Account.selectId(updateId);

        if (updateId != userId) {
            return res.status(401).json({
                message: 'Không thể sửa đổi thông tin của người khác'
            })
        }
        let { account_name } = req.body;

        if (account_name) {
            let avatarPath = '';
            if (req.files && req.files.image) {
                let image = req.files.image;

                //update avt mới
                let idIMGDrive = await MyDrive.uploadIMG(image, "avatar_" + userId);
                if (!idIMGDrive) {
                    return res.status(400).json({
                        message: "Lỗi upload image"
                    })
                }
                // xóa avt cũ
                let oldAvatarId = MyDrive.getImageId(oldAccount.avatar);
                if (oldAvatarId) {
                    await MyDrive.deleteIMG(oldAvatarId);
                }


                avatarPath = "https://drive.google.com/uc?export=view&id=" + idIMGDrive;
            }
            let result = await Account.update(updateId, account_name, avatarPath);

            return res.status(200).json({
                message: 'Cập nhật thông tin tài khoản thành công',
                data: result
            })
        } else {
            return res.status(400).json({
                message: 'account_name ko được để trống'
            })
        }


    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: 'Something wrong'
        })
    }

})


/**
 * Lấy danh sách album của 1 tài khoản
 * @query       page
 * @permission  Ai cũng có thể
 * @return      200: Thành công, trả về số lượng + id các bài viết đã bookmark của tài khoản này
 *              404: Tài khoản không tồn tại
 */
router.get('/:id/album', async (req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req);
        let id = req.params.id;
        let page = req.query.page;

        let accExists = await Account.has(id);
        if (accExists) {
            let albumId;
            if (page) albumId = await Album.list(id, page);
            else albumId = await Album.list(id);

            let acc = await Account.selectId(id);

            let data = [];
            for (let i = 0; i < albumId.length; i++) {
                let album = await Album.hasIdAlbum(albumId[i].id_album);
                let songs = await Album.selectSongsOfAlbum(albumId[i].id_album);

                let listSong = [];
                for (let j = 0; j < songs.length; j++) {
                    let song = await getSong(songs[j].id_song, idAccount);
                    listSong.push(song);
                }
                delete album['id_account'];
                album['account'] = acc;
                album['songs'] = listSong;
                data.push(album);
            }

            res.status(200).json({
                message: 'Lấy danh sách Album thành công',
                data: data
            })
        } else {
            res.status(404).json({
                message: 'Tài khoản không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


/**
 * Lấy tất cả bài hát (public) của một tài khoản
 * @permisson   Ai cũng có thể thực thi
 * @return      200: Thành công, trả về các bài viết public, đã kiểm duyệt của tài khoản
 *              404: Tài khoản không tồn tại
 */
router.get('/:id/songs', async (req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req);
        let idAcc = req.params.id;
        let page = req.query.page;

        let accExists = await Account.has(idAcc);
        if (accExists) {
            let acc = await Account.selectId(idAcc);
            let songsId;
            if (page) songsId = await Song.getListSongIdPublicOfAccount(idAcc, page);
            else songsId = await Song.getListSongIdPublicOfAccount(idAcc);

            let data = [];
            for (let i = 0; i < songsId.length; i++) {
                let song = await getSong(songsId[i].id_song, idAccount);
                data.push(song);
            }
            res.status(200).json({
                message: 'Lấy danh sách các bài hát của tài khoản thành công',
                data: data
            })
        } else {
            res.status(404).json({
                message: 'Tài khoản không tồn tại'
            })
        }

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})




/**
 * Lấy playlist công khai của tài khoản
 * @permisson   mọi người
 * @return      200: Thành công, trả về các bài viết public, đã kiểm duyệt của tài khoản
 *              404: Tài khoản không tồn tại
 */
router.get('/:id/playlist', async (req, res, next) => {
    try {
        let idAccount = Auth.getUserID(req);
        let idAcc = req.params.id;
        let page = req.query.page;

        let accExists = await Account.has(idAcc);
        if (accExists) {
            let acc = await Account.selectId(idAcc);

            let playlists;
            if (page) playlists = await PlayList.listPlaylistAccount(idAcc, page);
            else playlists = await PlayList.listPlaylistAccount(idAcc);

            let data = [];
            for (let i = 0; i < playlists.length; i++) {
                if (playlists[i].playlist_status === 0) {
                    let playList = await PlayList.getPlaylist(playlists[i].id_playlist);
                    let songs = await PlaylistSong.listPlaylistSong(playList.id_playlist);

                    let songList = [];
                    for (let j = 0; j < songs.length; j++) {
                        let song = await getSong(songs[j].id_song, idAccount);
                        songList.push(song);;

                    }
                    playList['songs'] = songList;
                    playList['account'] = acc;
                    data.push(playList);
                }

            }
            res.status(200).json({
                message: 'Lấy danh sách các playlist của tài khoản thành công',
                data: data
            })

        } else {
            res.status(404).json({
                message: 'Tài khoản không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})



/**
 * Tìm kiếm tài khoản theo từ khóa
 * @query       k
 * @permission  Xử lý theo token
 * @return      200: Trả về danh sách
 *              400: Chưa có từ khóa tìm kiếm
 *              401: Authorization header không có token
 *              403: token không chính xác hoặc đã hết hạn
 */
router.get('/', async (req, res, next) => {
    try {
        let { k } = req.query;
        if (!k || k.trim().length == 0) {
            return res.status(400).json({
                message: "Chưa có từ khóa tìm kiếm"
            })
        }

        k = k.toLowerCase();


        let page = req.query.page;

        let list = [];
        let ids;
        if (page) ids = await Account.getSearch(k, page);
        else ids = await Account.getSearch(k);

        let idUser = Auth.getUserID(req);

        for (let accId of ids) {
            let acc = await Account.selectId(accId.id_account, idUser);
            list.push(acc)
        }

        return res.status(200).json({
            message: 'Tìm kiếm danh sách tài khoản thành công',
            data: list
        });
    } catch (err) {
        console.log(err);
        return res.sendStatus(500)
    }
});

/**
 * Lấy danh sách tài khoản theo dõi TK có id cho trước
 * @params      id tài khoản cần tra cứu
 * @permission  Theo token
 * @return      200: Thành công, trả về danh sách tài khoản 
 *              404: Tài khoản không tồn tại
 */
router.get('/:id/follower', async (req, res, next) => {
    try {
        let id = req.params.id;
        let idUser = Auth.getUserID(req);

        let accExists = await Account.has(id);
        if (accExists) {
            let result = await Follow.listFollowingOf(id);
            let data = [];
            for (let accFollowing of result) {
                let acc = await Account.selectId(accFollowing.id_following, idUser);
                data.push(acc)
            }

            res.status(200).json({
                message: 'Lấy danh sách các tài khoản theo dõi người này thành công',
                data: data
            })
        } else {
            res.status(404).json({
                message: 'Tài khoản không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

/**
 * Lấy danh sách tài khoản mà TK có id cho trước theo dõi
 * @params      id tài khoản cần tra cứu
 * @permission  Theo token
 * @return      200: Thành công, trả về danh sách tài khoản 
 *              404: Tài khoản không tồn tại
 */
router.get('/:id/following', async (req, res, next) => {
    try {
        let id = req.params.id;
        let idUser = Auth.getUserID(req);

        let accExists = await Account.has(id);
        if (accExists) {
            let result = await Follow.listFollowerOf(id);
            let data = [];
            for (let accFollowing of result) {
                let acc = await Account.selectId(accFollowing.id_follower, idUser);
                data.push(acc)
            }

            res.status(200).json({
                message: 'Lấy danh sách các tài khoản theo dõi người này thành công',
                data: data
            })
        } else {
            res.status(404).json({
                message: 'Tài khoản không tồn tại'
            })
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


/**
 * Khóa tài khoản
 * @permisson   Chỉ admin
 * @return      200: khóa tài khoản thành công
 * 
 */
router.put('/:id/block', Auth.authenAdmin, async (req, res, next) => {
    try {
        let id = req.params.id;
        let accExists = await Account.has(id);

        if (accExists) {
            let acc = await Account.selectIdLite(id)
            if (acc.role === 1) {
                return res.status(403).json({
                    message: 'không thể khóa tài khoản cùng cấp',
                })
            }
            let result = await Account.updateStatus(id, 1);

            return res.status(201).json({
                message: 'khóa tài khoản thành công',
                data: result
            })
        } else {
            return res.status(400).json({
                message: 'tài khoản này không tồn tại'
            })
        }


    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
})


/**
 * Mở khóa tài khoản
 * @permisson   Chỉ admin
 * @return      200: khóa tài khoản thành công
 * 
 */
router.put('/:id/unblock', Auth.authenAdmin, async (req, res, next) => {
    try {
        let id = req.params.id;
        let accExists = await Account.has(id);

        if (accExists) {
            let acc = await Account.selectIdLite(id)
            if (acc.role === 1) {
                return res.status(403).json({
                    message: 'không thể thực hiện với tài khoản cùng cấp',
                })
            }
            let result = await Account.updateStatus(id, 0);

            return res.status(201).json({
                message: 'mở khóa tài khoản thành công',
                data: result
            })
        } else {
            return res.status(400).json({
                message: 'tài khoản này không tồn tại'
            })
        }


    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
})


const createCode = () => {
    var result = '';
    for (var i = 0; i < 6; i++) {
        result += String(Math.floor(Math.random() * 10));
    }
    return result;
}

router.post('/forget/password', async (req, res) => {
    try {
        const { email } = req.body
        const code = createCode()
        const existAccount = await Account.hasEmailAccount(email)

        if (!email) {
            return res.status(400).json({
                message: 'Thiếu dữ liệu gửi về'
            });
        }

        if (!existAccount) {
            return res.status(404).json({
                message: 'Không tồn tại email này'
            });
        } else {
            let transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.AUTH_EMAIL, // generated ethereal user
                    pass: process.env.AUTH_PASS, // generated ethereal password
                },
            });

            // await transporter.verify((error, success) => {
            //     if (error) {
            //         console.log('a')
            //     } else {
            //         console.log('b')
            //     }
            // })
            await transporter.sendMail({
                from: process.env.AUTH_EMAIL, // sender address
                to: `${email}`, // list of receivers
                subject: "Lấy lại mật khẩu Wonder Music", // Subject line
                html: `<h3><b>Xin chao ${existAccount.account_name}</b></h3>
                        <p>Đây là mã code của bạn:</p>
                        <h2>&emsp;Code: ${code}</h2>
                        <p>Quản lý Wonder Music</p>
                `, // html body
            })

            const isId = await Account.isHasIdVerification(existAccount.id_account)

            if (isId) {
                await Account.updateVerification(existAccount.id_account, code)
            } else {
                await Account.insertVerification(existAccount.id_account, code)
            }

            return res.status(200).json({
                message: 'Đã gửi mã xác nhận',
            });
        }
    } catch (error) {
        return res.status(500)
    }
})

router.post('/forget/verify', async (req, res) => {
    try {
        const { email, code } = req.body
        const existAccount = await Account.hasEmailAccount(email)

        if (!email || !code) {
            return res.status(400).json({
                message: 'Thiếu dữ liệu gửi về'
            });
        }


        if (!existAccount) {
            return res.status(404).json({
                message: 'Không tồn tại email này'
            });
        }

        const existEmailAndCode = await Account.isHasCodeAndEmail(existAccount.id_account, code)
        if (!existEmailAndCode) {
            return res.status(404).json({
                message: 'Email và code không trùng nhau'
            });
        }

        const isValidCode = await Account.checkTimeCode(existAccount.id_account)
        if (!isValidCode) {
            return res.status(404).json({
                message: 'Code hết hạn '
            });
        }

        return res.status(200).json({
            message: 'Mã code hợp lệ',
        })
    } catch (error) {
        return res.status(500)
    }
})

router.post('/forget/change', async (req, res) => {
    try {
        let { email, code, new_pass } = req.body
        const existAccount = await Account.hasEmailAccount(email)

        if (!email || !code || !new_pass) {
            return res.status(400).json({
                message: 'Thiếu dữ liệu gửi về'
            });
        }


        if (!existAccount) {
            return res.status(404).json({
                message: 'Không tồn tại email này'
            });
        }

        const existEmailAndCode = await Account.isHasCodeAndEmail(existAccount.id_account, code)
        if (!existEmailAndCode) {
            return res.status(404).json({
                message: 'Email và code không trùng nhau'
            });
        }

        const isValidCode = await Account.checkTimeCode(existAccount.id_account)
        if (!isValidCode) {
            return res.status(404).json({
                message: 'Code hết hạn '
            });
        }

        bcrypt.hash(new_pass, saltRounds, async (err, hash) => {
            new_pass = hash;
            await Account.updatePassword(existAccount.id_account, new_pass);
            await Account.deleteAccountVerification(existAccount.id_account)

            return res.status(200).json({
                message: 'Thay đổi mật khẩu thành công',
            })
        });

    } catch (error) {
        return res.status(500)
    }
})
module.exports = router