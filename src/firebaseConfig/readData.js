const { ref, set, onValue } = require('firebase/database')
const database = require('./firebase_config')

const readData = (id) => {
    let a 
    const starCountRef = ref(database, 'notification1');
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val()
        console.log(data)
    })
}
module.exports = readData