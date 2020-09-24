const {
  getFolderByName,
  getFilesInThisFolder,
  getFoldersInThisFolder,
  modifyLastUpdatedTimeInRecord,
  hasFolderContentChangedSinceLastTime,
  writeFileFromDriveToDisk,
} = require("./gdrive");
const { DateTime } = require("luxon");
const record = require("./record.json");

let scrapedWhatsappGroups;

getFolderByName("Whatsapp-Scraper")
  .then((whatsappScraperFolder) =>
    getFoldersInThisFolder(whatsappScraperFolder)
  )
  .then((whatsappGroups) => {
    scrapedWhatsappGroups = whatsappGroups;
    return whatsappGroups.filter((whatsappGroup) => {
      const lastModifiedTimeOfThisFolderInRecord = record[whatsappGroup.id]
        ? record[whatsappGroup.id]["modifiedTime"]
        : null;
      return hasFolderContentChangedSinceLastTime(
        whatsappGroup,
        lastModifiedTimeOfThisFolderInRecord
      );
    });
  })
  .then((modifiedWhatsappGroups) =>
    Promise.all(
      modifiedWhatsappGroups.map((whatsappGroup) => {
        return getFilesInThisFolder(whatsappGroup);
      })
    )
  )
  .then((arrayOfFolderAndFiles) => {
    arrayOfFolderAndFiles.map(({ folder, files }) => {
      console.log({ folder, files });
      files.map((file) => writeFileFromDriveToDisk(file, folder));
    });
  })
  .then(() => modifyLastUpdatedTimeInRecord(scrapedWhatsappGroups))
  .then((res) => console.log("done"))
  .catch((err) => console.log(err));

// let time1 = "2020-09-24T16:57:12.936Z";
// let time2 = "2020-09-24T16:56:39.227Z";
// let time3 = "2020-09-23T08:54:59.009Z";
//
// datetime1 = DateTime.fromISO(time1);
// datetime2 = DateTime.fromISO(time2);
// datetime3 = DateTime.fromISO(time3);
//
// console.log(datetime1 < datetime2);
// console.log(datetime1 > datetime3);
//
