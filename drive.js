const { refreshToken } = require('firebase-admin/app');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path')
const { Duplex } = require('stream');
require('dotenv').config();


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const FOLDERSONG = process.env.FOLDERSONG;
const FOLDERIMG = process.env.FOLDERIMG;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
})

function bufferToStream(buffer) {
    const duplexStream = new Duplex();
    duplexStream.push(buffer);
    duplexStream.push(null);
    return duplexStream;
}


const MyDrive = {};

MyDrive.setFilePublic = async (fileId) => {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        })
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

MyDrive.uploadSong = async (file, filename) => {
    try {
        const createFile = await drive.files.create({
            requestBody: {
                name: `${filename}.mp3`,
                mimeType: 'song/mp3',
                parents: [FOLDERSONG]
            },
            media: {
                mimeType: 'song/mp3',
                body: bufferToStream(file.data)//fs.createReadStream(path.join('C:/Users/Hong Phuc/OneDrive - 01dhhp/Desktop/Android/New folder/music_api_android/Sau-Lung-Anh-Co-Ai-Kia-Thieu-Bao-Tram.mp3'))
            }
        })
        //console.log(createFile.data)
        switch (createFile.status) {
            case 200:
                {
                    //console.log('OK', createFile.data.id);
                    await that.setFilePublic(createFile.data.id);
                    return createFile.data.id;
                }
            default: console.error("err", response.error); break;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

MyDrive.deleteSong = async (fileId) => {
    try {
        const deleteFile = await drive.files.delete({
            fileId: fileId
        })
        //console.log(deleteFile.data, deleteFile.status);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

MyDrive.uploadIMG = async (file, filename) => {
    try {
        const createFile = await drive.files.create({
            requestBody: {
                name: `${filename}.jpg`,
                mimeType: 'image/jpg',
                parents: [FOLDERIMG]
            },
            media: {
                mimeType: 'image/jpg',
                body: bufferToStream(file.data)//fs.createReadStream(path.join('C:/Users/Hong Phuc/OneDrive - 01dhhp/Desktop/Android/New folder/music_api_android/Sau-Lung-Anh-Co-Ai-Kia-Thieu-Bao-Tram.mp3'))
            }
        })
        //console.log(createFile.data)
        switch (createFile.status) {
            case 200:
                {
                    //console.log('OK', createFile.data.id);
                    await that.setFilePublic(createFile.data.id);
                    return createFile.data.id;
                }
            default: console.error("err", response.error); break;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

MyDrive.deleteIMG = async (fileId) => {
    try {
        const deleteFile = await drive.files.delete({
            fileId: fileId
        })
        //console.log(deleteFile.data, deleteFile.status);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

//Lấy id của song từ link
MyDrive.getImageId = (path) => {
    let pos = path.lastIndexOf('=');
    return path.substr(pos + 1);
}
var that = module.exports = MyDrive;