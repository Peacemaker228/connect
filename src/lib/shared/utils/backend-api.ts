import { NextResponse } from 'next/server';
import type { NextApiResponse } from 'next';

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_INTERNAL_API_URL = `http://127.0.0.1:${process.env.API_PORT ?? '4000'}`;

type BackendApiRequest = {
  path: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string | undefined>;
};

type ParsedBackendApiResponse =
  | {
      contentType: string | null;
      data: unknown;
      status: number;
      isJson: true;
    }
  | {
      contentType: string | null;
      data: string;
      status: number;
      isJson: false;
    };

const getInternalApiUrl = () => {
  return process.env.API_INTERNAL_URL ?? DEFAULT_INTERNAL_API_URL;
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

export const requestBackendApi = async ({ path, method = 'GET', body, headers }: BackendApiRequest) => {
  const resolvedHeaders = createRequestHeaders(headers);

  if (body !== undefined && !resolvedHeaders.has('content-type')) {
    resolvedHeaders.set('content-type', JSON_CONTENT_TYPE);
  }

  return fetch(new URL(path, getInternalApiUrl()), {
    method,
    headers: resolvedHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
};

export const readBackendApiResponse = async (response: Response): Promise<ParsedBackendApiResponse> => {
  const contentType = response.headers.get('content-type');
  const status = response.status;

  if (contentType?.includes(JSON_CONTENT_TYPE)) {
    return {
      contentType,
      status,
      isJson: true,
      data: await response.json(),
    };
  }

  return {
    contentType,
    status,
    isJson: false,
    data: await response.text(),
  };
};

export const toNextProxyResponse = async (response: Response) => {
  const parsedResponse = await readBackendApiResponse(response);

  if (parsedResponse.isJson) {
    return NextResponse.json(parsedResponse.data, {
      status: parsedResponse.status,
    });
  }

  return new NextResponse(parsedResponse.data, {
    status: parsedResponse.status,
    headers: parsedResponse.contentType ? { 'content-type': parsedResponse.contentType } : undefined,
  });
};

export const writePagesProxyResponse = (
  res: NextApiResponse,
  parsedResponse: ParsedBackendApiResponse,
) => {
  if (parsedResponse.isJson) {
    return res.status(parsedResponse.status).json(parsedResponse.data);
  }

  return res.status(parsedResponse.status).send(parsedResponse.data);
};
