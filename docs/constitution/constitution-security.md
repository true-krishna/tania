# Tania Security Constitution

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
**Legal basis**: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi ("UU PDP"), Republic of Indonesia — including Pasal 4 (data classification), Pasal 5–13 (data subject rights), Pasal 20–25 (lawful basis, consent, transparency), Pasal 34 (impact analysis), Pasal 35–37 (security, retention, destruction), Pasal 46 (breach notification), Pasal 53 (Data Protection Officer), Pasal 55–56 (cross-border transfer), Pasal 57 (administrative sanctions).
**Scope**: every Tania service, repository, and environment that collects, stores, processes, or exposes personal data of data subjects in Indonesia. UU PDP applies directly; its grace period has lapsed, so non-compliance carries sanctions (administrative fines up to 2% of annual revenue from processing, criminal liability).

## Preamble

The Tania Security Constitution translates UU PDP obligations into binding engineering rules. Where this constitution and any convenience, deadline, or design preference conflict, **the law wins**. "Personal data" means any data relating to an identified or identifiable natural person, per UU PDP Pasal 1 and 4.

## Core Principles

### I. Lawful basis and purpose limitation (Pasal 20–21)

Every processing of personal data has a **documented lawful basis** recorded before implementation. Where the basis is consent, it must be explicit, granular, and **recorded** (written, electronic, or recorded verbal) and **withdrawable as easily as it was given**. Purposes are specific, explicit, and legitimate; repurposing existing data requires a new basis — never silent reuse.

### II. Data minimization and classification (Pasal 4)

Collect only what the declared purpose requires. Every data field is classified at design time:

- **General personal data** — name, contact, identifiers, employment, etc.
- **Specific/sensitive personal data** — health, biometric, financial, physiological, criminal records, children's data — which requires explicit consent and heightened controls (strict access lists, encryption, audit logging).

Classification lives in the data model documentation; unclassified fields are a review-blocking defect.

### III. Data subject rights are product features (Pasal 5–13)

The rights to **information, access and copy, rectification, erasure, consent withdrawal, objection to automated decisions, delay/limitation of processing, and data portability** are implemented as working API workflows with defined SLAs — not as manual database surgery. If a feature cannot support these workflows for the data it introduces, the feature is not ship-ready.

### IV. Security and confidentiality by design (Pasal 35)

Technical and organizational measures protecting personal data from unauthorized access, unlawful disclosure, alteration, loss, and destruction are mandatory:

- TLS for data in transit; encryption at rest for stores of personal data.
- Role-based access control with least privilege; access to raw personal data is auditable.
- Secrets managed via the platform secret store — never committed, never logged.
- **No personal data in logs, error traces, analytics events, or URLs.** Non-production environments use anonymized or pseudonymized data — never copies of production personal data.
- Dependency vulnerability scanning runs in CI; critical findings block release.

### V. Retention and destruction (Pasal 36–37)

Every dataset holding personal data declares a **retention period**. Data is destroyed (permanently erased or converted to anonymous form) when the purpose is fulfilled, the retention period expires, consent is withdrawn, or processing must stop. "Soft-deleted forever" is not compliant; deletion must be real, with backups purged or anonymized on the same schedule.

### VI. Breach notification within 3×24 hours (Pasal 46)

A failure to protect personal data must be reported in writing/electronically to affected data subjects **and** the supervisory institution (Lembaga PDP) **within 3×24 hours** of discovery. Therefore: an incident runbook, contact lists, and notification templates are maintained and tested; security incidents are logged with timestamps, scope, and impact assessment from first detection.

### VII. High-risk processing requires a DPIA (Pasal 34)

A **DAMP** (Dokumen Analisis Mengenai Dampak Pelindungan Data Pribadi — the PDP impact analysis) is produced before: automated decision-making with legal or significant effects, large-scale processing of specific data, matching/combination of datasets, or behavioral monitoring. Materially changed processing re-triggers the analysis. DAMP artifacts are stored with the spec/plan that introduced the risk.

### VIII. Cross-border transfer only with safeguards (Pasal 55–56)

Transferring personal data outside Indonesia requires equivalent protection or documented legal safeguards (legally binding agreements, certifications, codes of conduct). Each destination country, vendor, and cloud region receiving personal data is recorded with its safeguard basis before the first byte moves.

### IX. Accountability (Pasal 46, 53)

The project maintains records of processing activities (purpose, categories, recipients, retention, safeguards). Data Protection Officer obligations are assessed when thresholds are met (public-body processing, large-scale monitoring, large-scale specific data). Every data store has a named owner accountable for the rules above.

## Additional Constraints

- **Consent UX follows the Design Constitution** — plain Indonesian-language consent, granular per purpose, no dark patterns, withdrawal always reachable.
- **Third-party and SDK onboarding** (analytics, cloud, AI services) requires a PDP risk review and vendor agreement check before integration merges.
- **Children's data** requires parental/guardian consent and heightened access controls.
- **Admin and debug tooling** must not expose raw personal data without an audit trail; masking is the default presentation for specific data.
- **AI/LLM features** must not transmit personal data (least of all specific data) to external model providers without the lawful basis, vendor safeguard (VIII), and DPIA (VII) documented.

## Governance

- Any spec or plan touching personal data includes a **security checklist pass** (classification, basis, rights workflows, retention, breach path) before approval.
- Violations discovered in review block the merge; violations discovered after merge are incidents and follow Principle VI.
- Amendments to this constitution must not weaken statutory obligations; legal changes to UU PDP or its implementing regulations trigger a review.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
