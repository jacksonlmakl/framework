from table import Table
from duck_client import DuckClient
import pandas as pd
import json
import os
import importlib.util
import sys
import yaml
import duckdb
import pandas as pd
import os
import pyarrow as pa
import pyarrow.dataset as ds
from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import (
    NestedField, StringType, IntegerType, DoubleType, 
    TimestampType, BooleanType, DecimalType, DateType
)
from pyiceberg.table import TableProperties
from pyiceberg.partitioning import PartitionSpec

def duckdb_to_iceberg(
    duckdb_path, 
    iceberg_dir, 
    catalog_name="local_catalog",
    warehouse_path=None
):
    """
    Convert a DuckDB database file to Apache Iceberg tables in a directory.
    
    Args:
        duckdb_path: Path to the DuckDB database file
        iceberg_dir: Directory to store the Iceberg tables
        catalog_name: Name for the Iceberg catalog
        warehouse_path: Optional custom warehouse path
    """
    # Make sure the output directory exists
    os.makedirs(iceberg_dir, exist_ok=True)
    
    if warehouse_path is None:
        warehouse_path = os.path.join(iceberg_dir, "warehouse")
    os.makedirs(warehouse_path, exist_ok=True)
    
    # Connect to the DuckDB database
    conn = duckdb.connect(duckdb_path)
    
    # Get list of tables in the DuckDB database
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()
    tables = [table[0] for table in tables]
    
    print(f"Found {len(tables)} tables in DuckDB database: {', '.join(tables)}")
    
    # Use a simpler approach with PyArrow
    for table_name in tables:
        print(f"Processing table: {table_name}")
        
        # Fetch data from DuckDB
        data_df = conn.execute(f"SELECT * FROM {table_name}").fetchdf()
        
        if len(data_df) > 0:
            # Convert to PyArrow table
            data_table = pa.Table.from_pandas(data_df)
            
            # Define output path
            table_dir = os.path.join(warehouse_path, table_name)
            os.makedirs(table_dir, exist_ok=True)
            
            # Write as Parquet file (closest to Iceberg without full catalog)
            pq.write_table(
                data_table, 
                os.path.join(table_dir, f"{table_name}.parquet"),
                compression='snappy'
            )
                
            print(f"  - Wrote {len(data_df)} rows to {table_name}.parquet")
        else:
            print(f"  - Table {table_name} is empty")
    
    conn.close()
    print("Conversion complete!")

def execute_python_file(file_path):
    """
    Execute a Python file given its path.
    
    Args:
        file_path (str): Path to the Python file to execute
        
    Returns:
        bool: True if execution succeeded, False otherwise
    """
    try:
        # Check if file exists
        if not os.path.isfile(file_path):
            print(f"Error: File not found: {file_path}")
            return False
            
        # Get the absolute path
        abs_path = os.path.abspath(file_path)
        
        # Get the directory containing the file
        dir_path = os.path.dirname(abs_path)
        
        # Add the directory to sys.path to handle imports in the target file
        if dir_path not in sys.path:
            sys.path.insert(0, dir_path)
        
        # Get the filename without extension
        file_name = os.path.basename(file_path)
        module_name = os.path.splitext(file_name)[0]
        
        # Load the module specification
        spec = importlib.util.spec_from_file_location(module_name, abs_path)
        if spec is None:
            print(f"Error: Could not load specification for {file_path}")
            return False
            
        # Create the module
        module = importlib.util.module_from_spec(spec)
        
        # Add the module to sys.modules
        sys.modules[module_name] = module
        
        # Execute the module
        spec.loader.exec_module(module)
        
        print(f"Successfully executed {file_path}")
        return True
        
    except Exception as e:
        print(f"Error executing {file_path}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Load config file path from os
config_path = os.environ.get('TABLE',None)
if config_path!=None:
    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
# Get the path from environment variable
path = os.environ.get('EXECUTE', None)

# Determine if it's a data file or SQL file
data_path = path if path and any(('.json' in path.lower(),'.csv' in path.lower(),'.parquet' in path.lower())) else None
sql_path = path if path and '.sql' in path.lower() else None
python_path = path if path and '.py' in path.lower() else None
# Establish client
_db = os.environ.get('DATABASE', None)
if config_path !=None:
    client = DuckClient(config['database'])
    conn = client.connect()
elif _db !=None:
    client = DuckClient(_db)
    conn = client.connect()
else:
    conn=None
if config_path !=None:
    # Create table if not exists
    table = Table(
        name=config["name"],
        schema=config['schema_definition'],
        primary_key=config["primary_key"],
        error_behavior=config["error_behavior"]  # Try to convert invalid types
    )
    if table.create(conn):
        print("Table created successfully!")


if data_path:
    file_ext = os.path.splitext(data_path)[1].lower()
    
    if file_ext == '.json':
        # Load JSON file
        with open(data_path, 'r') as file:
            data = json.load(file)
    
    elif file_ext == '.csv':
        # Load CSV file
        import pandas as pd
        df = pd.read_csv(data_path)
        data = df.to_dict(orient='records')
    
    elif file_ext == '.parquet':
        # Load Parquet file
        import pandas as pd
        import pyarrow.parquet as pq
        df = pd.read_parquet(data_path)
        data = df.to_dict(orient='records')
    
    else:
        print(f"Unsupported file format: {file_ext}")
        data = []
    
    if data:
        success, errors = table.insert(conn, data)
        print(f"Inserted {success} rows, {errors} errors")
    else:
        print("No data to insert")
elif sql_path  and config_path != None:
    with open(sql_path, 'r') as file:
        sql_string = file.read()
        query = f"""
        CREATE OR REPLACE TABLE {config['name']} AS (
        {sql_string}
        );
        """
        conn.execute(query)
        print("Record Count", conn.execute(f'SELECT COUNT(*) FROM {config["name"]}').fetchall()[0][0])
elif sql_path and _db != None:
    with open(sql_path, 'r') as file:
        sql_string = file.read()
        _e=conn.execute(sql_string)
        print("Result: ",_e.fetchall())
elif python_path:
    r=execute_python_file(python_path)
    print("Success: ",r)

if conn != None:
    conn.close()
    duckdb_to_iceberg(
    duckdb_path=f"config['name'].duckdb",
    iceberg_dir="./iceberg_tables"
)
