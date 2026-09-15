# Production Deployment

Use a private network for MongoDB, Redis, and the LLM proxy. Terminate TLS at a maintained reverse proxy, forward only the configured frontend origin, and run the Node service under a supervisor or container orchestrator.

## Required configuration

Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGIN`, and the LLM approval flags from a secret manager. Configure a shared Redis-backed rate limiter and Socket.IO Redis adapter before running more than one backend instance. Use sticky sessions if the chosen Socket.IO transport and proxy require them.

## Probes and shutdown

Use `/health/live` for process liveness and `/health/ready` for MongoDB readiness. Route traffic only to ready instances. On `SIGTERM` or `SIGINT`, stop accepting traffic, allow in-flight requests to finish, close Socket.IO and HTTP resources, then close MongoDB connections.

## Data protection

Keep uploads outside the frontend's public directory. Encrypt traffic and storage, restrict database and object-storage access, and configure backups with encryption, retention, restore tests, and an owner. Define a migration process that supports rollback or a forward fix; do not rely on ad-hoc production schema changes.

## Operations

Collect structured logs with request IDs, dependency latency, rate-limit events, audit-write failures, authentication failures, readiness failures, and queue/provider errors. Do not log tokens, patient data, transcripts, audio, prompts, or upstream exception bodies. Add CI checks for lint, build, tests, dependency audit, and bundle size before deployment.
