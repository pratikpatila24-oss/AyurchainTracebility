# Ayurvedic Traceability PoC

This project is a Proof of Concept (PoC) for an end-to-end traceability system for Ayurvedic products. It leverages a simulated blockchain for immutable record-keeping and integrates Google's Gemini AI for intelligent insights.

## Features

- **End-to-End Traceability**: Track products from harvest (Farmer) to collection, lab testing, and manufacturing.
- **Simulated Blockchain**: `blockchain_sim.js` ensures data integrity with a tamper-evident ledger.
- **Role-Based Access**: Dedicated interfaces for Farmers, Collectors, Quality Labs, and Manufacturers.
- **AI Integration**: Uses Google Gemini AI to generate content and insights based on product data.
- **QR Code Generation**: Generate QR codes for batch tracking.

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Blockchain**: Custom JavaScript simulation (linked list with hashing)
- **AI**: Google Gemini API

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install Dependencies:**
    This is the most critical step. Run the following command to download and install all required libraries (creates the `node_modules` folder):
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the Application

You need to run both the backend server and the frontend development server.

1.  **Start the Backend Server:**
    Open a terminal and run:
    ```bash
    npm start
    ```
    *The server will start on port 4000.*

2.  **Start the Frontend (React):**
    Open a **new** terminal window/tab and run:
    ```bash
    npm run start:dev
    ```
    *The application will open in your browser at `http://localhost:3000`.*

## Project Structure

- **`server.js`**: Main entry point for the backend server.
- **`routes.js`**: Defines API endpoints for blockchain interactions and AI features.
- **`blockchain_sim.js`**: Core logic for the simulated blockchain ledger.
- **`src/`**: React source code (components, pages, styles).

## API Endpoints

- `POST /api/harvest`: Record a new harvest.
- `POST /api/collection`: Record a collection event.
- `POST /api/quality`: Submit lab test results.
- `POST /api/processing`: Record manufacturing details.
- `GET /api/chain`: Retrieve the entire blockchain ledger.
- `POST /api/generate-content`: Query the Gemini AI.
