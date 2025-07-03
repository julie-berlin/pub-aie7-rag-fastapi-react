interface ApiClientOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: FormData | Record<string, unknown> | string;
  apiKey: string;
}

interface ApiClientResponse<T = unknown> {
  data?: T;
  error?: string;
  ok: boolean;
}

interface PdfUploadResponse {
  message: string;
  chunks_created: number;
  filename: string;
}

/**
 * Generic API client that handles authentication via Bearer token
 * @param options - Configuration object for the API request
 * @returns Promise with response data or error
 */
export async function apiClient<T = unknown>({
  endpoint,
  method = 'POST',
  body,
  apiKey
}: ApiClientOptions): Promise<ApiClientResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
    };

    // Add Content-Type for requests with body
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await fetch(endpoint, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        return {
          ok: false,
          error: errorJson.detail || errorJson.error || `Request failed: ${response.status}`
        };
      } catch {
        return {
          ok: false,
          error: `Request failed: ${errorText || response.statusText}`
        };
      }
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text() as T;
    }

    return {
      ok: true,
      data
    };

  } catch (error) {
    console.error('API Client Error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Helper function specifically for chat requests
 */
export async function chatRequest(
  developerMessage: string,
  userMessage: string,
  apiKey: string,
  model?: string
): Promise<ApiClientResponse<string>> {
  return apiClient<string>({
    endpoint: '/api/chat',
    body: {
      developer_message: developerMessage,
      user_message: userMessage,
      model: model || 'gpt-4.1-mini'
    },
    apiKey
  });
}

/**
 * Helper function specifically for PDF upload requests
 */
export async function uploadPdfRequest(file: File, apiKey: string): Promise<ApiClientResponse<PdfUploadResponse>> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient<PdfUploadResponse>({
    endpoint: '/api/upload-pdf',
    body: formData,
    apiKey
  });
}