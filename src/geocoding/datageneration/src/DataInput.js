import Path from 'path'
import fs from 'fs'
import {
    datagenerationDirname,
    inputDataFilesDirname,

    USCoastalRegionInputShapeFilename,
    UKCoastalRegionInputShapeFilename,

    USCoastalRegionDatasourceName,
    UKCoastalRegionDatasourceName,
} from './names.js'
import { USCoastalRegionIsoCodeMap } from '../geodata/us_coastline_regionisomap.js'
import { UKCoastalRegionIsoCodeMap } from '../geodata/uk_coastline_regionisomap.js'
import { UsageCountryMap } from '../geodata/usage_country_map.js'
import { toTitleCase } from './functions.js'

export const WorldRegionIsoCodeMap = {
    ...USCoastalRegionIsoCodeMap,
    ...UKCoastalRegionIsoCodeMap
}
export const GeoDataInputArray = (geocodingDirpath) => {
    if (!fs.existsSync(geocodingDirpath)) {
        throw new Error(`GeoDataInput: directory ${geocodingDirpath} does not exist`)
    }
    const result = [
        {
            geocodingDirpath,
            datasourceSymbolName: toTitleCase(USCoastalRegionDatasourceName),
            datasourceName: USCoastalRegionDatasourceName,
            shapeFilepath: Path.join(geocodingDirpath, datagenerationDirname, inputDataFilesDirname, USCoastalRegionInputShapeFilename),
            regionIsoCodeMap: USCoastalRegionIsoCodeMap
        },
        {
            geocodingDirpath,
            datasourceSymbolName: toTitleCase(UKCoastalRegionDatasourceName),
            datasourceName: UKCoastalRegionDatasourceName,
            shapeFilepath: Path.join(geocodingDirpath, datagenerationDirname, inputDataFilesDirname, UKCoastalRegionInputShapeFilename),
            regionIsoCodeMap: UKCoastalRegionIsoCodeMap
        },
    ]
    result.forEach(item => {
        if (!fs.existsSync(item.shapeFilepath)) {
            throw new Error(`GeoDataInput: Shapefile ${item.shapeFilepath} does not exist`)
        }
    })
    return result
}

export const CountryDataInput = (geocodingDirpath) => {
    if (!fs.existsSync(geocodingDirpath)) {
        throw new Error(`CountryDataInput: directory ${geocodingDirpath} does not exist`)
    }
    return {
        geocodingDirpath,
        usageCountryMap: UsageCountryMap
    }
}