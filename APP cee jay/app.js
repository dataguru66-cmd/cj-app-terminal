// --- SECURE API CONFIGURATION ---
const _0xK = {
    f: "d6cmncpr01qsiik2q2kgd6cmncpr01qsiik2q2l0", // Finnhub
    s: "D565CE171D2E488B90B74CF4F666EC88",       // Stockdio
    t: "49b2c6a6545c462a921ab22938a0e3da",     // TwelveData
    m: "252a7a4608eae40249bd607a4113db7e",     // Marketstack
    p: "QmE4hPyS3cNUmevBN36BHEFnv3LOIlJH"      // FMP
};

// --- LIVE PRICE FETCH (FINNHUB) ---
async function fetchLivePrice(symbol = 'NDX') {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${_0xK.f}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        // Updates your UI header with real price
        document.getElementById('page-title').innerText = `${symbol}: $${data.c}`;
    } catch (e) { console.error("Price feed error", e); }
}

// --- TECHNICALS (TWELVEDATA) ---
async function getTechnicals(symbol = 'NAS100') {
    const url = `https://api.twelvedata.com/rsi?symbol=${symbol}&interval=15min&apikey=${_0xK.t}`;
    try {
        const r = await fetch(url);
        const d = await r.json();
        console.log("Live RSI for Strategy:", d.values[0].value);
    } catch (e) { console.error("Indicator error", e); }
}

// --- CHART INJECTION (STOCKDIO) ---
function loadStockdioChart(symbol = 'NAS100') {
    const container = document.getElementById('tv_chart');
    container.innerHTML = `<iframe src="https://api.stockdio.com/visualization/financial/charts/v1/HistoricalPrices?app-key=${_0xK.s}&symbol=${symbol}&motif=financial&palette=financial-dark" width="100%" height="100%" frameborder="0"></iframe>`;
}

// --- INITIALIZE LIVE SESSION ---
document.addEventListener('DOMContentLoaded', () => {
    fetchLivePrice();
    loadStockdioChart();
    // Refresh every 60 seconds
    setInterval(fetchLivePrice, 60000); 
});