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
  YEAR: "YEAR",
  MONTH: "MONTH",
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
  LARGESTSINGLE: "LARGESTSINGLE"
};
export const TIME_FORMAT_TYPE = {
  ...FORMAT_SIZE_TYPE,
  MONTH_DAY_YEAR: "MONTH_DAY_YEAR",
  TIMEZONE: "TIMEZONE",
};

export function breakdownDuration(duration: number, durationType: string /* TIME_TYPE */): {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
} {
  let remainingTime = duration
  let years = 0
  let months = 0
  let days = 0
  let hours = 0
  let minutes = 0
  let seconds = 0
  let milliseconds = 0

  switch (durationType) {
    case "YEAR": {
      years = Math.floor(remainingTime)
      remainingTime -= years
      months = Math.floor(12 * remainingTime)
      remainingTime *= months / 12
      const daysInMonth = new Date(new Date().getFullYear(), months + 1, 0).getDate()
      days = Math.floor(daysInMonth * remainingTime)
      remainingTime *= days / daysInMonth
      hours = Math.floor(24 * remainingTime)
      remainingTime *= hours / 24
      minutes = Math.floor(60 * remainingTime)
      remainingTime *= minutes / 60
      seconds = Math.floor(60 * remainingTime)
      remainingTime *= seconds / 60
      milliseconds = Math.floor(1000 * remainingTime)
    }
      break
    case "MONTH": {
      years = Math.floor(remainingTime / 12)
      remainingTime -= years * 12
      months = Math.floor(remainingTime)
      remainingTime -= months
      const daysInMonth = new Date(new Date().getFullYear(), months + 1, 0).getDate()
      days = Math.floor(daysInMonth * remainingTime)
      remainingTime *= days / daysInMonth
      hours = Math.floor(24 * remainingTime)
      remainingTime *= hours / 24
      minutes = Math.floor(60 * remainingTime)
      remainingTime *= minutes / 60
      seconds = Math.floor(60 * remainingTime)
      remainingTime *= seconds / 60
      milliseconds = Math.floor(1000 * remainingTime)
    }
      break
    case "DAY": {
      years = Math.floor(remainingTime / 365)
      remainingTime -= years * 365
      months = Math.floor(remainingTime / 12)
      remainingTime -= months * 12
      days = Math.floor(remainingTime)
      remainingTime -= days
      hours = Math.floor(24 * remainingTime)
      remainingTime *= hours / 24
      minutes = Math.floor(60 * remainingTime)
      remainingTime *= minutes / 60
      seconds = Math.floor(60 * remainingTime)
      remainingTime *= seconds / 60
      milliseconds = Math.floor(1000 * remainingTime)
    }
      break
    case "HOUR": {
      years = Math.floor(remainingTime / (365 * 24))
      remainingTime -= years * (365 * 24)
      const hrsIntoYear = Math.floor(remainingTime / 12)
      let remainingHrsIntoYear = hrsIntoYear
      for (let i = 1; i <= 12; i++) {
        remainingHrsIntoYear -= (new Date(new Date().getFullYear(), i, 0).getDate() * 24)
        if (remainingHrsIntoYear <= 0) {
          months = i
          remainingHrsIntoYear = Math.abs(remainingHrsIntoYear)
          break
        }
      }
      remainingTime -= (hrsIntoYear - remainingHrsIntoYear)
      days = Math.floor(remainingTime / 24)
      remainingTime -= days * 24
      hours = Math.floor(remainingTime)
      remainingTime -= hours
      minutes = Math.floor(60 * remainingTime)
      remainingTime *= minutes / 60
      seconds = Math.floor(60 * remainingTime)
      remainingTime *= seconds / 60
      milliseconds = Math.floor(1000 * remainingTime)
    }
      break;
    case "MINUTE": {
      years = Math.floor(remainingTime / (365 * 24 * 60))
      remainingTime -= years * (365 * 24 * 60)
      const minutesIntoYear = Math.floor(remainingTime / 12)
      let remainingMinutesIntoYear = minutesIntoYear
      for (let i = 1; i <= 12; i++) {
        remainingMinutesIntoYear -= (new Date(new Date().getFullYear(), i, 0).getDate() * 24 * 60)
        if (remainingMinutesIntoYear <= 0) {
          months = i
          remainingMinutesIntoYear = Math.abs(remainingMinutesIntoYear)
          break
        }
      }
      remainingTime -= (minutesIntoYear - remainingMinutesIntoYear)
      days = Math.floor(remainingTime / (24 * 60))
      remainingTime -= days * (24 * 60)
      hours = Math.floor(remainingTime / 60)
      remainingTime -= hours * 60
      minutes = Math.floor(remainingTime)
      remainingTime -= minutes
      seconds = Math.floor(60 * remainingTime)
      remainingTime *= seconds / 60
      milliseconds = Math.floor(1000 * remainingTime)
    }
      break
    case "SECOND": {
      years = Math.floor(remainingTime / (365 * 24 * 60 * 60))
      remainingTime -= years * (365 * 24 * 60 * 60)
      const secondsIntoYear = Math.floor(remainingTime / 12)
      let remainingSecondsIntoYear = secondsIntoYear
      for (let i = 1; i <= 12; i++) {
        remainingSecondsIntoYear -= (new Date(new Date().getFullYear(), i, 0).getDate() * 24 * 60 * 60)
        if (remainingSecondsIntoYear <= 0) {
          months = i
          remainingSecondsIntoYear = Math.abs(remainingSecondsIntoYear)
          break
        }
      }
      remainingTime -= (secondsIntoYear - remainingSecondsIntoYear)
      days = Math.floor(remainingTime / (24 * 60 * 60))
      remainingTime -= days * (24 * 60 * 60)
      hours = Math.floor(remainingTime / (60 * 60))
      remainingTime -= hours * 60 * 60
      minutes = Math.floor(remainingTime / 60)
      remainingTime -= minutes * 60
      seconds = Math.floor(remainingTime)
      remainingTime *= seconds
      milliseconds = Math.floor(1000 * remainingTime)
    }
      break;
    case "MILLISECOND":
      years = Math.floor(remainingTime / ONE_YEAR)
      remainingTime -= (years * ONE_YEAR)
      months = Math.floor(remainingTime / ONE_MONTH)
      remainingTime -= (months * ONE_MONTH)
      days = Math.floor(remainingTime / ONE_DAY)
      remainingTime -= (days * ONE_DAY)
      hours = Math.floor(remainingTime / ONE_HOUR)
      remainingTime -= (hours * ONE_HOUR)
      minutes = Math.floor(remainingTime / ONE_MINUTE)
      remainingTime -= (minutes * ONE_MINUTE)
      seconds = Math.floor(remainingTime / ONE_SECOND)
      remainingTime -= (seconds * ONE_SECOND)
      milliseconds = remainingTime
      break;
    default:
      throw new Error(`formatDuration: unsupported timeType ${timeType}`);
  }
  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds
  }
}

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
  let { years, months, days, hours, minutes, seconds, milliseconds } = breakdownDuration(time, timeType)

  let result = "";
  let leadNumberPad = noPad;
  let tailNumberPad = zeroPad;
  if (TIME_FORMAT_TYPE.LARGESTSINGLE === timeFormat) {
    const values: number[] = [years, months, days, hours, minutes, seconds, milliseconds]
    const names: string[] = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds']
    for (let i = 0; i < values.length; i++) {
      if (0 !== values[i]) {
        return `${values[i]} ${names[i]} ago`
      }
    }
    return 'now'
  }
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
  switch (timeUnit) {
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

export const toDurationString = (ms: number) => formatDuration(ms, { timeType: TIME_TYPE.MILLISECOND, timeFormat: TIME_FORMAT_TYPE.SHORT })
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