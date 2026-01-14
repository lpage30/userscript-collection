import {
  isEmpty,
  isString,
  isDate,
  noPad,
  zeroPad,
  toString,
} from "./functions";

export const ONE_SECOND = 1000;
export const ONE_MINUTE = 60 * ONE_SECOND;
export const ONE_HOUR = 60 * ONE_MINUTE;
export const ONE_DAY = 24 * ONE_HOUR;
export const ONE_WEEK = 7 * ONE_DAY;
export const ONE_MONTH = 2629746000
export const ONE_YEAR = 31556952000

export const toEpochOffset = (days: number, hours: number) => ((days * ONE_DAY) + (hours * ONE_HOUR))

export const TIME_TYPE = {
  DAY: "DAY",
  HOUR: "HOUR",
  MINUTE: "MINUTE",
  SECOND: "SECOND",
  MILLISECOND: "MILLISECOND",
};

export type TIME_UNIT_TYPE = 'years' | 'year' | 'months' | 'month' | 'weeks' | 'week' | 'days' | 'day' | 'hours' | 'hour' | 'minutes' | 'minute' | 'seconds' | 'second'
const FORMAT_SIZE_TYPE = {
  SHORT: "SHORT",
  LONG: "LONG",
};
export const TIME_FORMAT_TYPE = {
  ...FORMAT_SIZE_TYPE,
  MONTH_DAY_YEAR: "MONTH_DAY_YEAR",
  TIMEZONE: "TIMEZONE",
};

export function formatDuration(
  time: number,
  options = {
    timeType: undefined,
    timeFormat: undefined,
  },
) {
  const {
    timeType = TIME_TYPE.MINUTE,
    timeFormat = TIME_FORMAT_TYPE.TIMEZONE,
  } = options ?? {};
  let days, hours, minutes, seconds, milliseconds: number | undefined;
  switch (timeType) {
    case "DAY":
      days = time;
      hours = 0;
      minutes = 0;
      break;
    case "HOUR":
      days = Math.floor(time / 24);
      hours = time % 24;
      minutes = 0;
      break;
    case "MINUTE":
      days = Math.floor(time / (24 * 60));
      hours = Math.floor((time - days * 24 * 60) / 60);
      minutes = (time - days * 24 * 60) % 60;
      break;
    case "SECOND":
      days = Math.floor(time / (24 * 60 * 60));
      hours = Math.floor((time - days * 24 * 60 * 60) / (60 * 60));
      minutes = Math.floor((time - days * 24 * 60 * 60 - hours * 60 * 60) / 60);
      seconds = (time - days * 24 * 60 * 60 - hours * 60 * 60) % 60;
      break;
    case "MILLISECOND":
      days = Math.floor(time / (24 * 60 * 60 * 1000));
      hours = Math.floor(
        (time - days * 24 * 60 * 60 * 1000) / (60 * 60 * 1000),
      );
      minutes = Math.floor(
        (time - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000) /
          (60 * 1000),
      );
      seconds = Math.floor(
        (time -
          days * 24 * 60 * 60 * 1000 -
          hours * 60 * 60 * 1000 -
          minutes * 60 * 1000) /
          1000,
      );
      milliseconds =
        (time -
          days * 24 * 60 * 60 * 1000 -
          hours * 60 * 60 * 1000 -
          minutes * 60 * 1000) %
        1000;
      break;
    default:
      throw new Error(`formatDuration: unsupported timeType ${timeType}`);
  }
  let result = "";
  let leadNumberPad = noPad;
  let tailNumberPad = zeroPad;
  if (TIME_FORMAT_TYPE.TIMEZONE === timeFormat) {
    result += time < 0 ? "-" : "+";
    hours += days * 24;
    days = 0;
    seconds = undefined;
    milliseconds = undefined;
    leadNumberPad = zeroPad;
  }
  if (TIME_FORMAT_TYPE.LONG === timeFormat) {
    tailNumberPad = noPad;
  }
  if (days !== 0) {
    result += `${leadNumberPad(days, days >= 100 ? 3 : 2)} days, `;
  }
  result += leadNumberPad(hours, hours >= 1000 ? 4 : hours >= 100 ? 3 : 2);
  result += TIME_FORMAT_TYPE.LONG === timeFormat ? " hrs " : ":";
  result += tailNumberPad(minutes, 2);
  result += TIME_FORMAT_TYPE.LONG === timeFormat ? " min " : "";

  if (!isEmpty(seconds)) {
    if (TIME_FORMAT_TYPE.LONG !== timeFormat) result += ":";
    result += tailNumberPad(seconds, 2);
    result += TIME_FORMAT_TYPE.LONG === timeFormat ? " sec " : "";
  }
  if (!isEmpty(milliseconds)) {
    if (TIME_FORMAT_TYPE.LONG !== timeFormat) result += ".";
    result += tailNumberPad(milliseconds, 3);
    result += TIME_FORMAT_TYPE.LONG === timeFormat ? " ms " : "";
  }
  if (TIME_FORMAT_TYPE.SHORT === timeFormat) {
    result += " hours";
  }
  return result.trim();
}
export function toDuration(timeValue: number, timeUnit: TIME_UNIT_TYPE): number {
  switch(timeUnit) {
    case 'years':
    case 'year':
      return timeValue * ONE_YEAR
    case 'months':
    case 'month':
      return timeValue * ONE_MONTH
    case 'weeks':
    case 'week':
      return timeValue * ONE_WEEK
    case 'days':
    case 'day':
      return timeValue * ONE_DAY
    case 'hours':
    case 'hour':
      return timeValue * ONE_HOUR
    case 'minutes':
    case 'minute':
      return timeValue * ONE_MINUTE
    case 'seconds':
    case 'second':
      return timeValue * ONE_SECOND
    default:
      return timeValue
  }
}
export const toDurationString = (ms: number) => formatDuration(ms, { timeType: TIME_TYPE.MILLISECOND, timeFormat: TIME_FORMAT_TYPE.SHORT})
export const toDate = (date: string | Date | number): Date | null => {
  if (isDate(date)) return date;
  if (isString(date)) return parseDate(date);
  return new Date(date);
};

export const toMonthYearDate = (date: string | Date | number) => {
  const dt = toDate(date);
  return dt
    ? `${zeroPad(dt.getUTCMonth() + 1, 2)}/${zeroPad(dt.getUTCFullYear(), 4)}`
    : (date as string);
};
export const toMonthDayYearDate = (date: string | Date | number) => {
  const dt = toDate(date);
  return dt
    ? `${zeroPad(dt.getUTCMonth() + 1, 2)}/${zeroPad(dt.getUTCDate(), 2)}/${zeroPad(dt.getUTCFullYear(), 4)}`
    : (date as string);
};
export const toMonthDayYearDateTime = (date: string | Date | number) => {
  const dt = toDate(date);
  return dt
    ? `${zeroPad(dt.getUTCMonth() + 1, 2)}/${zeroPad(dt.getUTCDate(), 2)}/${zeroPad(dt.getUTCFullYear(), 4)}@${zeroPad(dt.getHours(), 2)}:${zeroPad(dt.getMinutes(), 2)}`
    : (date as string);
};
export const parseDate = (dateString: string): Date | null => {
  if (isEmpty(dateString)) {
    return null;
  }
  let epoch = Date.parse(dateString);
  if (Number.isNaN(epoch)) {
    const parts = dateString.split(/[-/]/);
    epoch = Date.parse(`${parts[0]}/01/${parts[1]}`);
    if (Number.isNaN(epoch)) {
      return null;
    }
  }
  return new Date(epoch);
};
export const dateToString = (date: string | Date | number): string => {
  const dt = toDate(date);
  return dt
    ? `${zeroPad(dt.getMonth() + 1, 2)}/${zeroPad(dt.getDate(), 2)}/${zeroPad(dt.getFullYear(), 4)}`
    : (date as string);
};

export const formatFileDate = (date: string | Date | number): string => {
  const dt = toDate(date);

  return dt
    ? dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : (date as string);
};

export const parseDateTime = (timeAgoString: string): Date | undefined => {
  const timeAgoRegex = /[. ]*(\d+) ([^ ]+).*/g
  const parts = timeAgoRegex.exec(` ${timeAgoString}`)
  if (null == parts) return undefined

  const timeValue = parseInt(parts[1])
  const timeUnit = parts[2] as TIME_UNIT_TYPE
  return new Date(Date.now() - toDuration(timeValue, timeUnit))
}