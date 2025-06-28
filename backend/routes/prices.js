const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

let cachedPrices = [];
const CACHE_DURATION = 60 * 60 * 1000; 
let lastFetchTime = 0;

async function scrapePrices() {
  const { data } = await axios.get(
    'https://kamis.kilimo.go.ke/site/market?product=&per_page=1000'
  );

  const $ = cheerio.load(data);
  const prices = [];

  $('table.table tbody tr').each((index, element) => {
    const tds = $(element).find('td');
    if (tds.length < 10) return;

    prices.push({
      market: $(tds[0]).text().trim(),
      commodity: $(tds[1]).text().trim(),
      classification: $(tds[2]).text().trim(),
      grade: $(tds[3]).text().trim(),
      sex: $(tds[4]).text().trim(),
      wholesale: $(tds[5]).text().trim(),
      retail: $(tds[6]).text().trim(),
      supplyVolume: $(tds[7]).text().trim(),
      county: $(tds[8]).text().trim(),
      date: $(tds[9]).text().trim(),
    });
  });

  return prices;
}

async function refreshCache() {
  try {
    console.log('[PRICES] Refreshing cached data...');
    cachedPrices = await scrapePrices();
    lastFetchTime = Date.now();
    console.log(`[PRICES] Fetched ${cachedPrices.length} entries`);
  } catch (e) {
    console.error('[PRICES] Error refreshing cache:', e);
  }
}

refreshCache();

setInterval(refreshCache, CACHE_DURATION);

router.get('/', (req, res) => {
  const { county, commodity } = req.query;

  const filtered = cachedPrices.filter(row => {
    const countyMatch = !county || row.county.toLowerCase().includes(county.toLowerCase());
    const commodityMatch = !commodity || row.commodity.toLowerCase().includes(commodity.toLowerCase());
    return countyMatch && commodityMatch;
  });

  res.json(filtered);
});

module.exports = router;
