export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const gasUrl = url.searchParams.get("url");

  if (!gasUrl) {
    return new Response(JSON.stringify({ error: "Missing URL parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const options: RequestInit = {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
      redirect: 'follow',
    };

    if (request.method === 'POST') {
      options.body = await request.text();
      options.headers['Content-Type'] = request.headers.get('Content-Type') || 'application/json';
    }

    const response = await fetch(gasUrl, options);
    
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    
    // Check for login pages
    if (response.url.includes("accounts.google.com") || response.url.includes("ServiceLogin")) {
      return new Response(JSON.stringify({ 
        error: "Authentication Required", 
        details: "Google Apps Script redirected to a login page. This means the script is NOT deployed with 'Anyone' access.",
        isHtml: true,
        finalUrl: response.url
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (response.status >= 400) {
      return new Response(JSON.stringify({
        error: `Google returned ${response.status}`,
        details: text.substring(0, 1000)
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = new Headers();
    if (contentType) headers.set("Content-Type", contentType);

    return new Response(text, {
      status: response.status,
      headers: headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to proxy request to Google Apps Script", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
