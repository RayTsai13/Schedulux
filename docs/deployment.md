# Deployment

Schedulux runs on a single **EC2** instance with `docker compose` (API, SPA, Caddy) and a managed **RDS PostgreSQL** database. Caddy handles HTTPS automatically. Expect about $0–5/month on the AWS free tier and about $25–30/month after it.

```
Internet ──HTTPS──► EC2: Caddy ─┬─ /api/*, /health ─► backend (Node, :3000) ──► RDS PostgreSQL (:5432)
                                 └─ everything else ─► frontend (nginx + SPA, :80)
```

Values like `yourdomain.com`, `<rds-endpoint>`, and `<ec2-ip>` below are placeholders. Keep your real values somewhere local, not in git.

---

## How the images are built

- Both Dockerfiles use the **repository root as build context** (see `docker-compose.yml`), because each image first builds `packages/availability-engine` in its own stage and then links it as `file:../packages/availability-engine`.
- `.dockerignore` lives at the repo root.
- The backend container runs `npm run migrate && npm start`. `backend/src/migrate.ts` applies every file in `backend/migrations/` that isn't yet recorded in `schema_migrations`, so deploying is enough to migrate.
- The SPA bakes in `VITE_API_URL` at build time (a build arg in compose).

## Run the production stack locally first

```bash
docker compose -f docker-compose.local.yml up --build
# Postgres :5432, API :3000 (runs migrations), SPA :8080
# optional demo data, seeded from the host into the container's Postgres:
cd backend && DB_USER=schedulux DB_PASSWORD=localdevpassword npm run seed:heroes
```

The local stack's Postgres binds port 5432. Stop a host Postgres first, or change the mapping.

---

## First-time AWS setup

Prerequisites: an AWS account, the AWS CLI (`brew install awscli && aws configure` with an IAM user), a domain, and optionally SendGrid.

### 1. Security groups (default VPC)

```bash
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true"   # confirm a default VPC exists

# EC2: SSH from your IP, HTTP/HTTPS from anywhere
aws ec2 create-security-group --group-name schedulux-ec2-sg --description "Schedulux EC2"
aws ec2 authorize-security-group-ingress --group-name schedulux-ec2-sg --protocol tcp --port 22  --cidr $(curl -s https://checkip.amazonaws.com)/32
aws ec2 authorize-security-group-ingress --group-name schedulux-ec2-sg --protocol tcp --port 80  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name schedulux-ec2-sg --protocol tcp --port 443 --cidr 0.0.0.0/0

# RDS: Postgres only from the EC2 group
aws ec2 create-security-group --group-name schedulux-rds-sg --description "Schedulux RDS"
aws ec2 authorize-security-group-ingress --group-name schedulux-rds-sg --protocol tcp --port 5432 --source-group schedulux-ec2-sg
```

### 2. SSH key

```bash
aws ec2 create-key-pair --key-name schedulux-key --query 'KeyMaterial' --output text > ~/.ssh/schedulux-key.pem
chmod 400 ~/.ssh/schedulux-key.pem
```

### 3. RDS PostgreSQL 15

```bash
aws rds create-db-instance \
  --db-instance-identifier schedulux-db --db-instance-class db.t3.micro \
  --engine postgres --engine-version 15 \
  --master-username schedulux_admin --master-user-password '<strong-password>' \
  --allocated-storage 20 --storage-type gp3 \
  --vpc-security-group-ids <rds-sg-id> --db-name schedulux_primary \
  --backup-retention-period 7 --no-publicly-accessible --storage-encrypted

aws rds describe-db-instances --db-instance-identifier schedulux-db \
  --query 'DBInstances[0].Endpoint.Address' --output text      # → <rds-endpoint>
```

The app connects with SSL when `NODE_ENV=production`.

### 4. EC2 (Amazon Linux 2023, t3.micro)

```bash
AMI_ID=$(aws ec2 describe-images --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text)

aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro --key-name schedulux-key \
  --security-groups schedulux-ec2-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=schedulux-server}]'
```

Attach an **Elastic IP** so the address survives stop/start, then point your domain's **A record** at it. Caddy can't get a certificate until DNS resolves to the instance.

### 5. Prepare the instance

```bash
ssh -i ~/.ssh/schedulux-key.pem ec2-user@<ec2-ip>

sudo dnf update -y && sudo dnf install -y docker git
sudo systemctl enable --now docker && sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose && sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# t3.micro has 1 GB RAM; the Vite build needs swap
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab

exit   # log back in so the docker group applies
```

### 6. Configure and start

```bash
git clone https://github.com/<you>/Schedulux.git && cd Schedulux

cat > backend/.env << 'EOF'
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=schedulux_admin
DB_PASSWORD=<strong-password>
JWT_SECRET=<openssl rand -hex 32>
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Schedulux
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EOF

# Caddyfile is committed with the project's domain; change it if yours differs
sed -i 's/^[a-z0-9.-]* {/yourdomain.com {/' Caddyfile

export VITE_API_URL=https://yourdomain.com/api
docker compose build && docker compose up -d
```

`FRONTEND_URL` matters: confirmation emails contain `FRONTEND_URL/manage/<token>` links, and waitlist emails link to `FRONTEND_URL/@slug/drops/<id>`.

### 7. Verify

```bash
docker compose ps
docker compose logs backend     # migration output, then "Server running on: …:3000"
docker compose logs caddy       # certificate obtained
curl https://yourdomain.com/health
```

Then open `https://yourdomain.com`, register a vendor, claim a handle, and book from `/@handle` in a private window.

---

## Updating

```bash
ssh -i ~/.ssh/schedulux-key.pem ec2-user@<ec2-ip>
cd Schedulux && git fetch origin main && git reset --hard origin/main
export VITE_API_URL=https://yourdomain.com/api
docker compose build && docker compose up -d
```

New migrations apply on container start. Migrations are forward-only: take an RDS snapshot before deploying one that drops columns (for example `011_drops_pivot.sql`):

```bash
aws rds create-db-snapshot --db-instance-identifier schedulux-db --db-snapshot-identifier schedulux-$(date +%Y%m%d)
```

## Automatic deploys (optional)

CI (`.github/workflows/ci.yml`) runs on every push and PR. `.github/workflows/deploy.yml` runs after CI passes on a push to `main`: it SSHes into the instance, resets the checkout to `origin/main`, rebuilds and restarts the containers (migrations run on backend startup), prunes Docker build cache (the instance has an 8 GB disk), and checks `https://schedulux.net/health`. Take an RDS snapshot before merging anything with a destructive migration.

The workflow needs these repository secrets (Settings → Secrets and variables → Actions): `EC2_HOST` (Elastic IP), `EC2_USER` (`ec2-user`), `EC2_SSH_KEY` (the full contents of `schedulux-key.pem`, including the BEGIN/END lines). The deploy discards any local changes on the instance, so all changes must come through git.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Container exits | `docker compose logs <service>` |
| API can't reach RDS | RDS SG allows 5432 from `schedulux-ec2-sg`; `DB_HOST` matches the endpoint; `docker compose exec backend sh -c 'nc -zv $DB_HOST 5432'` |
| No HTTPS certificate | A record points at the instance; ports 80/443 open; `docker compose logs caddy`; wait for DNS |
| Migration failed | `docker compose logs backend`; rerun with `docker compose exec backend node dist/migrate.js` |
| Build killed (OOM) | Add swap (step 5) |
| Emails missing | Without `SENDGRID_API_KEY` emails only log: `docker compose logs backend \| grep EmailService` |
| CORS errors | `ALLOWED_ORIGINS` must exactly match the site origin (scheme + host) |

Useful commands: `docker compose logs -f backend`, `docker compose up -d --build backend`, `docker stats`.
