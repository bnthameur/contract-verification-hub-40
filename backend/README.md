
# FormalBase Backend

This is the backend service for FormalBase, a smart contract verification platform.

## Setup

1. Create a `.env` file based on `.env.example` with your Supabase credentials:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-service-role-key
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
uvicorn main:app --reload
```

## Docker Setup

1. Build the Docker image:

```bash
docker build -t formalbase-api .
```

2. Run the container:

```bash
docker run -p 8000:8000 --env-file .env formalbase-api
```

## Endpoints

- `POST /analyze` - Analyze a smart contract with Slither
- `GET /results/{project_id}` - Get verification results for a project
