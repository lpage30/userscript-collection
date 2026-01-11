import React, {ReactNode, CSSProperties} from 'react'
import { PropertyInfo } from './propertyinfotypes'
import { scaleDimension } from '../common/ui/style_functions'
import { getHeightWidth } from '../common/ui/style_functions'

const bpHomeCardPhotoImage: CSSProperties = {
    objectFit: 'cover',
    objectPosition: 'center',
}

export function toScaledImg(
    imgData: {src: string, width: number, height: number} | undefined,
    maxPropertyInfoImageWidth: number,
    propertyInfo: Partial<PropertyInfo>,
    className?: string
): ReactNode | undefined
{
    if ([null, undefined].includes(imgData)) return undefined
    const { width, height } = scaleDimension(imgData, maxPropertyInfoImageWidth, true)
    return (<img
        src={imgData.src}
        title={propertyInfo.address}
        alt={propertyInfo.address}
        className={className}
        height={`${height}px`}
        width={`${width}px`}
        loading={'eager'}
        fetchPriority={'high'}
        style={{...bpHomeCardPhotoImage}}
    />)

}
export function toScaledPicture(
    img: HTMLImageElement | undefined,
    maxPropertyInfoImageWidth: number,
    propertyInfo: Partial<PropertyInfo>
): ReactNode | undefined
{
    return toScaledImg(
        img ? {src: img.src, ...getHeightWidth(img)}: undefined,
        maxPropertyInfoImageWidth,
        propertyInfo,
        img ? img.className : undefined
    )
}
