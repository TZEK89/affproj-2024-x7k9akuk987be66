# Remote Access Procedure Guide: MCP Infrastructure

**Date:** 2025-12-24  
**Author:** Manus AI  
**Status:** Final

---

## 1. Introduction

This document provides a comprehensive, step-by-step guide for configuring any remote machine (laptop, work PC, etc.) to securely access the self-hosted MCP (Model Context Protocol) infrastructure running on your primary Windows PC. 

The goal is to enable seamless access to your containerized MCP servers (Manus Bridge, Perplexity, etc.) from any instance of Claude Desktop, regardless of your physical location. This is achieved by leveraging Cloudflare Tunnel in conjunction with the `cloudflared` client application, which creates a secure, private connection without exposing any ports on your home network.

## 2. Core Concept: Secure Access via Cloudflare Tunnel

Standard SSH connections to a public domain are not directly supported by the Cloudflare Tunnel's public hostname feature in a straightforward manner. The correct and most secure method is to use the `cloudflared` command-line tool on each remote (client) machine.

Here is the connection flow:

1.  **Claude Desktop** initiates an MCP command.
2.  The command uses `ssh mcp.mkaxonet.com`.
3.  Your local **SSH client** reads its configuration file (`~/.ssh/config`).
4.  The config file instructs SSH to use `cloudflared` as a **proxy** for the `mcp.mkaxonet.com` host.
5.  **`cloudflared`** authenticates with the Cloudflare network and establishes a secure, private tunnel to your host machine.
6.  The connection is passed to the **`ssh-server` Docker container** running on your Windows PC.
7.  The MCP command is executed inside the container, and the result is passed back along the same secure path.

This architecture ensures that your home network remains completely firewalled, with no open ports, providing robust security.

## 3. Host Machine Prerequisites

Before configuring your remote devices, ensure the following conditions are met on your **host Windows PC**:

-   The PC is powered on and connected to the internet.
-   Docker Desktop is running.
-   The MCP infrastructure containers are active. You can verify this by running the following command in WSL2:
    ```bash
    cd ~/mcp-infrastructure && docker-compose ps
    ```
    You should see both `cloudflared` and `ssh-server` in a running state.

## 4. Configuration on Each Remote Machine

Follow these steps on **every new machine** you wish to grant access to.

### Step 1: Install the `cloudflared` Client

The `cloudflared` tool is required to establish the secure tunnel from the client side.

| Operating System | Installation Command |
| :--- | :--- |
| **macOS** | `brew install cloudflare/cloudflare/cloudflared` |
| **Windows** | `winget install cloudflare.cloudflared` |
| **Linux (Debian/Ubuntu)** | `wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb` |

### Step 2: Copy the SSH Private Key

The same SSH private key must be present on each remote machine to authenticate with your SSH server.

1.  **On your host Windows PC (in WSL2)**, display the private key:
    ```bash
    cat ~/.ssh/mcp_key
    ```
2.  **Copy the entire output**, including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.

3.  **On the remote machine**, save the key to the correct location:

    -   **For macOS or Linux:**
        ```bash
        # Create the .ssh directory if it doesn't exist
        mkdir -p ~/.ssh

        # Create the key file and paste the content
        nano ~/.ssh/mcp_key

        # Set strict file permissions (CRITICAL for security)
        chmod 600 ~/.ssh/mcp_key
        ```

    -   **For Windows:**
        Open PowerShell and run the following to avoid line-ending issues:
        ```powershell
        # Create the .ssh directory
        New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.ssh

        # Copy the key directly from the host's WSL2 filesystem
        wsl cat /home/mk/.ssh/mcp_key > $env:USERPROFILE\.ssh\mcp_key
        ```

### Step 3: Configure the SSH Client

This is the most critical step. You must tell your SSH client to use `cloudflared` as a proxy for your domain.

1.  **On the remote machine**, create or edit the SSH configuration file:

    -   **macOS/Linux:** `nano ~/.ssh/config`
    -   **Windows:** `notepad $env:USERPROFILE\.ssh\config`

2.  **Add the following configuration block** to the file:

    ```
    Host mcp.mkaxonet.com
      ProxyCommand cloudflared access ssh --hostname %h
      User linuxserver.io
      Port 22
      IdentityFile ~/.ssh/mcp_key
    ```
    *Note for Windows users: Replace `~/.ssh/mcp_key` with the full Windows path `C:\Users\YourUsername\.ssh\mcp_key` in the `IdentityFile` line.*

### Step 4: Test the Connection

From the remote machine's terminal (or PowerShell), run the following command:

```bash
ssh mcp.mkaxonet.com "echo Connection to self-hosted MCP infrastructure successful!"
```

If this is the first time connecting, you may be prompted to authenticate with Cloudflare, which will open a browser window. After logging in, you should see the success message.

### Step 5: Configure Claude Desktop

Finally, configure your Claude Desktop instance on the remote machine. The configuration is now clean and portable because all the complex proxy logic is handled by your SSH config file.

1.  Open your `claude_desktop_config.json` file.
2.  Add or update the MCP server configurations as follows. Note that the command is now a simple `ssh` call to your domain.

    ```json
    {
      "mcpServers": {
        "manus-bridge": {
          "command": "ssh",
          "args": [
            "mcp.mkaxonet.com",
            "cd /mcp-servers/manus-bridge && MANUS_API_KEY=sk-g48GnXmhIEDgpk2rumkTRJFujjTFOzzH11rE0cNoyqzpy2S-ypPuI3rFG9YHIGz6Mrc2ZcB0dpc7Gi_dWfvsSZqOQUER node index.js"
          ]
        },
        "perplexity": {
          "command": "ssh",
          "args": [
            "mcp.mkaxonet.com",
            "cd /mcp-servers/perplexity && PERPLEXITY_API_KEY=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 node index.js"
          ]
        }
      }
    }
    ```

3.  Restart Claude Desktop.

## 5. Conclusion

By following this procedure on each new device, you can grant secure, authenticated access to your centralized MCP infrastructure. This setup provides the flexibility of remote access while maintaining a high level of security, as your home network remains completely isolated from the public internet. Your self-hosted MCP hub is now a truly portable and powerful extension of your AI- AI- AI-
