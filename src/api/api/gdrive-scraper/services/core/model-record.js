const record = require("./record.json");
const { DateTime } = require("luxon");

const parameters = {
  LAST_SCRAPED_MESSAGE_TIME: "lastScrapedMessageTime",
};

const exists = ({ id }) => {
  return record[id] ? true : false;
};

const addNewGroupRecord = ({ name, id, modified }) => {
  if (record[id]) {
    return Promise.reject(
      `Can not add Group (id:${id} name:${name}) to the record that already exists`
    );
  } else {
    record[id] = { id, name, modified };
  }
};

const updateLastScrapedMessageTime = ({ id, name, dateTime }) => {
  try {
    record[id] = {
      ...record[id],
      LAST_SCRAPED_MESSAGE_TIME: dateTime.toString(),
    };
  } catch (err) {
    return Promise.reject(
      `Error Updating last scraped message time for Group (id:${id} name:${name})`
    );
  }
};

/**
 *
 * @param {id} group id
 * returns a DateTime object that can be used by the luxon library
 */
const getLastScrapedTime = ({ id }) => {
  record[id] && record[id][parameters.LAST_SCRAPED_MESSAGE_TIME]
    ? DateTime.fromISO(record[id][parameters.LAST_SCRAPED_MESSAGE_TIME])
    : null;
};

const record = record;

module.exports = {
  exists,
  addNewGroupRecord,
  updateLastScrapedMessageTime,
  getLastScrapedTime,
  record,
};
