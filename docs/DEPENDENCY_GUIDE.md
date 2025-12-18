# Project Dependency Guide

**Author:** Manus AI  
**Date:** December 17, 2025  
**Version:** 1.0

---

## 1. Introduction

This document provides a comprehensive overview of every dependency used in the AI Affiliate Marketing System, for both the backend and frontend. It explains what each package does, why it is necessary for the project, and how it fits into the overall architecture.

---

## 2. Backend Dependencies (`backend/package.json`)

The backend is a Node.js application built with the Express framework. It serves as the central API, manages the database, handles business logic, and orchestrates AI tasks.

### Core & Framework

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `express` | A minimal and flexible Node.js web application framework. | **The foundation of our backend.** It provides the routing, middleware, and server infrastructure for our entire API. |
| `dotenv` | Loads environment variables from a `.env` file into `process.env`. | **Essential for configuration.** It allows us to manage sensitive keys and settings (database URLs, API keys) outside of our code, which is critical for security and portability. |
| `cors` | A Node.js package for providing a Connect/Express middleware that can be used to enable CORS (Cross-Origin Resource Sharing). | **Enables frontend-backend communication.** It allows our Next.js frontend (running on a different domain/port) to make requests to our backend API securely. |

### Database & Data Management

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `@supabase/supabase-js` | The official JavaScript client for Supabase. | **Our primary database interface.** It provides a simple and powerful way to interact with our PostgreSQL database, handle authentication, and manage storage. |
| `pg` | The Node.js driver for PostgreSQL. | **Required by Supabase.** While we use the Supabase client for most interactions, this underlying driver is necessary for the client to connect to the PostgreSQL database. |
| `bullmq` | A robust and fast job queue system for Node.js, built on top of Redis. | **Manages background tasks.** It will be used to handle long-running processes like AI content generation, data scraping, and analytics processing without blocking the main API. |

### Security & Authentication

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `jsonwebtoken` | An implementation of JSON Web Tokens (JWT). | **Handles user authentication.** It will be used to create and verify JWTs, allowing us to secure our API endpoints and ensure that only authenticated users can access their data. |
| `bcryptjs` | A library to help you hash passwords. | **Secures user passwords.** It hashes user passwords before storing them in the database, which is a critical security measure to prevent password theft. |
| `express-validator` | A set of Express.js middlewares that wraps `validator.js` validator and sanitizer functions. | **Prevents malicious input.** It validates and sanitizes incoming API requests, protecting our application from common vulnerabilities like injection attacks and data corruption. |

### AI & Web Scraping

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `openai` | The official Node.js library for the OpenAI API. | **Powers our AI features.** It allows us to connect to OpenAI models (like GPT-4) for content generation, data analysis, and other AI-driven tasks. |
| `playwright` | A Node.js library to automate Chromium, Firefox, and WebKit with a single API. | **Our primary web automation tool.** It enables our agentic scraping system to control a real browser, log into platforms, navigate pages, and extract data. |
| `playwright-extra` | A modular plugin framework for Playwright. | **Enhances Playwright.** It allows us to add plugins to Playwright, making our automation more powerful and harder to detect. |
| `puppeteer-extra-plugin-stealth` | A plugin for `playwright-extra` that helps to prevent detection of the automated browser. | **Makes our scraping invisible.** This is one of the most important packages for our scraping core, as it applies various techniques to make our automated browser appear like a normal human user. |

### Utilities

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `axios` | A promise-based HTTP client for the browser and Node.js. | **Makes external API calls.** It provides a simple and reliable way to communicate with third-party APIs (e.g., affiliate networks, ad platforms). |
| `multer` | A Node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files. | **Handles file uploads.** It will be used for features that require users to upload files, such as images for landing pages or data for analysis. |
| `uuid` | A library for generating universally unique identifiers (UUIDs). | **Creates unique IDs.** It generates unique IDs for database records, session identifiers, and other items that require a guaranteed unique key. |
| `winston` | A multi-transport async logging library for Node.js. | **Provides production-grade logging.** It allows us to create structured, leveled logs that can be sent to files or other services, which is essential for debugging and monitoring the application in production. |

### Development Dependencies

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `nodemon` | A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected. | **Improves developer workflow.** It saves us from manually restarting the server every time we make a code change, speeding up development significantly. |

---

## 3. Frontend Dependencies (`frontend/package.json`)

The frontend is a Next.js application, which provides a modern, performant, and feature-rich user interface for the platform.

### Core Framework

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `next` | The React framework for production. | **The foundation of our frontend.** It provides server-side rendering, static site generation, routing, and a complete development environment for building our user interface. |
| `react` | A JavaScript library for building user interfaces. | **The core UI library.** It allows us to build our application as a set of reusable components. |
| `react-dom` | Serves as the entry point to the DOM and server renderers for React. | **Connects React to the browser.** It renders the React components into the actual HTML DOM. |

### Data Fetching & State Management

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `@tanstack/react-query` | A powerful data-fetching and state-management library. | **Manages server state.** It simplifies fetching, caching, synchronizing, and updating server data in our application, providing a much better user experience with features like automatic refetching and stale-while-revalidate. |
| `axios` | A promise-based HTTP client. | **Communicates with our backend.** It is used to make all API calls from the frontend to our backend Express server. |
| `zustand` | A small, fast, and scalable state-management solution. | **Manages client state.** It provides a simple way to manage global client-side state (e.g., UI state, user settings) that needs to be shared across multiple components. |

### UI & Styling

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `lucide-react` | A simply beautiful and consistent icon toolkit. | **Provides high-quality icons.** It gives us a rich set of icons to use throughout the application, improving the user experience and visual appeal. |
| `recharts` | A composable charting library built on React components. | **Creates data visualizations.** It is used to build the charts and graphs in our analytics dashboards, allowing users to visualize their performance data. |
| `clsx` | A tiny utility for constructing `className` strings conditionally. | **Simplifies dynamic styling.** It makes it easy to apply CSS classes to components based on their state or props. |
| `tailwind-merge` | A utility function to merge Tailwind CSS classes without style conflicts. | **Prevents styling conflicts.** It intelligently merges Tailwind CSS classes, which is especially useful when creating reusable components with variant styles. |

### Development Dependencies

| Package | What It Does | Why We Need It |
| :--- | :--- | :--- |
| `typescript` | A typed superset of JavaScript that compiles to plain JavaScript. | **Ensures code quality and safety.** It adds static types to our code, which helps to catch errors early, improve code readability, and make the codebase more maintainable. |
| `@types/*` | These packages contain type definitions for their corresponding JavaScript libraries. | **Provides type safety for libraries.** They allow TypeScript to understand the shapes and types of external libraries, enabling better autocompletion and type checking. |
| `tailwindcss` | A utility-first CSS framework for rapidly building custom designs. | **Our primary CSS framework.** It allows us to build a modern, responsive, and custom-designed UI without writing a lot of custom CSS. |
| `autoprefixer` | A PostCSS plugin to parse CSS and add vendor prefixes to CSS rules. | **Ensures cross-browser compatibility.** It automatically adds browser-specific prefixes to our CSS, so our styles work correctly across all modern browsers. |
| `postcss` | A tool for transforming CSS with JavaScript. | **Required by Tailwind CSS.** It is part of the toolchain that processes our Tailwind CSS classes into actual CSS. |
| `eslint` | A pluggable and configurable linter tool for identifying and reporting on patterns in JavaScript. | **Enforces code quality and consistency.** It helps us maintain a consistent code style and avoid common programming errors. |
| `eslint-config-next` | The official ESLint configuration for Next.js. | **Provides Next.js-specific linting rules.** It includes rules that are optimized for Next.js applications, helping us to follow best practices. |
