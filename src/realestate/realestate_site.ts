import { ReactNode } from 'react'
export interface PropertyInfo {
    Type?: string
    Year?: string
    HOA?: string
    Garage?: string
    Price?: string
    Bedrooms?: string
    Bathrooms?: string
    Sqft?: string
    Address?: string
    Picture?: ReactNode
    createMapButton?: (text: string, onClick: () => void) => ReactNode
}

export interface FeedPage {
    isFeedPage: (href: string) => boolean;
    getFeedPageMapToggleButtons: () => Promise<HTMLElement[]>;
    insertContainerOnFeedPage: (container: HTMLElement) => Promise<void>;
}
export interface ListingPage {
    isListingPage: (href: string) => boolean;
    getListingPageMapToggleElement: () => Promise<HTMLElement>;
    insertContainerOnListingPage: (container: HTMLElement) => Promise<void>;
}
export interface SinglePropertyPage {
    isSinglePropertyPage: (href: string) => boolean;
    getSinglePageMapToggleElement: () => Promise<HTMLElement>;
    insertContainerOnSinglePropertyPage: (container: HTMLElement) => Promise<void>;
    scrapeSinglePropertyPage: () => Promise<PropertyInfo>
}
export interface RealEstateSite {
    name: string;
    containerId: string;
    isSupported: (href: string) => boolean;
    feedPage?: FeedPage;
    listingPage: ListingPage;
    singlePropertyPage: SinglePropertyPage;
}