// @grant       GM_xmlhttpRequest
import exifr from 'exifr'
import { GeoCoordinate } from '../datatypes'

export interface ExifData {
    gps?: GeoCoordinate
    parsed: { [key: string]: any }
}
export interface ImageMetadata {
    src: string
    name: string
    exif?: ExifData
}
interface LoadImageResponse {
    name: string,
    img: ArrayBuffer
}
function loadImage(imgSrc: string): Promise<LoadImageResponse> {
    return new Promise<LoadImageResponse>((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: imgSrc,
            responseType: 'arraybuffer',
            onload: (response: GM_xmlhttpRequestResponse) => {
                if (response.status < 200 || 300 <= response.status) {
                    reject(new Error(response.statusText))
                    return
                }
                const name = imgSrc.split('/').slice(-1)[0]
                const img: ArrayBuffer = response.response
                resolve({
                    name,
                    img
                })
            },
            onerror: (response) => {
                reject(new Error(`${imgSrc} - ${response['error'] ?? response.statusText}`));
            }
        })
    })
}
interface ExifrParseResponse {
    // Common EXIF Tags
    Make?: string;
    Model?: string;
    DateTimeOriginal?: Date;
    ExposureTime?: number;
    FNumber?: number;
    ISO?: number;
    LensModel?: string;
    Orientation?: number;

    // GPS Data (often normalized to Decimal Degrees)
    latitude?: number;
    longitude?: number;
    GPSLatitude?: number;
    GPSLongitude?: number;

    // Other segments (if parsed)
    XMP?: object;
    IPTC?: object;
    ICC?: object;

    // Index signature for additional/unmapped tags
    [key: string]: any;
}
export async function fetchImgMetadata(imgSrc: string, outputDebug: boolean = false): Promise<ImageMetadata> {
    if (outputDebug) console.log(`Loading ${imgSrc} to extract metadata`)
    const img: LoadImageResponse = await loadImage(imgSrc)
    const result: ImageMetadata = {
        src: imgSrc,
        name: img.name
    }

    if (outputDebug) console.log(`\textracting metadata...`)
    const parsed: ExifrParseResponse = await exifr.parse(img.img)
    if (parsed) {
        if (outputDebug) console.log(`\tMetadata exists: ${JSON.stringify(parsed)}`)
        const lat = parsed.latitude ?? parsed.GPSLatitude
        const lon = parsed.longitude ?? parsed.GPSLongitude
        result.exif = {
            gps: [lat, lon].some(l => isNaN(l)) ? undefined : { lat, lon },
            parsed: Object.entries(parsed).filter(([name]) => !name.endsWith('itude')).reduce((result, [name, value]) => ({
                ...result,
                [name]: value
            }), {} as { [key: string]: any })
        }
    }
    if (outputDebug) console.log(`done! ${result.exif ? 'EXIF data extracted' : 'No EXIF data exists'}`)
    return result
}
