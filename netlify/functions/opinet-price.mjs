// Server-side call to Opinet's OFFICIAL API. Uses avgRecentPrice.do, which
// returns the last ~7 days of national average prices. We always fetch the
// full recent list (no `date` request param — its exact expected format
// wasn't reliable) and match the requested date against the response
// ourselves, comparing digits only so any date format Opinet returns
// (YYYYMMDD, YYYY-MM-DD, etc.) still matches correctly.

export default async (req) => {
  try {
    const url = new URL(req.url);
    const fuelType = url.searchParams.get('fuelType') || 'gasoline';
    const dateParam = url.searchParams.get('date'); // e.g. 20260821, optional
    const prodCd = fuelType === 'diesel' ? 'D047' : 'B027';
    const digitsOnly = (s) => (s || '').replace(/\D/g, '');

    const apiKey = process.env.OPINET_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API 키가 설정되지 않았어요 (Netlify 환경변수 OPINET_API_KEY를 확인해주세요)' },
        { status: 500 }
      );
    }

    const apiUrl = 'https://www.opinet.co.kr/api/avgRecentPrice.do?out=json'
      + '&code=' + encodeURIComponent(apiKey)
      + '&prodcd=' + prodCd;
    const res = await fetch(apiUrl);
    const rawText = await res.text();

    if (!res.ok) {
      return Response.json(
        { error: `오피넷 API 오류: HTTP ${res.status}`, raw: rawText.slice(0, 300) },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return Response.json(
        { error: 'API 응답이 JSON 형식이 아니에요', raw: rawText.slice(0, 300) },
        { status: 500 }
      );
    }

    let entries = null;
    if (data && data.RESULT && Array.isArray(data.RESULT.OIL)) entries = data.RESULT.OIL;
    else if (data && Array.isArray(data.OIL)) entries = data.OIL;
    else if (data && data.result && Array.isArray(data.result.oil)) entries = data.result.oil;
    else if (Array.isArray(data)) entries = data;

    if (!entries) {
      return Response.json(
        { error: '응답 구조를 인식하지 못했어요', raw: JSON.stringify(data).slice(0, 500) },
        { status: 500 }
      );
    }

    const relevant = entries.filter((e) => {
      const code = e.PRODCD || e.prodcd || e.PROD_CD || e.prod_cd;
      return !code || code === prodCd; // some shapes may already be pre-filtered by prodcd
    });

    if (relevant.length === 0) {
      return Response.json(
        { error: '해당 유종 데이터를 찾지 못했어요', raw: JSON.stringify(entries).slice(0, 500) },
        { status: 500 }
      );
    }

    const getDate = (e) => e.DATE || e.date || e.TRADE_DT || e.trade_dt || '';

    let match = null;
    let usedFallback = false;
    if (dateParam) {
      match = relevant.find((e) => digitsOnly(getDate(e)) === digitsOnly(dateParam));
    }
    if (!match) {
      // Requested date not in the recent-7-days window (or no date requested) —
      // fall back to whichever entry has the latest date.
      match = relevant.reduce((best, e) => {
        if (!best) return e;
        return digitsOnly(getDate(e)) >= digitsOnly(getDate(best)) ? e : best;
      }, null);
      usedFallback = !!dateParam;
    }

    if (!match) {
      return Response.json({ error: '가격 데이터를 찾지 못했어요' }, { status: 500 });
    }

    const priceRaw = match.PRICE || match.price;
    const price = Math.round(parseFloat(priceRaw));
    const date = getDate(match);

    if (isNaN(price)) {
      return Response.json(
        { error: '가격 값을 숫자로 바꾸지 못했어요', raw: JSON.stringify(match).slice(0, 300) },
        { status: 500 }
      );
    }

    return Response.json({
      price: price,
      date: date,
      fuelType: fuelType,
      requestedDate: dateParam || null,
      usedFallback: usedFallback,
      availableDates: relevant.map(getDate)
    });
  } catch (err) {
    return Response.json({ error: err.message || '알 수 없는 오류' }, { status: 500 });
  }
};

// No custom `config.path` here — this function is intentionally exposed at
// Netlify's standard, always-on endpoint: /.netlify/functions/opinet-price
// (This has worked the same way since Netlify Functions first launched,
// so it doesn't depend on any newer routing feature being enabled.)
