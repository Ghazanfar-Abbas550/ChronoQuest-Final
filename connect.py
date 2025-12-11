import mariadb
import sys
import os

# --- Database Configuration ---
# IMPORTANT: Use environment variables for sensitive data in production.
# The defaults below are placeholders. The code below now uses these variables.
DB_HOST = os.environ.get("MARIADB_HOST", "localhost")
# NOTE: Using the hardcoded values as fallbacks here for robustness
DB_USER = os.environ.get("MARIADB_USER", "futuretechnologies")
DB_PASSWORD = os.environ.get("MARIADB_PASSWORD", "Btno9180?")
DB_NAME = "chronoquest"


def _connect():
    """Internal function to establish a database connection, now using variables."""
    try:
        conn = mariadb.connect(
            # CRITICAL FIX: Use the variables defined above
            host=DB_HOST,
            port=3306,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            autocommit=True
        )
        return conn
    except mariadb.Error as e:
        # Print a clearer error message to help diagnose connection failure
        print(f"Error connecting to MariaDB using User '{DB_USER}' at Host '{DB_HOST}': {e}", file=sys.stderr)
        return None

def get_db_cursor():
    """
    Establishes a connection and returns the connection object and a cursor.
    Used primarily for SELECT queries where results need immediate processing
    (e.g., in `find_user` or `load_all_airports`).

    Returns: (cursor, connection) or (None, None) on failure.
    """
    conn = _connect()
    if conn:
        try:
            cursor = conn.cursor()
            return cursor, conn
        except mariadb.Error as e:
            print(f"Error creating cursor: {e}", file=sys.stderr)
            conn.close()
            return None, None
    return None, None

def close_db_cursor(cursor, conn):
    """Closes the cursor and the database connection."""
    if cursor:
        cursor.close()
    if conn:
        # Note: Connection is not committed here as this function is used after SELECT
        conn.close()

def execute_query(query, params=None):
    """
    Executes a non-SELECT database query (INSERT, UPDATE, DELETE) and handles commit/rollback.

    Returns: True on successful commit, False on error.
    """
    conn = None
    cursor = None
    try:
        conn = _connect()
        if not conn:
            return False

        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return True

    except mariadb.Error as e:
        print(f"Error executing query: {e}", file=sys.stderr)
        if conn:
            conn.rollback()
        return False

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()