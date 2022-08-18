const { initializeApp } = require('firebase/app')

const firebaseConfig = {
  databaseURL: '',
  projectId: ''
}

const firebaseApp = initializeApp(firebaseConfig)

module.exports = firebaseApp
