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

## TheLayoff
- userscript for pages on TheLayoff.com
- Aggregates them into an easier to read dashboard with sorting, wanted to see only certain sites, and get to the guts of things without too many clicks.. meh

## Realestate
- userscript for redfin/realtor
- looking for realestate along ocean, so wanted to toggle map on different pages
- also scrapes info when on single property page so you don't have to dig for it

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


   