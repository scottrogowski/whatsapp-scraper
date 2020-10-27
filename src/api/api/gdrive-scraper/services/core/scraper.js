const {
  getFolderFromDriveByName,
  getFoldersInThisFolder,
  modifyLastUpdatedTimeInRecord,
  getModifiedFoldersSinceLastScrapeTime,
  getFilesInTheseFolders,
  saveFilesFromGoogleDriveToDisk,
  parseWhatsappChatTextFileIntoJson,
} = require("./gdrive")
const { DateTime } = require("luxon")

let changedWhatsappGroups
let report

// async function GetStructuredDataFromGoogleDrive() {
// var whatsappScraper = await getFolderFromDriveByName("Whatsapp-Scraper")
// var modifiedWhatsappGroups = await getFoldersInThisFolder(whatsappScraper)
// var folderAndFilesArray = await getFilesInTheseFolders(modifiedWhatsappGroups)
// await saveFilesFromGoogleDriveToDisk(folderAndFilesArray)
//
// }
getFolderFromDriveByName("Whatsapp-Scraper")
  .then(getFoldersInThisFolder)
  .then(getModifiedFoldersSinceLastScrapeTime)
  .then(modifiedWhatsappGroups => {
    console.log(`Modified Folders : ${modifiedWhatsappGroups.map(group => group.name).join(", ")}`)
    changedWhatsappGroups = modifiedWhatsappGroups
    return getFilesInTheseFolders(modifiedWhatsappGroups)
  })
  .then(saveFilesFromGoogleDriveToDisk)
  .then(downloadAllFiles => Promise.all(downloadAllFiles))
  .then(() => parseWhatsappChatTextFileIntoJson(changedWhatsappGroups))
  .then(() => modifyLastUpdatedTimeInRecord(changedWhatsappGroups))
  .then(res => console.log("res", res))
  .then(res => console.log("done"))
  .catch(err => console.log(err))
