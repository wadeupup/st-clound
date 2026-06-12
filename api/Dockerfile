FROM python:3.12.10-slim-bookworm AS build

LABEL maintainer="https://github.com/prowler-cloud/api"

ARG POWERSHELL_VERSION=7.5.0
ENV POWERSHELL_VERSION=${POWERSHELL_VERSION}

ARG TRIVY_VERSION=0.70.0
ENV TRIVY_VERSION=${TRIVY_VERSION}

# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    libicu72 \
    gcc \
    g++ \
    make \
    libxml2-dev \
    libxmlsec1-dev \
    libxmlsec1-openssl \
    pkg-config \
    libtool \
    libxslt1-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PowerShell
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        wget --progress=dot:giga https://github.com/PowerShell/PowerShell/releases/download/v${POWERSHELL_VERSION}/powershell-${POWERSHELL_VERSION}-linux-x64.tar.gz -O /tmp/powershell.tar.gz ; \
    elif [ "$ARCH" = "aarch64" ]; then \
        wget --progress=dot:giga https://github.com/PowerShell/PowerShell/releases/download/v${POWERSHELL_VERSION}/powershell-${POWERSHELL_VERSION}-linux-arm64.tar.gz -O /tmp/powershell.tar.gz ; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1 ; \
    fi && \
    mkdir -p /opt/microsoft/powershell/7 && \
    tar zxf /tmp/powershell.tar.gz -C /opt/microsoft/powershell/7 && \
    chmod +x /opt/microsoft/powershell/7/pwsh && \
    ln -s /opt/microsoft/powershell/7/pwsh /usr/bin/pwsh && \
    rm /tmp/powershell.tar.gz

# Install Trivy for IaC scanning
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        TRIVY_ARCH="Linux-64bit" ; \
    elif [ "$ARCH" = "aarch64" ]; then \
        TRIVY_ARCH="Linux-ARM64" ; \
    else \
        echo "Unsupported architecture for Trivy: $ARCH" && exit 1 ; \
    fi && \
    wget --progress=dot:giga "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_${TRIVY_ARCH}.tar.gz" -O /tmp/trivy.tar.gz && \
    tar zxf /tmp/trivy.tar.gz -C /tmp && \
    mv /tmp/trivy /usr/local/bin/trivy && \
    chmod +x /usr/local/bin/trivy && \
    rm /tmp/trivy.tar.gz && \
    # Create trivy cache directory with proper permissions
    mkdir -p /tmp/.cache/trivy && \
    chmod 777 /tmp/.cache/trivy

# Poetry needs git to install dependencies declared with git URLs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Add prowler user
RUN addgroup --gid 1002 prowler && \
    adduser --uid 1002 --gid 1002 --disabled-password --gecos "" prowler

USER prowler

WORKDIR /home/prowler

# Ensure output directory exists
RUN mkdir -p /tmp/prowler_api_output

ENV PATH="/home/prowler/.local/bin:$PATH"

RUN pip install --no-cache-dir --retries 10 --timeout 120 --upgrade pip && \
    pip install --no-cache-dir --retries 10 --timeout 120 poetry

COPY --chown=prowler:prowler api/pyproject.toml api/poetry.lock ./
COPY --chown=prowler:prowler pyproject.toml poetry.lock prowler-cli.py ./local-cspm-backend/
COPY --chown=prowler:prowler prowler/ ./local-cspm-backend/prowler/
COPY --chown=prowler:prowler dashboard/ ./local-cspm-backend/dashboard/

# Poetry expects the prowler dependency to come from a Git URL. Build a local
# Git source from the checked-out workspace so Docker builds use local code.
RUN mkdir -p ./local-cspm-backend && \
    touch ./local-cspm-backend/README.md && \
    cd ./local-cspm-backend && \
    git init -b main && \
    git config user.email "local-build@example.invalid" && \
    git config user.name "Local Build" && \
    git add . && \
    git commit -m "local prowler source" && \
    LOCAL_PROWLER_REF="$(git rev-parse HEAD)" && \
    cd /home/prowler && \
    sed -i "s/resolved_reference = \"[^\"]*\"/resolved_reference = \"${LOCAL_PROWLER_REF}\"/" poetry.lock && \
    git config --global url."file:///home/prowler/local-cspm-backend".insteadOf "https://github.com/Markkkkdd/cspm-backend.git"

# Add `--no-root` to avoid installing the current project as a package
RUN poetry config installer.max-workers 1 && \
    poetry config requests.max-retries 10 && \
    for attempt in 1 2 3 4 5; do \
        poetry install --no-root && break; \
        if [ "$attempt" = "5" ]; then exit 1; fi; \
        echo "poetry install failed, retrying attempt $((attempt + 1))/5"; \
        sleep 10; \
    done && \
    rm -rf ~/.cache/pip

RUN PYTHONPATH=/home/prowler/local-cspm-backend poetry run python "/home/prowler/local-cspm-backend/prowler/providers/m365/lib/powershell/m365_powershell.py"

COPY api/src/backend/ ./backend/
COPY api/docker-entrypoint.sh ./docker-entrypoint.sh

WORKDIR /home/prowler/backend

# Development image
FROM build AS dev

ENTRYPOINT ["../docker-entrypoint.sh", "dev"]

# Production image
FROM build

ENTRYPOINT ["../docker-entrypoint.sh", "prod"]
