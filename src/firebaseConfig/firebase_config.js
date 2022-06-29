const firebase = require("firebase-admin")
const configJsonFirebase = require('./key/key.json')

const defaultAppConfig = {
    credential: firebase.credential.cert(configJsonFirebase)
}
// Initialize the default app
const firebaseNotification = firebase.initializeApp(defaultAppConfig)

module.exports = firebaseNotification