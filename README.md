# userscript-collection
Collection of userscripts for various purposes

## aiassistantsiteproxy
- stages an 'ai assistant agent' as userscript for chatgpt/googlegemini/microsoftcopilot
- stages an 'ai assistant agent proxy' as userscript for a locally hosted 'empty' webpage.
- This allows developer to enqueue 'ai ask' requests to the ai assistant agent proxy, who then communicates to the 3 ai assistant agents to ask the question
- Bot respones are collected (along with question) by agent and posted to be received by ai assistant agent proxy
- The 'ai assistant agent proxy' then periodically polls a REST API to obtain enqueued 'asks', and, as responses are received, it will call a POST REST API to post the aggregated responses.
- Supported Sites:
    - https://chatgpt.com
    - https://gemini.google.com
    - https://copilot.microsoft.com
- aiassistantsite.config.ts contains info to configure
    - note: webserver.config.ts contains url base setting for associated webserver for all userscripts
    - REST API url base
    - Dashboard url base and Dashboard page
    - note changes to url base will require changes to userscript-header.ts @include


## jobcollectoraggregator
- stages a 'job collector' as userscript for MANY different job sites. 
- As user observes a job they like on the site, they can choose to 'collect'/'capture' it, storing information along with site origin
- stages a 'job aggregator' as userscript for locally hosted webpage
- this allows the user to select jobs from a variety of sites, and aggregate them into a single location for tracking
- the 'job aggregator', upon webpage load, will post the collected sites to a REST API
- Supported Sites:
    - https://www.builtinboston.com/#application-tracker-section
    - https://www.dice.com/my-jobs
    - https://trueup.io/jobtracker
    - https://myjobs.indeed.com/saved
    - https://www.linkedin.com/my-items/saved-jobs
    - https://www.usajobs.gov/applicant/dashboard/savedjobs
    - https://app.welcometothejungle.com/
- jobcollectoraggregator.config.ts contains info to configure
    - note: webserver.config.ts contains url base setting for associated webserver for all userscripts
    - REST API url base
    - Dashboard url base and Dashboard page
    - note changes to url base will require changes to userscript-header.ts @include

## downdetector
- userscript for 3 of downdetector pages: home page, status page, and status map page
- This userscript is more aligned with how/why userscripts are normally created. Got sick of having to sift through the webpage to get what we care about (as developers), and then also added some filtering/sorting features with metadata showing.
- End result is those 3 pages are 'overlaid' with a dialog panel showing just what we want to see without any other mess.
- Supported Sites:
    - https://downdetector.com/
    - https://downdetector.com/status/<company-name>/
    - https://downdetector.com/status/<company-name>/map
- Also added functions to fetch health status of major cloud resources with a mapping to companies that rely on them so perhaps you could say 'oh this site depends on cloudflare, and it is having a major outage'
- Also added fetch of a breakdown of outages from geoblackout. This data is joined with downdetector data and service data to provide greater insight around the services listed by down detector
- Wanted to see downdetector listings without all the surrounding ads etc.. And then also wanted to have a better understanding of why things may be down (added service health fetches), and then also wanted to know the breakdown of what is really down in that service (added geoblackout fetches).
   This way you can see the service/company's down detector graph, see health of services it relies upon, and see the breakdown of what parts are seen as having issues. This info carries through to the downdetector company status and status-map pages.

## TheLayoff
- userscript for pages on TheLayoff.com
- Aggregates them into an easier to read dashboard with sorting, wanted to see only certain sites, and get to the guts of things without too many clicks.. meh
- wanted to see postings in one place without a lot of stuff inbetween. Also wanted to isolate ones by company etc..

## Realestate
- userscript for redfin/realtor/zoopla(uk)
- looking for realestate along ocean, so wanted to toggle map on different pages
- also scrapes info when on single property page so you don't have to dig for it
- Wanted to look through open properties and know their closeness to the ocean.

## Geocoding
- Country-State-City data: npm 'country-state-city' provides an exhaustive organized collection of world-wide mappings Country => States => Cities with lat/lon for the centroids of the country/state/city
- GIS coastal shapefiles. These are used to define what is a coastline so properties close to coast can be more easily identified.
    - US: https://catalog.data.gov/dataset/tiger-line-shapefile-current-nation-u-s-coastline
    - UK: https://osdatahub.os.uk/data/downloads/open/GeoCoast_Open
- Due to the sheer volume of data the definition of country-state-city filters are established so we can 'trim' and partition the data for dynamic usage
- Code generation:
    - Country-state-City creates a world map
    - Region filter is applied to geocode the world map just for those regions
    - GIS chunks used when geocoding the map are identified and built into project
    - runtime code uses 
        - the now geocoded (generated) world map
        - the GIS chunks for what was geocoded (figuring out closest to coast etc..)

## IndexedDB
Due to performance and memory issues with Realestate and geocoding, [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via [npm idb](https://www.npmjs.com/package/idb)) is used as a 'cache' for realestate and geocoding information (country-state-city, and shapefile geojson indexes)

The IndexedDB is also wrapped for use just like GM_[set/get]Value.
### IndexedDB is a Client(browser) side framework that stores db files locally
A [google search for IndexedDB file locations](https://www.google.com/search?q=where+are+indexeddb+files+stored&oq=where+are+indexeddb+files+stored) produced the following AI overview:

> 
> IndexedDB data is stored locally on the user's computer within the browser's profile directory, specific to each browser and operating system. The exact physical file locations are generally obfuscated to prevent direct access, as interaction is intended solely through the IndexedDB API in JavaScript. 
> 
> #### Typical File Locations
> The exact path varies by operating system and browser:
> - Google Chrome / Microsoft Edge (Windows): C:\Users\<user>\AppData\Local\Google\Chrome\User Data\Default\IndexedDB\ (or the corresponding path for Edge)
> - Mozilla Firefox (Windows): %AppData%\Roaming\Mozilla\Firefox\Profiles\<profile name>\storage\persistent\<origin>\idb\
> - Mozilla Firefox (Linux): ~/.mozilla/firefox/<profile name>/storage/persistent/<website>
> - Google Chrome (macOS): ~/Library/Application Support/Google/Chrome/Default/IndexedDB/ (approximate path)
> 
> Within these directories, data is further organized by the website's origin (domain/subdomain). Chrome, for example, uses Google's LevelDB system to manage the underlying storage files. 
> 
> #### How to View the Data
> The intended way to view, modify, or debug IndexedDB data is through the browser's Developer Tools: 
> Open DevTools by right-clicking the webpage and selecting Inspect, or by pressing F12 (or Ctrl+Shift+I / Command+Option+I).
> 
> - Navigate to the Application (Chrome/Edge) or Storage (Firefox) tab.
> - Expand the IndexedDB menu in the sidebar to see available databases and their object stores for the current website's origin.
> - Clicking on an object store will display the stored key-value pairs in a table format. 

#### Example for this project.
- I develop using a Mac, and chrome browser.
    - `~/Library/Application Support/Google/Chrome/Default/IndexedDB/`
    Is the default profile collection of IndexedDB. I tend to use a chrome profile so the IndexedDB directory containing the dbs for my project are found under `~/Library/Application Support/Google/Chrome/Profile 2/IndexedDB/`
    - IndexedDB's are created in the context of whatever page runs your indexeddb code. So to view that indexeddb you will need to:
        - navigate to that page
        - open devtools
        - choose Application tab
        - find your indexeddb(s) under Storage panel on left menu
        - choose your db name, and instance (under name) and on the right you'll see the name-value pairs of that instance
- The realestate userscript uses geocoding module so that userscript uses IndexedDB. It creates 2 databases, each with 1 instance:
    - `realestate` (db)
        - `GM-Values` (instance)
           This instance retains data via same api prototype as `GM_[get/set]Value`
            - schema:
                - `DatabaseCreatedTime`field - ms time since epoch date of db creation
                - `<realestate-source>.<numeric>` field - stores properties, as json string, scraped from that realestate-source. The properties have the following schema definition:
                    - `timestamp` field - ms time since epoch date record storage. This is used to 'age out' or 'expire' the record.
                    - `serializedData` field - json string of property
            - Data is lazily loaded from a dynamic module import, and stored (cached) directly into the indexeddb. So the indexeddb is only as large as the data accessed by the userscript.
    - `realestate-Geocoding` (db)
        - `Country` (instance)
            This instance retains `country-state-city`, `geocoded country-state-city`, and geojson indexes from different sources.
                - schema:
                    - `DatabaseCreatedTime`field - ms time since epoch date of db creation
                    - `Country.<country-name>`field - retains json string of that `country-state-city` object
                    - `GeocodedCountryExtension.<country-name>` field retains json string of the geocoded data for that `country-state-city`
                    - `tl_2025_us_coastline.<index>` - a geojson part/index converted from shapefile `tl_2025_us_coastline.shp` (shapefile of continental us coastline)
                    - `ukcp18_uk_marine_coastline_hires.<index>` - a geojson part/index converted from shapefile `ukcp18-uk-marine-coastline-hires.shp` (shapefile of UK coastline)
                - Data is lazily loaded from a dynamic module import, and stored (cached) directly into the indexeddb. So the indexeddb is only as large as the data accessed by the userscript.



- The realestate userscript supports Redfin.com, Realtor.com, and Zoopla.co.uk. This means for any of those sites you will may have 2 indexeddbs whose size is only as large ad the data collected on that specific site.
- `cleanup-indexeddbs` script can be altered to clean up the realestate IndexedDBs in your browser IndexedDB area.