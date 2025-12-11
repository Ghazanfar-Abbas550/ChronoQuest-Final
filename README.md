# ChronoQuest: Global Navigator

ChronoQuest is an interactive, browser-based strategy game built around time-travel and global navigation. Players must manage resources (Credits and Energy) while traveling between real-world airports to collect scarce **ChronoShards** and **Fluxfire** to win the game.

The project is built on a robust client-server architecture, utilizing a powerful Python backend (Flask) to handle game logic and a dynamic frontend (HTML/CSS/JavaScript) for the player experience.

## Getting Started

### Prerequisites

You will need the following installed:

  * Python 3.8+
  * MariaDB (or equivalent MySQL database)
  * Required Python packages (listed in `requirements.txt`)

### Installation & Setup

1.  **Clone the Repository:**

    ```bash
    git clone [repository-url]
    cd ChronoQuest
    ```

2.  **Database Setup:**

      Run the create-databse.sql

3.  **Install Python Dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask Application:**

    ```bash
    python app.py
    ```

    The application will typically start on `http://127.0.0.1:5000`.

5.  **Access the Game:**
    Open your browser and navigate to `http://127.0.0.1:5000/start`.

## Architecture and Technology

The project follows a standard three-tier architecture:

| Component | Files | Technologies | Role |
| :--- | :--- | :--- | :--- |
| **Frontend (UI)** | `start,main,end,quit.html`, `start,main,end,quit.css`, `start,main,end.js` | HTML 5, CSS 3, JavaScript, **Leaflet.js** | Provides the interactive map and game display. Handles user input and communicates with the backend via API calls. |
| **Backend (Logic)** | `app.py` | **Python 3**, **Flask** | Implements all core game logic, API routes (`/api/main/state`, `/api/game/travel`, etc.), resource management, and session control. Includes secure password handling (`scrypt`). |
| **Data Layer** | `connect.py`, `airport-data.json` | **MariaDB**, Python `mariadb` connector | Manages persistent user accounts, game states, and the underlying airport and travel data. |

### Key Features Implemented

  * **Interactive Map:** The main game screen utilizes the **Leaflet.js** library to display airport locations and allows players to visually select their next travel destination.
  * **Secure Authentication:** User accounts are managed with robust, secure password hashing using the `scrypt` algorithm.
  * **Database Integration:** Game and user data are persisted in a MariaDB database, utilizing custom Python functions (`connect.py`) for secure and modular database interaction.
  * **Accurate Travel:** Flight distances are calculated using the **Haversine formula** to provide accurate, real-world travel costs in energy.
  * **Dynamic UI:** The frontend is a single-page application experience. JavaScript handles all game-state updates and UI changes after receiving JSON responses from the server.
  * **Badges System:** A comprehensive system tracks player achievements (both wins and losses) and awards titles based on performance, as defined in `badges.json`.
