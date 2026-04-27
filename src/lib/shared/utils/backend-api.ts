import { NextResponse } from 'next/server';
import type { NextApiResponse } from 'next';

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_INTERNAL_API_URL = `http://127.0.0.1:${process.env.API_PORT ?? '4000'}`;

type BackendApiRequest = {
  path: string;
  method?: string;
  body?: BodyInit | Record<string, unknown> | unknown[];
  headers?: Record<string, string | undefined>;
  redirect?: RequestRedirect;
};

type ParsedBackendApiResponse =
  | {
      contentType: string | null;
      data: unknown;
      location: string | null;
      status: number;
      setCookie: string[];
      isJson: true;
    }
  | {
      contentType: string | null;
      data: string;
      location: string | null;
      status: number;
      setCookie: string[];
      isJson: false;
    };

const getInternalApiUrl = () => {
  return process.env.API_INTERNAL_URL ?? DEFAULT_INTERNAL_API_URL;
};

const getSetCookieHeaders = (response: Response) => {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookieHeaders = responseHeaders.getSetCookie?.();

  if (setCookieHeaders && setCookieHeaders.length > 0) {
    return setCookieHeaders;
  }

  const singleHeader = response.headers.get('set-cookie');

  return singleHeader ? [singleHeader] : [];
};

const createRequestHeaders = (headers?: Record<string, string | undefined>) => {
  const resolvedHeaders = new Headers();

  Object.entries(headers ?? {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    resolvedHeaders.set(key, value);
  });

  return resolvedHeaders;
};

const isBodyInit = (body: BackendApiRequest['body']): body is BodyInit => {
  if (body === undefined) {
    return false;
  }

  if (typeof body === 'string' || body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams) {
    return true;
  }

  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return true;
  }

  return typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
};

const createRequestBody = (body: BackendApiRequest['body'], headers: Headers) => {
  if (body === undefined) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  if (!headers.has('content-type')) {
    headers.set('content-type', JSON_CONTENT_TYPE);
  }

  return JSON.stringify(body);
};

export const requestBackendApi = async ({
  path,
  method = 'GET',
  body,
  headers,
  redirect,
}: BackendApiRequest) => {
  const resolvedHeaders = createRequestHeaders(headers);

  return fetch(new URL(path, getInternalApiUrl()), {
    method,
    headers: resolvedHeaders,
    body: createRequestBody(body, resolvedHeaders),
    cache: 'no-store',
    redirect,
  });
};

export const readBackendApiResponse = async (response: Response): Promise<ParsedBackendApiResponse> => {
  const contentType = response.headers.get('content-type');
  const location = response.headers.get('location');
  const status = response.status;
  const setCookie = getSetCookieHeaders(response);

  if (contentType?.includes(JSON_CONTENT_TYPE)) {
    return {
      contentType,
      location,
      status,
      setCookie,
      isJson: true,
      data: await response.json(),
    };
  }

  return {
    contentType,
    location,
    status,
    setCookie,
    isJson: false,
    data: await response.text(),
  };
};

export const toNextProxyResponse = async (response: Response) => {
  const parsedResponse = await readBackendApiResponse(response);
  const proxyHeaders = new Headers();

  parsedResponse.setCookie.forEach((cookieValue) => {
    proxyHeaders.append('set-cookie', cookieValue);
  });

  if (parsedResponse.location) {
    proxyHeaders.set('location', parsedResponse.location);
  }

  if (parsedResponse.isJson) {
    return NextResponse.json(parsedResponse.data, {
      status: parsedResponse.status,
      headers: proxyHeaders,
    });
  }

  if (parsedResponse.contentType) {
    proxyHeaders.set('content-type', parsedResponse.contentType);
  }

  return new NextResponse(parsedResponse.data, {
    status: parsedResponse.status,
    headers: proxyHeaders,
  });
};

export const writePagesProxyResponse = (
  res: NextApiResponse,
  parsedResponse: ParsedBackendApiResponse,
) => {
  if (parsedResponse.setCookie.length > 0) {
    res.setHeader('Set-Cookie', parsedResponse.setCookie);
  }

  if (parsedResponse.isJson) {
    return res.status(parsedResponse.status).json(parsedResponse.data);
  }

  if (parsedResponse.location) {
    res.setHeader('Location', parsedResponse.location);
  }

  return res.status(parsedResponse.status).send(parsedResponse.data);
};
