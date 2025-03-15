from module import Table
from module import DuckClient
import pandas as pd
import json
import os

#Load config file path from os
config_path = os.environ.get('CONFIG_PATH')
with open(config_path, 'r') as file:
    config = json.load(file)
    
#Establish client
client = DuckClient(config['database'])
conn = client.connect()

#Create table if not exists
table = Table(
    name=config["name"],
    schema=config['schema_definition'],
    primary_key=config["primary_key"],
    error_behavior=config["error_behavior"]  # Try to convert invalid types
)
if table.create(conn):
    print("Table created successfully!")

_path=os.environ.get('PATH',None)
data_path = _path if '.json' in _path.lower() else None
sql_path = _path if '.sql' in _path.lower() else None
if data_path:
    with open(data_path, 'r') as file:
        data = json.load(file)
    success, errors = table.insert(conn, data)
    print(f"Inserted {success} rows, {errors} errors")
elif sql_path:
    with open(sql_path, 'r') as file:
        sql_string = file.read()
        query=f"""
        CREATE OR REPLACE TABLE {config['name']} AS (
        {sql_string}
        );
        """
        conn.execute(query)

print("Record Count",conn.execute(f'SELECT COUNT(*) FROM {config["name"]}').fetchall()[0][0])
conn.close()

"""
CONFIG_PATH='config.json' PATH='data.json' python main.py && CONFIG_PATH='sql_config.json' PATH='table.sql' python main.py

"""