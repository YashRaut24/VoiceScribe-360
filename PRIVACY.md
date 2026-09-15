# Privacy and Clinical Data Processing

This repository is not, by itself, evidence of HIPAA or other regulatory compliance. Before production use, the operator must complete a documented security and privacy review.

## External AI providers

Clinical transcripts, symptoms, and audio are sensitive data. The backend refuses to send them to the configured LLM provider unless both `LLM_PROVIDER_APPROVED=true` and `LLM_PHI_PROCESSING_CONSENT=true` are set. Those flags require documented provider terms or a BAA where applicable, approved retention and deletion settings, access controls, incident notification terms, and an owner who periodically verifies those settings.

Do not place real patient data in development, demos, logs, prompts, or test fixtures. Prefer de-identified or minimized inputs. The application must obtain and record the patient's consent before an approved external processor is used, and must provide a way to withdraw consent and stop future processing.

## Retention and access

Define retention periods for transcripts, recordings, SOAP notes, audit events, backups, and provider-side data. Record deletion requests and verify deletion from primary storage, derived storage, backups according to the retention schedule, and external providers where supported. Keep uploads outside the public web root and use private, authenticated delivery.

Review audit events for authentication, records, consultation content, symptom analysis, uploads, and administrative actions. Monitor audit-write failures instead of silently accepting missing evidence. Restrict production database, object storage, Redis, logs, backups, and provider credentials to the minimum required operators and services.

## Incident response

Maintain an incident owner, escalation contacts, breach-assessment procedure, evidence-preservation procedure, provider notification process, and patient/regulator notification process appropriate to the deployment jurisdiction. Test restore and incident procedures before go-live.
