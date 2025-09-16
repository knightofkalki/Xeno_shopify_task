// Proxy route to bypass CORS issues
export async function POST(request) {
  try {
    const body = await request.json();
    const { endpoint, method = 'POST', ...data } = body;
    
    // Backend URL - using the correct one
    const BACKEND_URL = 'https://xeno-shopify-service-5hy737wj7-boardlys-projects.vercel.app';
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'xe_3a4f9b2c8d1e7f6g9h0i2j3k4l5m6n7o8p9q1r2s'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    return Response.json(result, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({ 
      success: false, 
      message: 'Proxy request failed' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    const token = url.searchParams.get('token');
    
    const BACKEND_URL = 'https://xeno-shopify-service-5hy737wj7-boardlys-projects.vercel.app';
    
    const headers = {
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass': 'xe_3a4f9b2c8d1e7f6g9h0i2j3k4l5m6n7o8p9q1r2s'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: headers
    });

    const result = await response.json();
    
    return Response.json(result, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Proxy GET error:', error);
    return Response.json({ 
      success: false, 
      message: 'Proxy GET request failed' 
    }, { status: 500 });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}