from module import Table
from module import DuckClient
import pandas as pd
import json
import os

# Load config file path from os
config_path = os.environ.get('CONFIG_PATH')
with open(config_path, 'r') as file:
    config = json.load(file)
    
# Establish client
client = DuckClient(config['database'])
conn = client.connect()

# Create table if not exists
table = Table(
    name=config["name"],
    schema=config['schema_definition'],
    primary_key=config["primary_key"],
    error_behavior=config["error_behavior"]  # Try to convert invalid types
)
if table.create(conn):
    print("Table created successfully!")

# Get the path from environment variable
path = os.environ.get('DATA_PATH', None)

# Determine if it's a data file or SQL file
data_path = path if path and '.json' in path.lower() else None
sql_path = path if path and '.sql' in path.lower() else None

if data_path:
    with open(data_path, 'r') as file:
        data = json.load(file)
    success, errors = table.insert(conn, data)
    print(f"Inserted {success} rows, {errors} errors")
elif sql_path:
    with open(sql_path, 'r') as file:
        sql_string = file.read()
        query = f"""
        CREATE OR REPLACE TABLE {config['name']} AS (
        {sql_string}
        );
        """
        conn.execute(query)

print("Record Count", conn.execute(f'SELECT COUNT(*) FROM {config["name"]}').fetchall()[0][0])
conn.close()

"""
python3 -m venv env && source env/bin/activate && pip install -r requirements.txt
CONFIG_PATH='config.json' DATA_PATH='data.json' python main.py && CONFIG_PATH='sql_config.json' DATA_PATH='table.sql' python main.py

"""
