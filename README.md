## Submission for identity reconciliation task

https://bitespeed.notion.site/Bitespeed-Backend-Task-Identity-Reconciliation-1fb21bb2a930802eb896d4409460375c


## Setup locally

```bash
uv sync
```

### Run locally

```bash
fastapi dev src/main.py
```

## Build with docker

```bash
docker build -t kurayami07734/identity-api:<version> .
```

### Run

```bash
docker run -p 8000:8000 -t kurayami07734/identity-api:0.0.1
```
