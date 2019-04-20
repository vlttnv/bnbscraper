import Scraper from './scraper';

const url = "https://www.airbnb.com/rooms/28299515?location=London%2C%20United%20Kingdom&adults=1&toddlers=0&guests=1&check_in=2019-04-26&check_out=2019-04-30&s=-xq9rVl0";

(async () => {
    const s = new Scraper(url);
    await s.getWebsiteData();
    const data = s.getListingData();
    console.log(JSON.stringify(data));
})();
