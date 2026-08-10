# Incident Runbook — Notes API (AWS EC2 Deployment)
**Maintained by:** Jyoti Oli
**System:** Node.js/Express REST API, deployed on AWS EC2, containerized with Docker, process-managed with PM2

This runbook documents real incidents encountered while building and deploying this system, following a standard incident-response format: Symptom → Investigation → Root Cause → Fix → Prevention.

---

## Incident 1: API Unreachable via Browser (ERR_TIMED_OUT)

**Symptom:**
API deployed and running inside a Docker container on EC2. `docker ps` confirmed the container was up. But visiting the public IP in a browser resulted in `ERR_TIMED_OUT` — the request never returned, no error, no response.

**Investigation:**
1. Confirmed the container was running: `docker ps` — container healthy, no crash.
2. Confirmed the app was listening locally: `curl http://localhost:3000` from inside the EC2 instance — succeeded, returned valid JSON.
3. Since the app worked *locally on the server* but not *from the browser*, the issue was narrowed to either networking (Security Group) or the request not reaching the right port.
4. Checked the exact URL being used: the browser request was going to the bare IP with no port specified (`http://<IP>`), which defaults to port 80 (standard HTTP) — but the container was listening on port 3000.

**Root Cause:**
Port mismatch, not a server or code failure. The browser's default port (80) didn't match the container's actual listening port (3000), so the request was silently dropped by the EC2 firewall with no app ever receiving it — producing the "silence" symptom of a timeout rather than a clear connection-refused error.

**Fix:**
Accessed the API using the explicit port in the URL (`http://<IP>:3000`), confirming the container was reachable once the correct port was specified. Long-term fix: either map the container to port 80 directly, or use a reverse proxy (Nginx) so end users don't need to specify a port.

**Prevention:**
When a service is reachable locally (via `curl` on the server) but not externally, always check for a port mismatch before assuming a networking or firewall failure — a timeout with zero error response is a strong signal of a silently dropped request at the network layer, not an application crash.

---

## Incident 2: Frontend Breaks Every Time the Server Restarts

**Symptom:**
React frontend was hardcoded to call the API at a specific IP address. After stopping and restarting the EC2 instance (routine maintenance), the frontend broke completely — all API calls failed.

**Investigation:**
1. Confirmed the EC2 instance was running and the API was healthy via SSH + `curl localhost`.
2. Compared the current public IP (via AWS Console) against the IP hardcoded in the frontend code — they didn't match.
3. Traced why: AWS assigns a new public IP by default every time an EC2 instance is stopped and started, unless a static IP is explicitly allocated.

**Root Cause:**
AWS's default EC2 public IP is ephemeral — it's released and reassigned on every stop/start cycle. Any hardcoded reference to that IP (in frontend code, documentation, or bookmarks) becomes stale the moment the instance restarts.

**Fix:**
Allocated an AWS Elastic IP and associated it permanently with the EC2 instance. This IP does not change across restarts, so the frontend's API reference remains valid indefinitely.

**Prevention:**
Any production instance that other systems depend on by IP address should be assigned a static/Elastic IP from the start — never rely on the default ephemeral public IP for anything beyond initial testing.

---

## Incident 3: `aws s3 cp` Failed with NoSuchBucket

**Symptom:**
Running `aws s3 cp test.txt s3://my-bucket/` from the AWS CLI failed immediately with a `NoSuchBucket` error.

**Investigation:**
Checked the AWS S3 Console — the target bucket did not exist yet. Unlike a local filesystem, the AWS CLI does not auto-create a missing S3 bucket when you attempt to copy a file into it.

**Root Cause:**
Bucket had not been explicitly created before attempting to upload to it.

**Fix:**
Created the bucket first using `aws s3 mb s3://my-bucket/`, then re-ran the copy command successfully.

**Prevention:**
Always verify a destination resource (bucket, directory, database) exists before attempting to write to it via CLI — cloud CLIs generally fail explicitly rather than silently creating missing infrastructure, which is a deliberate safety behavior worth designing around.

---

## Incident 4: `aws configure` Set the Wrong Region

**Symptom:**
After running `aws configure`, subsequent CLI commands referencing resources failed to find them, despite the resources existing in the AWS Console.

**Investigation:**
Reviewed the configured region with `aws configure list`. The region had been set using the human-readable console display name ("US East (N. Virginia)") rather than its API region code.

**Root Cause:**
AWS Console displays friendly region names, but the CLI and API only recognize technical region codes (e.g., `us-east-1`). Entering the display name during `aws configure` set an invalid/mismatched region context.

**Fix:**
Re-ran `aws configure` and entered the correct region code (`us-east-1`).

**Prevention:**
Always use the AWS region code, not the console display name, in any CLI configuration or automation script.

---

*This runbook reflects real incidents encountered during hands-on AWS deployment work, documented as part of ongoing cloud infrastructure practice.*
