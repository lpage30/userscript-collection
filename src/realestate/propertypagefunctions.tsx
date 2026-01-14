import React, { ReactNode, CSSProperties } from 'react'
import { PropertyInfo } from './propertyinfotypes'
import { scaleDimension } from '../common/ui/style_functions'
import { getHeightWidth } from '../common/ui/style_functions'

const bpHomeCardPhotoImage: CSSProperties = {
    objectFit: 'cover',
    objectPosition: 'center',
}
interface SerializedElement {
    queryString?: string
    queryStringPickChild?: {
        queryString: string
        childGrandchildIndexes: number[]
    }
    elementId?: string
    elementIdPickChild?: {
        elementId: string
        childGrandchildIndexes: number[]
    }
    queryAllPickItemChild?: {
        queryAllString: string
        itemChildGrandchildIndexes: number[]
    }
}
export function toSerializedElement(arg: SerializedElement): string | undefined {
    if ([undefined, null].includes(arg) || Object.values(arg).every(v => [undefined, null].includes(v))) return undefined
    return JSON.stringify(arg)
}
export function deserializeElement(serializedElement: string): HTMLElement | undefined {
    if ([null, undefined].includes(serializedElement)) return undefined
    const arg: SerializedElement = JSON.parse(serializedElement)
    if (arg.queryString) {
        return document.querySelector(arg.queryString) as HTMLElement | undefined
    }
    if (arg.queryStringPickChild) {
        let item = document.querySelector(arg.queryStringPickChild.queryString) as Element
        for (let i = 0; i < arg.queryStringPickChild.childGrandchildIndexes.length; i += 1) {
            if (undefined === item) return undefined
            item = item.children[arg.queryStringPickChild.childGrandchildIndexes[i]]
        }
        return item as HTMLElement | undefined
    }
    if (arg.elementId) {
        return document.getElementById(arg.elementId) as HTMLElement | undefined
    }
    if (arg.elementIdPickChild) {
        let item = document.getElementById(arg.elementIdPickChild.elementId) as Element
        for (let i = 0; i < arg.elementIdPickChild.childGrandchildIndexes.length; i += 1) {
            if (undefined === item) return undefined
            item = item.children[arg.elementIdPickChild.childGrandchildIndexes[i]]
        }
        return item as HTMLElement | undefined
    }
    if (arg.queryAllPickItemChild) {
        let item = Array.from(document.querySelectorAll(arg.queryAllPickItemChild.queryAllString))[arg.queryAllPickItemChild.itemChildGrandchildIndexes[0]]
        for (let i = 1; i < arg.queryAllPickItemChild.itemChildGrandchildIndexes.length; i += 1) {
            if (undefined === item) return undefined
            item = item.children[arg.queryAllPickItemChild.itemChildGrandchildIndexes[i]]
        }
        return item as HTMLElement | undefined
    }
    return undefined
}

interface SerializedImg {
    imgData: { src: string, width?: number, height?: number } | undefined,
    className?: string
}
export function toSerializedImg(
    imgData: { src: string, width?: number, height?: number } | undefined,
    className?: string
): string | undefined {
    if ([null, undefined].includes(imgData)) return undefined
    return JSON.stringify({
        imgData,
        className
    })
}
export function toImg(
    imgData: { src: string, width?: number, height?: number } | undefined,
    propertyInfo: Partial<PropertyInfo>,
    className?: string
): ReactNode | undefined {
    if ([null, undefined].includes(imgData)) return undefined
    return (<img
        src={imgData.src}
        title={propertyInfo.address}
        alt={propertyInfo.address}
        className={className}
        height={imgData.height ? `${imgData.height}px` : undefined}
        width={imgData.width ? `${imgData.width}px` : undefined}
        loading={'eager'}
        fetchPriority={'high'}
        style={{ ...bpHomeCardPhotoImage }}
    />)
}
export function deserializeImg(serializedImg: string, propertyInfo: Partial<PropertyInfo>): ReactNode | undefined {

    if ([null, undefined].includes(serializedImg)) return undefined
    const args: SerializedImg = JSON.parse(serializedImg)
    return toImg(
        args.imgData,
        propertyInfo,
        args.className
    )
}
export function toScaledImgSerialized(
    imgData: { src: string, width: number, height: number } | undefined,
    maxPropertyInfoImageWidth: number,
    className?: string
): string | undefined {
    if ([null, undefined].includes(imgData)) return undefined
    const { width, height } = scaleDimension(imgData, maxPropertyInfoImageWidth, true)
    return toSerializedImg(
        {
            ...imgData,
            width,
            height,
        },
        className
    )
}
export function toScaledPictureSerialized(
    img: HTMLImageElement | undefined,
    maxPropertyInfoImageWidth: number,
): string | undefined {
    return toScaledImgSerialized(
        img ? { src: img.src, ...getHeightWidth(img) } : undefined,
        maxPropertyInfoImageWidth,
        img ? img.className : undefined
    )
}
export function toPictureSerialized(
    img: HTMLImageElement | undefined,
): string | undefined {
    return toSerializedImg(
        img ? { src: img.src } : undefined,
        img ? img.className : undefined
    )
}