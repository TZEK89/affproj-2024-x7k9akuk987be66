# Remote MCP Access Guide: Exposing Local Servers to the World

**Author:** Manus AI  
**Date:** December 26, 2025  
**Version:** 1.0

---

## 1. Introduction & Architecture

This guide provides a comprehensive explanation of how the local MCP (Model Context Protocol) server infrastructure, running on a Windows PC, is securely exposed to the internet, allowing remote machines and services (like a cloud-hosted AI agent) to access its tools. This is the solution to the problem of needing to connect external services to a local development environment.

The entire system is orchestrated by Docker and made accessible via a **Cloudflare Tunnel**, which creates a secure, outbound-only connection from the local machine to the Cloudflare network. This avoids the need for port forwarding, static IPs, or complex firewall rules.

### High-Level Architecture

```mermaid
graph TD
    subgraph Internet
        A[Remote Machine / AI Agent]
    end

    subgraph Cloudflare Network
        B(mcp.mkaxonet.com)
    end

    subgraph Your Windows PC (Host)
        subgraph Docker Desktop
            C[cloudflared Container]
            D[ssh-server Container]
        end
    end

    subgraph ssh-server Container Filesystem
        E[/mcp-servers/manus-bridge]
        F[/mcp-servers/perplexity]
    end

    A -- SSH via cloudflared --> B
    B -- Secure Tunnel --> C
    C -- Forwards SSH traffic --> D
    D -- Serves files from --> E
    D -- Serves files from --> F
```

**The Flow:**

1.  A remote machine makes an SSH request to `mcp.mkaxonet.com`.
2.  Cloudflare routes this request through its secure tunnel to the `cloudflared` container running on your Windows PC.
3.  The `cloudflared` container forwards the SSH traffic to the `ssh-server` container on port 2222.
4.  The remote machine is now connected via SSH to the `ssh-server` container, where it can execute the MCP server scripts (`manus-bridge`, `perplexity`).

---

## 2. Host Machine Setup (Your Windows PC)

This section details the configuration on the host machine that runs the Docker containers.

### 2.1. Prerequisites

-   **Windows 10/11** with WSL2 (Windows Subsystem for Linux) enabled.
-   **Docker Desktop** installed and running in WSL2 mode.
-   A **Cloudflare account** with a registered domain (e.g., `mkaxonet.com`).

### 2.2. The `docker-compose.yml` File

This is the heart of the setup. It defines the two containers and how they interact.

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - mcp-network

  ssh-server:
    image: linuxserver/openssh-server:latest
    container_name: ssh-server
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - PUBLIC_KEY_FILE=/config/authorized_keys
      - SUDO_ACCESS=true
      - PASSWORD_ACCESS=false
    volumes:
      - ./ssh-config:/config
      - /mnt/c/Users/TechS/Desktop/mcp-infrastructure/mcp-servers:/mcp-servers
    ports:
      - "2222:2222"
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

**Key Configurations:**

-   **`cloudflared` service:**
    -   `TUNNEL_TOKEN`: This is the secret token that authenticates the container with your Cloudflare account. You get this when you create a new tunnel in the Cloudflare Zero Trust dashboard.
-   **`ssh-server` service:**
    -   `volumes`: The most critical part. It maps two local folders into the container:
        1.  `./ssh-config:/config`: This maps your local `ssh-config` directory (containing the public SSH key) into the container so the SSH server knows which clients to trust.
        2.  `/mnt/c/Users/TechS/Desktop/mcp-infrastructure/mcp-servers:/mcp-servers`: This maps the folder on your Windows Desktop containing the MCP server files directly into the container. This is how the container accesses the `manus-bridge` and `perplexity` scripts.

### 2.3. Getting the Cloudflare Tunnel Token

1.  Go to the **Cloudflare Zero Trust** dashboard.
2.  Navigate to **Access -> Tunnels**.
3.  Create a new tunnel. Cloudflare will provide you with a `TUNNEL_TOKEN`.
4.  Create a `.env` file in your `~/mcp-infrastructure` directory and add the token:
    ```
    CLOUDFLARE_TUNNEL_TOKEN=your_long_token_here
    ```
5.  In the tunnel configuration in Cloudflare, set up a Public Hostname:
    -   **Subdomain:** `mcp`
    -   **Domain:** `mkaxonet.com`
    -   **Service:** `ssh://ssh-server:2222` (This tells Cloudflare to proxy SSH traffic to the `ssh-server` container on port 2222).

---

## 3. Remote Machine Setup (The Client)

This is the setup required on any machine that needs to connect to your local MCP servers.

### 3.1. Prerequisites

-   **`cloudflared` CLI tool** installed.
-   The **private SSH key** (`mcp_key`) that corresponds to the public key in your host machine's `ssh-config/authorized_keys` file.

### 3.2. SSH Configuration (`~/.ssh/config`)

The key to making this seamless is the SSH config file on the remote machine. It tells the SSH client how to connect to `mcp.mkaxonet.com`.

```
Host mcp.mkaxonet.com
  HostName mcp.mkaxonet.com
  User root
  ProxyCommand C:\Users\YourUser\.cloudflared\bin\cloudflared.exe access ssh --hostname %h
  IdentityFile ~/.ssh/mcp_key
```

**Explanation:**

-   `Host mcp.mkaxonet.com`: Defines a shortcut for this connection.
-   `ProxyCommand`: This is the magic. It tells SSH to not connect directly. Instead, it runs the `cloudflared` command, which handles creating the secure connection to the tunnel. `%h` is replaced with the `HostName`.
-   `IdentityFile`: Specifies the private key to use for authentication.

### 3.3. Making the Connection

Once configured, connecting is as simple as:

```bash
# Test the connection
ssh mcp.mkaxonet.com "echo Connection successful!"

# Run an MCP server
ssh mcp.mkaxonet.com "cd /mcp-servers/manus-bridge && node index.js"
```

This setup allows any authorized remote machine to securely access and run the MCP servers on your local Windows PC as if they were running on a public cloud server, solving the remote access problem entirely.
