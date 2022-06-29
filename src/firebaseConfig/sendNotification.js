const firebaseNotification = require('./firebase_config')

const sendNotification = (message) => {
    firebaseNotification.messaging().send(message)
        .then((response) => {
            console.log('a')
        })
        .catch((error) => {
            console.log('b')
        });

}

module.exports = sendNotification