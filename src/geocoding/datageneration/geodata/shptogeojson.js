import shp from 'shpjs'
import fs from 'fs'

async function shapeToGeojson(shapeFilepath, jsonFilepath) {
    try {
        console.log(`Loading Shapefile: ${shapeFilepath}`)
        const shpData = await fs.promises.readFile(shapeFilepath);
        console.log(`Converting to Geojson...`)
        const geojson = await shp({shp: shpData})
        console.log(`Writing Geojson as ${jsonFilepath}`)
        await fs.promises.writeFile(jsonFilepath, JSON.stringify(geojson), 'utf8')
        console.log('Finished')
    } catch (e) {
        console.error(`Failed converting ${shapeFilepath} to ${jsonFilepath}`, e)
    }
}

shapeToGeojson(process.argv[2], process.argv[3])