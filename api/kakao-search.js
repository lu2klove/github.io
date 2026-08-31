// Vercel Edge Function — server-side call to Kakao's Local (keyword search) API.
// A file at /api/kakao-search.js is automatically exposed at /api/kakao-search.
// Runs on Vercel's edge, so it calls Kakao directly — no browser CORS applies,
// and the REST API key stays server-side (never shipped to the client).

export const config = { runtime: 'edge' };

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');

    if (!query || !query.trim()) {
      return Response.json({ error: '검색어가 필요해요' }, { status: 400 });
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API 키가 설정되지 않았어요 (Vercel 환경변수 KAKAO_REST_API_KEY를 확인해주세요)' },
        { status: 500 }
      );
    }

    const apiUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURIComponent(query) + '&size=10';
    const res = await fetch(apiUrl, {
      headers: { Authorization: 'KakaoAK ' + apiKey }
    });
    const rawText = await res.text();

    if (!res.ok) {
      return Response.json(
        { error: `카카오 API 오류: HTTP ${res.status}`, raw: rawText.slice(0, 300) },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return Response.json(
        { error: '응답이 JSON 형식이 아니에요', raw: rawText.slice(0, 300) },
        { status: 500 }
      );
    }

    const docs = Array.isArray(data.documents) ? data.documents : [];
    const results = docs.map((d) => ({
      name: d.place_name || '',
      address: d.road_address_name || d.address_name || '',
      category: d.category_group_name || d.category_name || ''
    }));

    return Response.json({ results: results });
  } catch (err) {
    return Response.json({ error: err.message || '알 수 없는 오류' }, { status: 500 });
  }
}
