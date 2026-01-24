import fs from 'fs'
import Path from 'path'
import { outputDataFilesDirname, GeocodeMapsCoAPIConfigFilename } from './src/names.js'

const GeocodeMapsCoConfig = {
    geocodeMapsCoAPIKey: process.env['GEOCODE_MAPS_CO_API_KEY'],
    requestPerSecond: 5,
    maxAttempts: 5,
}

const help = (scriptName) => {
    console.log(`USAGE: ${scriptName} <geocoding-source-directory>`)
    console.log(`<geocoding-source-directory> - full path to src/geocoding`)
    console.log('generates configuration json file for geocode.maps.co API to resolve address to lat/lon')
}

async function main() {
    const argvArray = process.argv
    const scriptNameArgument = Path.basename(argvArray[1])
    if (['?', '-?', 'h', 'help', '-h', '-help', undefined].includes(process.argv[2])) {
        help(scriptNameArgument)
        return
    }
    const geocodingDirpathArgument = argvArray[2]
    console.log(`${scriptNameArgument} ${process.argv.slice(2).join(' ')}`)

    const configFilepath = Path.join(geocodingDirpathArgument, outputDataFilesDirname, GeocodeMapsCoAPIConfigFilename)
    console.log(`Generating https://geocode.maps.co/ API configuration json for geocoding_api`)
    if (fs.existsSync(configFilepath)) {
        console.log(` - skipping, ${Path.basename(configFilepath)} already generated.`)
        return
    }
    await fs.promises.writeFile(configFilepath, JSON.stringify(GeocodeMapsCoConfig), 'utf8')
    console.log(`done! generated ${Path.basename(configFilepath)} for import/use in geocoding_api`)
}
main()
