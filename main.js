const firebaseApp = require('./firebase.config.js')
const { getDocs, getFirestore, collection } = require('firebase/firestore')
const moment = require('moment')
const fs = require('fs/promises')

const db = getFirestore(firebaseApp)

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const firestoreCsvConverter = {
  keyTemplate: {},
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)
    let retData = {}
    for (let [key, value] of Object.entries(data)) {
      if (Object.keys(firestoreCsvConverter.keyTemplate).length <= 0) {
        firestoreCsvConverter.keyTemplate[key] = null
      }
      if (Object.keys(retData).length <= 0) {
        retData = firestoreCsvConverter.keyTemplate
      }
      retData[key] = `="${value}"`
    }
    return retData
  }
}

const init = async () => {
  if (
    !firebaseApp ||
    !['projectId', 'databaseURL'].includes(firebaseApp.options)
  ) {
    console.log('Please initialize your firebase app in firebase.config.js')
    process.exit(0)
  }

  console.log(`Your current project ==> ${firebaseApp.options.projectId}`)
  console.log(`Firestore URL ==> ${firebaseApp.options.databaseURL}`)

  rl.question('Which collection you want to export ? : ', async (path) => {
    console.log(`Starting export collection "${path}"`)
    try {
      const querySnapshot = await getDocs(
        collection(db, path).withConverter(firestoreCsvConverter)
      )
      if (querySnapshot.empty) {
        throw new Error("This collection is empty or doesn't exist.")
      }
      const column = Object.keys(querySnapshot.docs[0].data())
      let columnCsv = column.join(',')
      let data = columnCsv
      querySnapshot.forEach((doc) => {
        data += `\r\n${Object.values(doc.data()).join(',')}`
      })
      const fileName = `${moment().format('DD-MM-YYYY HH-mm A')}__${
        firebaseApp.options.projectId
      }-${path}.csv`
      await fs.writeFile(`./output/${fileName}`, '\ufeff' + data)
      console.log(data)
      console.log('---')
      console.log(`File name "${fileName}" has been written.`)
      console.log('---')
    } catch (err) {
      console.log('---')
      console.log(`[ERROR]: ${err.message}`)
      console.log('---')
    } finally {
      rl.close()
    }
  })
}

rl.on('close', () => {
  process.exit(0)
})

init()
