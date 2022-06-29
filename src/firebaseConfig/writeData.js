const { ref, set } = require('firebase/database')
const database = require('./firebase_config')

const writeData = (data) => {
    set(ref(database, 'notification' + data.id_account), {
        content: data.content,
        action: data.action,
        id_account: data.id_account
    });
}
module.exports = writeData