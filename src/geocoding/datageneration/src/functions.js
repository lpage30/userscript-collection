export function toJsonFilename(filenamePrefix, index) {
    return `${filenamePrefix}_${index}.json`
}

export function toTitleCase(underscoreName) {
    const parts = underscoreName.split('_')
    return parts.reduce((titlecase, part) => `${titlecase}${part[0].toUpperCase()}${part.substring(1)}`, '')
}

export function durationToString(durationms) {
    let remainingDurationms = durationms
    const one_second = 1000
    const one_minute = 60 * one_second
    const one_hour = 60 * one_minute

    const hours = Math.floor(remainingDurationms / one_hour)
    remainingDurationms = remainingDurationms - (hours * one_hour)

    const minutes = Math.floor(remainingDurationms / one_minute)
    remainingDurationms = remainingDurationms - (minutes * one_minute)

    const seconds = Math.floor(remainingDurationms / one_second)
    remainingDurationms = remainingDurationms - (seconds * one_second)

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(remainingDurationms).padStart(3, '0')}`
}
