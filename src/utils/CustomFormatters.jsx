
// const formatDate = (dateString,) => {
//   const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//   const date = new Date(dateString);
//   const options = {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//     timeZone: userTimeZone,
//   };
//   return date.toLocaleString('en-US', options);
// };

const formatDateDDMMYYYY = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
var datearray = formattedDate.split("-");


const formattedDateLong = (date) =>
  new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formattedDateNoYear = (date) =>
  new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
  });


const formatDate = (dateStr, returnObject = false) => {
  if (!dateStr) return "";

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateObj = new Date(dateStr);

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const shortYear = String(year).slice(-2);

  // 🕓 Time and common readable formats
  const timeFormatted = dateObj.toLocaleTimeString('en-US', { timeZone: userTimeZone });
  const dateFormatted = `${day}/${month}/${year}`;

  const longDateFormatted = dateObj.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: userTimeZone
  });

  const shortFullFormatted = dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimeZone
  });

  const longFullFormatted = dateObj.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimeZone
  });

  const defaultFormat = dateObj.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: userTimeZone
  });

  // 🧮 Additional requested formats
  const customFormats = {
    DDMMYYYY: `${day}${month}${year}`,
    DDMMYY: `${day}${month}${shortYear}`,
    MMDDYY: `${month}${day}${shortYear}`,
    MMYYYY: `${month}${year}`,
    MMYY: `${month}${shortYear}`,
    MonthYear: dateObj.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: userTimeZone
    }),
    MonYY: dateObj.toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: userTimeZone
    }),
  };

  // 🧾 Combined object
  const result = {
    // existing rich formats
    full: `${dateFormatted}, ${timeFormatted}`,
    date: dateFormatted,
    time: timeFormatted,
    longdate: longDateFormatted,
    longdatetime: `${longDateFormatted}, ${timeFormatted}`,
    shortfull: shortFullFormatted,
    longfull: longFullFormatted,
    default: defaultFormat,

    // new compact formats
    ...customFormats,
  };

  // 🧠 React-safe default return
  if (!returnObject) return defaultFormat;

  return result;
};



const formatDateTime = (datetimeStr) => {
  const dateObj = new Date(datetimeStr);

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  const dateFormatted = `${day}/${month}/${year}`;
  const timeFormatted = dateObj.toLocaleTimeString();
  const longDateFormatted = dateObj.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const shortFullFormatted = dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const longFullFormatted = dateObj.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const defaultFormat = `${dateFormatted}(${timeFormatted})`;
  return {
    toString: () => defaultFormat,
    full: `${dateFormatted}, ${timeFormatted}`,
    date: dateFormatted,
    time: timeFormatted,
    longdate: `${longDateFormatted}`,
    longdatetime: `${longDateFormatted}, ${timeFormatted}`,
    shortfull: `${shortFullFormatted}`,
    longfull: `${longFullFormatted}`
  };
};

// incomplete
const newformatDateTime = (datetimeStr) => {
  const date = new Date(datetimeStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatDateTimeDifference = (diffMs) => {
  const absDiff = Math.abs(diffMs);

  const days = Math.floor(absDiff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((absDiff % (60 * 60 * 1000)) / (60 * 1000));

  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

  return parts.join(', ');
};

export { formatDate, formatDateDDMMYYYY, formattedDate, datearray, formattedDateLong, formattedDateNoYear, formatDateTime, formatDateTimeDifference }