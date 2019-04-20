# Airbnb Scraper in TypeScript
This repo contains a simple scraper that given an Airbnb listing URL returns JSON formatted listing information.

## Running the scraper
```
npm install
tsc
node bin/scrape.js
```
## Overview
The way this scraper works is by extracting the commented out JSON data inside a script tag in the page. Other approaches like using a headless browser were also attempted but they were less efficient and more error prone.

The `Scraper` class accepts a listing URL and has two public methods: `getWebsiteData` and `getListingData`.

`getWebsiteData` is called to download the listing page and parse relevant information as well as call the pricing API to get the pricing information for the property (if dates are specified in the URL).

`getListingData` is a method that performs all the parsing and returns a JSON object with the extracted data.

## Parsed data
Currently the scraper extracts the following information:
* Listing ID and query information like check in and check out dates
* All photos of the property
* Total price for the property for the specified dates, as well as a price breakdown
* Full description
* Amenities and their descriptions
* Bedrooms, Beds, Bathrooms, Capacity, Star rating

There is a lot more information which can be extracted from the listing data object, but I believe that the above should be sufficient for the purpose of this exercise.

## Edge cases and error conditions
Web scraping is a very error prone process due to the dynamic nature of websites. In the cases of Airbnb it is especially tricky as their website is in the form of a single page app where the page is rendered dynamically and using only HTTP requests will not retrieve the whole information. In cases like this there are two other options: use a headless browser or look if it is possible to simulate the data retrieval by calling APIs. Luckily in this case most of the data is inside a script tag, represented as a commented out JSON object. The rest of the data is retrieved using one API call.

The main error scenarios are:
* insufficient data in the URL, like missing dates or adults - in this case only partial scraping is performed
* missing data inside the JSON object
* missing listing (404)

The scraper covers the main errors cases for this exercise.

## Potential improvemetns
Given more time a good potential improvement is to add some local test cases with sample data as well as use more of TypeScript's static checking by utilising custom types and iterfaces.
