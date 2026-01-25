import { GeoAddress, GeoCoordinate, CountryAddress, a } from "../datatypes"
export interface FullAddress {
    street?: string
    city?: string
    state?: string
    postalcode?: string
    country?: string
}
export function joinFullAddress(address: FullAddress): string {
    const { street, city, state, postalcode, country } = address
    let result = ''
    if (street) {
        result = street
    }
    if (city) {
        result = `${result}${0 < result.length ? ', ' : ''}${city}`
    }
    if (state) {
        result = `${result}${0 < result.length ? ', ' : ''}${state}`
    }
    if (postalcode) {
        result = `${result}${0 < result.length ? (state ? ' ' : ', ') : ''}${postalcode}`
    }
    if (country) {
        result = `${result}${0 < result.length ? ', ' : ''}${country}`
    }
    return result
}
export function fullAddressToGeoAddress(address: FullAddress, coordinate?: GeoCoordinate): GeoAddress {
    return {
        address: joinFullAddress(address),
        city: address.city,
        state: address.state,
        country: address.country,
        coordinate
    }
}
export function cleanStreet(street: string): { street: string, aptBldgUnit?: string } {
    const unitRegExp = new RegExp(/.*((Unit|#|Apt|Lot)\s*[^\s]*).*/i)
    const parts = unitRegExp.exec(street)
    if (parts) {
        const aptBldgUnit = parts[1]
        return {
            street: street.replace(aptBldgUnit, '').replace('  ', ' ').trim(),
            aptBldgUnit,
        }
    }
    return { street }
}

function addressContainsCountry(addressLine: string, countryAddress: CountryAddress): boolean {
    return addressLine.endsWith(countryAddress.name) ||
        countryAddress.codes.some(code => addressLine.endsWith(code))
}

export function parseFullAddress(addressLine: string, countryAddress?: CountryAddress): FullAddress {
    const addressHasCountry = countryAddress ? addressContainsCountry(addressLine, countryAddress) : true
    const parts = addressLine.split(',').map(t => t.trim()).filter(t => 0 < t.length)
    switch (parts.length) {
        case 1:
            if (addressHasCountry) return { country: parts[0] }
            return { state: parts[0], country: countryAddress?.name }
        case 2: {
            if (addressHasCountry) {
                const [state, postalcode] = parts[0].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
                const country = parts[1]
                return {
                    state,
                    postalcode,
                    country
                }
            }
            const [state, postalcode] = parts[1].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
            return {
                city: parts[0],
                state,
                postalcode,
                country: countryAddress?.name
            }
        }
        case 3: {
            if (addressHasCountry) {
                const [state, postalcode] = parts[1].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
                const country = parts[2]
                return {
                    city: parts[0],
                    state,
                    postalcode,
                    country
                }
            }
            const [state, postalcode] = parts[2].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
            return {
                street: parts[0],
                city: parts[1],
                state,
                postalcode,
                country: countryAddress?.name
            }
        }
        case 4:
        default: {
            if (addressHasCountry) {
                const [state, postalcode] = parts[2].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
                const country = parts[3]
                return {
                    street: parts[0],
                    city: parts[1],
                    state,
                    postalcode,
                    country
                }
            }
            const [state, postalcode] = parts[3].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
            return {
                street: `${parts[0]} ${parts[1]}`,
                city: parts[2],
                state,
                postalcode,
                country: countryAddress?.name
            }
        }
    }
}

export function parseAddress(addressLine: string, countryAddress?: CountryAddress): { address: string, city?: string, state?: string, country?: string } {
    const fullAddress = parseFullAddress(addressLine, countryAddress)
    return {
        address: joinFullAddress(fullAddress),
        city: fullAddress.city,
        state: fullAddress.state,
        country: fullAddress.country
    }
}
