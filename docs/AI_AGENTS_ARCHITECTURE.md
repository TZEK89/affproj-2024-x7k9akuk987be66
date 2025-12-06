
# AI Agent Architecture: Offer Research Core

**Objective**: Design a robust, scalable, and intelligent AI agent system for performing human-like research on affiliate marketing platforms. This document outlines the architecture for Core #1: Offer Research AI.

---

## 1. System Overview

The agentic system will be composed of three main layers: the **Orchestration Layer**, the **Agent Layer**, and the **Execution Layer**.

```mermaid
graph TD
    A[User Prompt] --> B{Orchestration Layer};
    B --> C1[Agent #1: Manus];
    B --> C2[Agent #2: Claude];
    B --> C3[Agent #3: ...];
    C1 --> D{Execution Layer (Browser Automation)};
    C2 --> D;
    C3 --> D;
    D --> E[Affiliate Platform Web Interface];
    E --> F{Data Extraction & Structuring};
    F --> G[Backend AI Service];
    G --> H[Dashboard & Alerts];
```

### 1.1. Orchestration Layer
- **Responsibility**: Manages the entire lifecycle of a research task.
- **Components**:
    - **Prompt Processor**: Receives the user's natural language prompt and breaks it down into a structured mission for the agents.
    - **Agent Dispatcher**: Selects and dispatches one or more agents based on the mission requirements (e.g., platform, niche, research depth).
    - **State Manager**: Tracks the state of each agent (e.g., `pending`, `running`, `completed`, `failed`) and the overall mission progress.
    - **Results Aggregator**: Collects and aggregates the results from all agents, handling potential duplicates and conflicts.

### 1.2. Agent Layer
- **Responsibility**: Executes the research mission by interacting with the web interface.
- **Agent Profile**: Each agent is an autonomous entity with its own instance of a browser and a set of tools.
    - **Agent Brain**: A large language model (e.g., Manus, Claude) that makes decisions on what actions to take.
    - **Browser Environment**: A sandboxed browser instance (e.g., using Puppeteer or Playwright) that the agent controls.
    - **Toolbox**: A set of predefined functions the agent can use, such as `login()`, `navigateTo()`, `search()`, `click()`, `extractText()`, `extractTable()`.

### 1.3. Execution Layer
- **Responsibility**: Provides the low-level browser automation capabilities.
- **Technology**: This will be built on top of a browser automation library like **Puppeteer** or **Playwright**.
- **Key Functions**:
    - `launchBrowser()`: Launches a new browser instance with the necessary configuration (e.g., user agent, proxy).
    - `login(platform, credentials)`: Logs into the specified affiliate platform.
    - `searchMarketplace(keywords)`: Navigates to the marketplace and performs a search.
    - `getProductDetails(url)`: Visits a product page and extracts all relevant details.
    - `takeScreenshot()`: Captures a screenshot for visual analysis or debugging.

---

## 2. Agent Workflow: A Step-by-Step Example

**Mission**: "Find the top 3 keto diet products on Hotmart for the Spanish-speaking market."

1.  **Orchestration**: The Orchestration Layer receives the prompt and creates a mission object:
    ```json
    {
      "missionId": "mission-123",
      "platform": "hotmart",
      "niche": "keto diet",
      "language": "Spanish",
      "targetCount": 3
    }
    ```
2.  **Dispatch**: The Agent Dispatcher selects two agents (Manus and Claude) for A/B testing and sends them the mission.
3.  **Execution (Agent #1 - Manus)**:
    a.  `launchBrowser()`
    b.  `login("hotmart", userCredentials)`
    c.  `navigateTo("https://app.hotmart.com/market/hot-products")`
    d.  `searchMarketplace("dieta keto")`
    e.  `setFilter("language", "es")`
    f.  The agent iterates through the search results, calling `getProductDetails()` for each promising product.
    g.  For each product, it extracts the name, price, commission, gravity, and sales page URL.
    h.  It compiles a list of the top 3 products based on its analysis.
4.  **Execution (Agent #2 - Claude)**: Agent #2 performs the same mission in parallel, potentially using a different strategy (e.g., sorting by different criteria).
5.  **Aggregation**: The Orchestration Layer receives the results from both agents.
    - Agent #1 Result: `[productA, productB, productC]`
    - Agent #2 Result: `[productA, productD, productE]`
6.  **Analysis**: The Results Aggregator merges the lists, removes duplicates, and sends the unique products (`[productA, productB, productC, productD, productE]`) to the backend AI service for scoring.
7.  **Scoring & Delivery**: The backend scores the products, and the top 3 are presented to the user on the dashboard.

---

## 3. Technology Stack

- **Orchestration**: Node.js with a job queue system like **BullMQ** to manage the agent tasks.
- **Agents**: The agent logic will be implemented in Node.js, using the respective AI provider's SDK (e.g., `anthropic-sdk`, `manus-sdk`).
- **Execution**: **Playwright** is recommended for browser automation due to its robustness and cross-browser support.
- **Communication**: The Orchestration Layer will communicate with the agents via a message queue (e.g., Redis Pub/Sub).

---

## 4. Implementation Plan

### Phase 1: Build the Execution Layer
- Create a set of robust browser automation functions using Playwright.
- Implement `login()`, `search()`, `getProductDetails()`, etc. for Hotmart.

### Phase 2: Develop a Single Agent
- Build a single agent (e.g., using Claude) that can execute a simple mission.
- Integrate the agent with the Execution Layer.

### Phase 3: Build the Orchestration Layer
- Create the job queue system with BullMQ.
- Implement the prompt processor and agent dispatcher.

### Phase 4: Implement Multi-Agent Support
- Add support for dispatching multiple agents for the same mission.
- Build the results aggregator and A/B testing logic.

### Phase 5: Frontend Integration
- Create the user interface for submitting research prompts.
- Build the dashboard to display the agent's results and progress.

---

This agentic architecture provides a powerful and flexible solution to the challenge of affiliate offer discovery. By simulating human interaction, we can bypass the limitations of APIs and gain access to a much richer dataset, ultimately providing more value to the user.
