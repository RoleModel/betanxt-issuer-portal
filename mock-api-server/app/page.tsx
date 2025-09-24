// This is a minimal page required by Next.js 13+ app directory
// Since this is an API-only server, we redirect to the API documentation
export default function HomePage(): JSX.Element {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Mock API Server</h1>
      <p>This is an API-only server. Available endpoints:</p>
      <ul>
        <li><code>GET /api/health</code> - Health check endpoint</li>
        <li><code>GET /api</code> - API documentation</li>
      </ul>
      <p>For full API documentation, please check the OpenAPI specification.</p>
    </div>
  )
}