const { google } = require("googleapis");
const record = require("./record.json");
const auth = new google.auth.GoogleAuth({
  keyFile: "./whatsapp-scraper-668a815fc26f.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const Promise = require("bluebird");
var writeFile = Promise.promisify(require("fs").writeFile);
const { DateTime } = require("luxon");
const fs = require("fs");

const drive = google.drive({
  version: "v3",
  auth,
});

exports.getFolderByName = (folderName) => {
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
        : Promise.reject("Unexpected Result");
    })
    .then((folders) => {
      console.log(`Following folders within ${folder.name} were obtained :`);
      folders.map((folder) => {
        console.log(folder.name);
      });
      return folders;
    });
};

exports.getFilesInThisFolder = (folder) => {
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
        `Following Files were found within the folder ${folder.name}`
      );
      files.map((file) => {
        console.log(file.name);
      });
      return { folder, files };
    });
};

exports.modifyLastUpdatedTimeInRecord = (folders) => {
  folders.map((folder) => {
    console.log("--- ", folder);
    if (!record[folder.id]) {
      record[folder.id] = {};
    }
    record[folder.id]["modifiedTime"] = folder.modifiedTime;
  });

  return writeFile("record.json", JSON.stringify(record))
    .then(() => record)
    .catch((err) =>
      Promise.reject(
        "Error updating json records of last update time - " + err.message
      )
    );
};

exports.hasFolderContentChangedSinceLastTime = (folder, lastModifiedTime) => {
  if (lastModifiedTime === undefined || lastModifiedTime === null) {
    return true;
  } else {
    const folderModifiedDateTime = DateTime.fromISO(folder.modifiedTime);
    const lastModifiedDateTime = DateTime.fromISO(lastModifiedTime);
    return lastModifiedDateTime < folderModifiedDateTime;
  }
};

exports.writeFileFromDriveToDisk = (file, folder) => {
  fs.mkdir(`./files/${folder.name}/`, { recursive: true }, (err) => {
    if (err) throw err;
  });

  drive.files
    .get({ fileId: file.id, alt: "media" }, { responseType: "stream" })
    .then((res) => {
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(
          `./files/${folder.name}/${file.name}`
        );
        let progress = 0;
        res.data
          .on("end", () => {
            console.log(`done downloading ${file.name}`);
            resolve(`./files/${file.name}`);
          })
          .on("error", () => {
            console.log(`error downloading ${file.name}`);
          })
          .pipe(dest);
      });
    });
};
