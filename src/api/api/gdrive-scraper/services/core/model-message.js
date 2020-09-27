const { DateTime } = require("luxon");

/**
 *
 * @param {data} a ISO datetime String
 *  example :
 */
const getLuxonDateTime = ({ date }) => {
  return DateTime.fromJSDate(new Date(data.toString()));
};

module.exports = {
  getLuxonDateTime,
};
