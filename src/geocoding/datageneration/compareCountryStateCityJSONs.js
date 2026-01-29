import Path from 'path'
import { CountryDataInput } from './src/DataInput.js'
import { CountryStateCityMapGenerator } from './src/countrystatecitymap_generator.js'

function compareSortedStringArrays(leftArray, rightArray) {
    const left = leftArray.sort((l, r) => l.localeCompare(r))
    const right = rightArray.sort((l, r) => l.localeCompare(r))
    const result = { left, right, overlap: [], missingInLeft: [], missingInRight: [] }
    let l = 0
    let r = 0
    while (l < left.length || r < right.length) {
        if (l < left.length && r < right.length) {
            const cmp = left[l].localeCompare(right[r])
            if (0 === cmp) {
                result.overlap.push(left[l])
                l = l + 1
                r = r + 1
                continue
            }
            if (cmp < 0) {
                result.missingInRight.push(left[l])
                l = l + 1
                continue
            }
            if (0 < cmp) {
                result.missingInLeft.push(right[r])
                r = r + 1
                continue
            }
        }
        if (l < left.length) {
            result.missingInRight.push(left[l])
            l = l + 1
            continue
        }
        if (r < right.length) {
            result.missingInLeft.push(right[r])
            r = r + 1
            continue
        }
        break
    }
    return result
}
function logCompareResult(leftName, rightName, compareSortedStringArraysResult) {
    const { left, right, overlap, missingInLeft, missingInRight } = compareSortedStringArraysResult
    const messages = []
    if (0 < (missingInLeft.length + missingInRight.length)) {
        messages.push(`${overlap.length} overlap between ${leftName}(${left.length}) and ${rightName}(${right.length})`)
    }
    if (0 < missingInLeft.length) {
        messages.push(`${leftName} missing ${missingInLeft.length} ["${missingInLeft.join('","')}"]`)
    }
    if (0 < missingInRight.length) {
        messages.push(`${rightName} missing ${missingInRight.length} ["${missingInRight.join('","')}"]`)
    }
    if (0 < messages.length) {
        console.log(messages.join('\n\t'))
    }
}

async function main() {
    const scriptNameArgument = Path.basename(process.argv[1])
    const geocodingDirpath = process.argv[2]

    const { loadBaseMap, loadGeocodedMap } = CountryStateCityMapGenerator(CountryDataInput(geocodingDirpath))

    const baseMap = await loadBaseMap('')
    const geocodedMap = await loadGeocodedMap('')


    const countryResult = compareSortedStringArrays(Object.keys(baseMap), Object.keys(geocodedMap))
    logCompareResult('baseCountryNames', 'geocodedCountryNames', countryResult)
    countryResult.overlap.forEach(countryName => {
        let baseStates = []
        let geocodedStates = []
        try {
            baseStates = Object.keys(baseMap[countryName].states)
            geocodedStates = Object.keys(geocodedMap[countryName].states)
            const stateResult = compareSortedStringArrays(baseStates, geocodedStates)
            logCompareResult(`(${countryName}).baseStateNames`, `(${countryName}).geocodedStateNames`, stateResult)

            stateResult.overlap.forEach(stateName => {
                let baseCities = []
                let geocodedCities = []
                try {
                    baseCities = Object.keys(baseMap[countryName].states[stateName].cities)
                    geocodedCities = Object.keys(geocodedMap[countryName].states[stateName].cities)
                    const cityResult = compareSortedStringArrays(baseCities, geocodedCities)
                    logCompareResult(`(${countryName}).(${stateName}).baseCityNames`, `(${countryName}).(${stateName}).geocodedCityNames`, cityResult)

                } catch (e) {
                    throw new Error(`Failed collecting cities for country(${countryName}).state(${stateName}) baseCities(["${baseCities.join('","')}"]) geocodedCities(["${geocodedCities.join('","')}"]). ${e}`)
                }
            })
        } catch (e) {
            if (e.message.startsWith('Failed')) {
                throw e
            }
            throw new Error(`Failed collecting states for Country(${countryName}) baseStates(["${baseStates.join('","')}"]) geocodedStates(["${geocodedStates.join('","')}"]). ${e}`)
        }
    })
}
main()