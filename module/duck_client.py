import duckdb
import os

class DuckClient:
    def __init__(self, db_name):
        self.db_name = db_name
        self.conn = None
        self.db_dir = "duckdb"  # Directory for all DuckDB files
    
    def connect(self):
        """
        Creates a new DuckDB database or connects to an existing one.
        Makes a 'duckdb' directory if it doesn't exist.
        
        Returns:
            duckdb.DuckDBPyConnection: Connection to the database
        """
        # Create duckdb directory if it doesn't exist
        if not os.path.exists(self.db_dir):
            try:
                os.makedirs(self.db_dir)
                print(f"Created directory: {self.db_dir}")
            except Exception as e:
                print(f"Warning: Couldn't create directory {self.db_dir}, using current directory. Error: {e}")
                self.db_dir = "."
        
        # Add .duckdb extension if not present
        if not self.db_name.endswith('.duckdb'):
            db_path = os.path.join(self.db_dir, f"{self.db_name}.duckdb")
        else:
            db_path = os.path.join(self.db_dir, self.db_name)
        
        # Check if database exists
        db_exists = os.path.exists(db_path)
        
        # Connect to the database (creates it if it doesn't exist)
        connection = duckdb.connect(db_path)
        
        if db_exists:
            print(f"Connected to existing database: {db_path}")
        else:
            print(f"Created new database: {db_path}")
        
        self.conn = connection
        return connection
    
    def execute(self, query, params=None):
        """
        Execute a SQL query.
        
        Args:
            query: SQL query to execute
            params: Optional parameters for the query
            
        Returns:
            Query result
        """
        if self.conn is None:
            self.connect()
            
        if params:
            return self.conn.execute(query, params)
        else:
            return self.conn.execute(query)
    
    def close(self):
        """Close the database connection."""
        if self.conn is not None:
            self.conn.close()
            self.conn = None
            print("Connection closed")