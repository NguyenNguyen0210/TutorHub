# Deployment

[Back to TutorHub](../README.md) | [Configuration](configuration.md)

The web application is deployed at **[https://tutorhub.id.vn/](https://tutorhub.id.vn/)**.

## Production containers

Copy the production template and fill in its required values before starting the stack:

```powershell
Copy-Item .env.production.example .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

This starts the API, PostgreSQL, and Redis; host the frontend separately. From `src/frontend`, set the production `VITE_*` endpoints and run `npm ci` followed by `npm run build`. Publish `dist/` to a static host with an SPA fallback to `index.html`, and route HTTPS traffic to the API through your reverse proxy.

The API exposes host port `8080` by default; set `API_PORT` to change it. PostgreSQL and Redis stay on the internal container network.

[Production Compose](../docker-compose.prod.yml) and the [production environment template](../.env.production.example) provide the deployment configuration starting point.

- Outside Development, provide configuration through deployment environment variables, including valid SMTP and allowed browser origins. Swagger is Development-only.
- Configure trusted reverse proxy IPs through `ReverseProxy__KnownProxies__0`, `ReverseProxy__KnownProxies__1`, and so on.
- Use `/health` for dependency readiness and `/health/live` for process liveness.

## Continuous integration

GitHub Actions runs backend build/tests and frontend lint/tests/build on pushes and pull requests to `main`. The workflow validates changes; deployment is performed separately.
