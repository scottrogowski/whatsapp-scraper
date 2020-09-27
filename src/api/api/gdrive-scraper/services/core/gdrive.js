const { google } = require("googleapis");
const { record } = require("./model-record");
const auth = new google.auth.GoogleAuth({
  keyFile: "./whatsapp-scraper-668a815fc26f.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const Promise = require("bluebird");
var writeFile = Promise.promisify(require("fs").writeFile);
var mkdir = Promise.promisify(require("fs").mkdir);
const { DateTime } = require("luxon");
const fs = require("fs");
const { getFiles, getJSON, writeToJsonFile } = require("./message-parser");
const drive = google.drive({
  version: "v3",
  auth,
});

exports.getFolderFromDriveByName = (folderName) => {
  return drive.files
    .list({
      pageSize: 10,
      fields:
        "nextPageToken, files(id, name, trashed, explicitlyTrashed, modifiedTime, mimeType)",
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}'`,
    })
    .then((res) =>
      res.data && res.data.files && res.data.files.length > 0
        ? res.data.files[0]
        : Promise.reject(`${folderName} Folder Not Found`)
    )
    .then((folder) => {
      console.log(`${folderName} Folder's Details Obtained`);
      return folder;
    });
};

exports.getFoldersInThisFolder = (folder) => {
  return drive.files
    .list({
      pageSize: 10,
      fields:
        "nextPageToken, files(id, name, trashed, explicitlyTrashed, modifiedTime, mimeType)",
      q: `mimeType = 'application/vnd.google-apps.folder' and '${folder.id}' in parents`,
    })
    .then((res) => {
      return res.data && res.data.files && res.data.files.length > 0
        ? res.data.files
        : Promise.reject(
            `Unexpected Result while getting folder list from ${folder.name}`
          );
    })
    .then((folders) => {
      console.log(
        `Following folders within ${folder.name} were obtained : ${folders
          .map((folder) => folder.name)
          .join(", ")}`
      );
      return folders;
    });
};

const getFilesInThisFolder = (folder) => {
  return drive.files
    .list({
      pageSize: 10,
      fields:
        "nextPageToken, files(id, name, trashed, explicitlyTrashed, modifiedTime, mimeType)",
      q: `mimeType != 'application/vnd.google-apps.folder' and '${folder.id}' in parents`,
    })
    .then((res) => {
      return res.data && res.data.files && res.data.files.length > 0
        ? res.data.files
        : Promise.reject("Unexpected Result");
    })
    .then((files) => {
      console.log(
        `Found in ${folder.name} : ${files.map((file) => file.name).join(", ")}`
      );
      return { folder, files };
    });
};

exports.getFilesInTheseFolders = (folders) => {
  return Promise.all(
    folders.map((folder) => {
      return getFilesInThisFolder(folder);
    })
  );
};

exports.modifyLastUpdatedTimeInRecord = (folders) => {
  folders.map((folder) => {
    if (!record[folder.id]) {
      record[folder.id] = {};
    }
    record[folder.id]["modifiedTime"] = folder.modifiedTime;
    record[folder.id]["name"] = folder.name;
  });

  return writeFile("record.json", JSON.stringify(record))
    .then(() => record)
    .catch((err) =>
      Promise.reject(
        "Error updating json records of last update time - " + err.message
      )
    );
};

const hasFolderContentChangedSinceLastTime = (folder, lastModifiedTime) => {
  if (lastModifiedTime === undefined || lastModifiedTime === null) {
    return true;
  } else {
    const folderModifiedDateTime = DateTime.fromISO(folder.modifiedTime);
    const lastModifiedDateTime = DateTime.fromISO(lastModifiedTime);
    return lastModifiedDateTime < folderModifiedDateTime;
  }
};

exports.getModifiedFoldersSinceLastScrapeTime = (whatsappGroupFolders) => {
  return whatsappGroupFolders.filter((whatsappGroupFolder) => {
    const lastModifiedTimeOfThisFolderInRecord = record[whatsappGroupFolder.id]
      ? record[whatsappGroupFolder.id]["modifiedTime"]
      : null;
    return hasFolderContentChangedSinceLastTime(
      whatsappGroupFolder,
      lastModifiedTimeOfThisFolderInRecord
    );
  });
};

const writeFileFromDriveToDisk = (file, folder) => {
  return mkdir(`./files/${folder.name}/`, { recursive: true }).then(() => {
    return drive.files
      .get({ fileId: file.id, alt: "media" }, { responseType: "stream" })
      .then((res) => {
        return new Promise((resolve, reject) => {
          const dest = fs.createWriteStream(
            `./files/${folder.name}/${file.name}`
          );
          let progress = 0;
          res.data
            .on("end", () => {
              console.log(`Downloaded in ${folder.name} - ${file.name}`);
              resolve(`./files/${file.name}`);
            })
            .on("error", () => {
              console.log(`error downloading ${file.name}`);
              reject(`error downloadingg ${file.name}`);
            })
            .pipe(dest);
        });
      });
  });
};

exports.saveFilesFromGoogleDriveToDisk = (arrayOfFolderAndFiles) => {
  return arrayOfFolderAndFiles.map(({ folder, files }) => {
    return Promise.all(
      files.map((file) => writeFileFromDriveToDisk(file, folder))
    );
  });
};
