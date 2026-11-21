import { NextResponse } from 'next/server';

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  };
}

export function handleCorsOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
