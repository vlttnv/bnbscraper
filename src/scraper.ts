import * as queryString from "query-string";
import * as rp from "request-promise-native";
import * as $ from "cheerio";

interface queryData {
    adults: string | string[] | null | undefined;
    guests: string | string[] | null | undefined;
    dateIn: string | string[] | null | undefined;
    dateOut: string | string[] | null | undefined;
}

interface priceInfo {
    total: number | undefined;
    currency: string;
    breakdown: any;
}

export default class Scraper {
    listingId: string = '';
    query: queryData;
    url: string;
    listingData: any;
    apiKey: string = '';
    apiUrl: string = '';
    price: any;
    amenities: any;
    photos: any;
    miscInfo: any;

    constructor(url: string) {
        this.url = url;
        this.query = this.parseParams(url)
    }

    private parseParams(url: string): queryData {
        const qs = queryString.parse(url.split('?')[1]);
        return {
            adults: qs.adults,
            guests: qs.guests,
            dateIn: qs.check_in,
            dateOut: qs.check_out
        }
    }

    /**
     * Retrieves the listing page and extract the JSON data in one of the script tags.
     * Calls the price API.
     */
    public async getWebsiteData() {
        let resp;
        try {
            resp = await rp(this.url);
        } catch (error) {
            console.log('Failed to retrieve listing page.')
            return;
        }
        const jsonScriptTag = $('script[data-state=true]', resp);
        let jsonData = jsonScriptTag[0].childNodes[0].data;
        if (!jsonData) {
            return;
        }

        jsonData = jsonData.replace("<!--", "");
        jsonData = jsonData.replace("-->", "");
        const jsonDataObject = JSON.parse(jsonData);

        if (!jsonData) {
            return;
        }
        try {
            this.listingData = jsonDataObject['bootstrapData']['reduxData']['homePDP']['listingInfo']['listing'];
        } catch (error) {
            console.log('Missing listing data.')
            return;
        }
        this.apiKey = jsonDataObject['bootstrapData']['layout-init']['api_config']['key']
        this.apiUrl = jsonDataObject['bootstrapData']['layout-init']['api_config']['baseUrl']
        this.listingId = this.listingData['id']
        
        await this.callPriceAPI()
    }

    /**
     * Extract all relevant information from the listing data.
     */
    private parseInformation() {
        this.parseAmenities()
        this.parsePhotos();
        this.parseMiscInfo();
    }

    /**
     * Format listing data into an boject and return it.
     */
    public getListingData() {
        this.parseInformation();
        return {
            listingId: this.listingId,
            query: this.query,
            price: this.price,
            amenities: this.amenities,
            photos: this.photos,
            misc: this.miscInfo,
        }
    }

    /**
     * Calls the price API to retrieve price data for the listing.
     */
    private async callPriceAPI() {
        const params = {
            _format: "for_web_with_date",
            check_in: this.query.dateIn,
            check_out: this.query.dateOut,
            currency: "USD",
            guests: this.query.guests,
            key: this.apiKey,
            listing_id: this.listingId,
            locale: 'en',
            number_of_adults: this.query.adults,
            number_of_children: 0,
            number_of_todlers: 0,
            number_of_infants: 0,
        }
        const url = `${this.apiUrl}/v2/pdp_listing_booking_details?${queryString.stringify(params)}`;
    
        let resp;
        try {
            resp = await rp.get(url);
        } catch (error) {
            console.log('Failed to call booking details API.')
            return;
        }
        resp = JSON.parse(resp);
    
        const price = resp['pdp_listing_booking_details'][0]['price'];
        const totalPrice = price['total']['amount'];
        const currency = price['total']['currency'];
        const priceBrokenDown = price['price_items'].map((i: any) => {
            return {
                type: i['type'],
                amount: i['total']['amount'],
            };
        });
        const pinfo: priceInfo = {
            total: totalPrice,
            currency: currency,
            breakdown: priceBrokenDown,
        }
        this.price = pinfo;
    }

    private parseAmenities() {
        if (!this.listingData) {
            return;
        }
        const amenitiesObject = this.listingData['listing_amenities'];
        const presentAmenities = amenitiesObject.filter((a: any) => a['is_present']);
        const amenities = presentAmenities.map((a: any) => {return {name: a['name'], tooltip: a['tooltip']}})
        this.amenities = amenities;
    }

    private parsePhotos() {
        if (!this.listingData) {
            return;
        }
        const photosObject = this.listingData['photos'];
        this.photos = photosObject.map((p: any) => {
            return {
                url: p['large'],
                sortOrder: p['sort_order'],
            }
        })
    }

    private parseMiscInfo() {
        if (!this.listingData) {
            return;
        }
        this.miscInfo = {
            description: this.listingData['sectioned_description']['description'],
            starts: this.listingData['star_rating'],
            capacity: this.listingData['person_capacity'],
            name: this.listingData['name'],
            bathroom: this.listingData['bathroom_label'],
            beds: this.listingData['bed_label'],
            bedroom: this.listingData['bedroom_label'],
            
        }
    }
}
