from duck_client import DuckClient
class Table:
    def __init__(self, name, schema=[], primary_key=None, error_behavior='skip'):
        """
        Initialize a Table object.
        
        Args:
            name (str): Name of the table
            schema (list): List of tuples (column_name, data_type)
            primary_key (str): Column name to use as primary key
            error_behavior (str): How to handle type errors during insert
                                 'skip': Skip the row
                                 'null': Set value to NULL
                                 'error': Raise exception
                                 'convert': Try to convert to the right type
        """
        self.name = name
        self.schema = schema
        self.primary_key = primary_key
        self.error_behavior = error_behavior
        
        # Validate inputs
        if self.primary_key and self.primary_key not in [col[0] for col in self.schema]:
            raise ValueError(f"Primary key '{primary_key}' must be a column in the schema")
        
        if self.error_behavior not in ['skip', 'null', 'error', 'convert']:
            raise ValueError("error_behavior must be 'skip', 'null', 'error', or 'convert'")
        
        # Create a dictionary for quick type checking
        self.column_types = {col_name: data_type for col_name, data_type in self.schema}
        
    def create_sql(self):
        """
        Generate SQL statement to create this table.
        
        Returns:
            str: SQL CREATE TABLE statement
        """
        # Generate column definitions
        col_defs = []
        for col_name, data_type in self.schema:
            if col_name == self.primary_key:
                col_defs.append(f'"{col_name}" {data_type} PRIMARY KEY')
            else:
                col_defs.append(f'"{col_name}" {data_type}')
        
        # Join column definitions
        columns_sql = ",\n    ".join(col_defs)
        
        # Create the full SQL statement
        sql = f'CREATE TABLE IF NOT EXISTS "{self.name}" (\n    {columns_sql}\n)'
        
        return sql
    
    def insert_sql(self, data_rows):
        """
        Generate SQL to insert rows into the table.
        
        Args:
            data_rows (list): List of dictionaries containing column-value pairs
            
        Returns:
            tuple: (SQL statement, list of valid rows to insert)
        """
        if not data_rows:
            return None, []
        
        # Process rows according to schema and error_behavior
        processed_rows = []
        valid_rows = []
        
        for row in data_rows:
            processed_row = {}
            row_valid = True
            
            # Check each column in the schema
            for col_name, data_type in self.schema:
                if col_name not in row:
                    # Column missing in the data
                    processed_row[col_name] = None
                    continue
                
                value = row[col_name]
                
                # Skip None values (they'll be NULL in the database)
                if value is None:
                    processed_row[col_name] = None
                    continue
                
                # Validate value against expected type
                try:
                    # Basic type validation - could be expanded for more specific types
                    if data_type.upper().startswith('INT') and not isinstance(value, int):
                        if self.error_behavior == 'convert':
                            processed_row[col_name] = int(float(value))
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Value '{value}' for column '{col_name}' is not of type {data_type}")
                        else:  # skip
                            row_valid = False
                            break
                    
                    elif data_type.upper().startswith(('FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC')) and not isinstance(value, (int, float)):
                        if self.error_behavior == 'convert':
                            processed_row[col_name] = float(value)
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Value '{value}' for column '{col_name}' is not of type {data_type}")
                        else:  # skip
                            row_valid = False
                            break
                    
                    elif data_type.upper().startswith(('VARCHAR', 'CHAR', 'TEXT')) and not isinstance(value, str):
                        if self.error_behavior == 'convert':
                            processed_row[col_name] = str(value)
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Value '{value}' for column '{col_name}' is not of type {data_type}")
                        else:  # skip
                            row_valid = False
                            break
                    
                    elif data_type.upper().startswith(('BOOLEAN', 'BOOL')) and not isinstance(value, bool):
                        if self.error_behavior == 'convert':
                            if isinstance(value, str):
                                processed_row[col_name] = value.lower() in ('true', 't', 'yes', 'y', '1')
                            elif isinstance(value, (int, float)):
                                processed_row[col_name] = bool(value)
                            else:
                                processed_row[col_name] = bool(value)
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Value '{value}' for column '{col_name}' is not of type {data_type}")
                        else:  # skip
                            row_valid = False
                            break
                    
                    else:
                        # Pass the value as-is for other types or if it matches expected type
                        processed_row[col_name] = value
                        
                except (ValueError, TypeError) as e:
                    if self.error_behavior == 'error':
                        raise
                    elif self.error_behavior == 'null':
                        processed_row[col_name] = None
                    elif self.error_behavior == 'skip':
                        row_valid = False
                        break
                    # For 'convert', the exception was already handled in the try block
            
            if row_valid:
                valid_rows.append(processed_row)
        
        if not valid_rows:
            return None, []
        
        # Build the SQL statement
        col_names = [f'"{col[0]}"' for col in self.schema]
        columns_str = ", ".join(col_names)
        
        # Build the placeholders for values
        placeholders = []
        for i, _ in enumerate(valid_rows):
            row_placeholders = [f':{i}_{col[0]}' for col in self.schema]
            placeholders.append(f"({', '.join(row_placeholders)})")
        
        values_str = ",\n    ".join(placeholders)
        
        # Create the final SQL with parameters
        sql = f'INSERT INTO "{self.name}" ({columns_str})\nVALUES\n    {values_str}'
        
        return sql, valid_rows
    
    def prepare_params(self, valid_rows):
        """
        Prepare parameters for parameterized SQL execution.
        
        Args:
            valid_rows (list): List of validated row dictionaries
            
        Returns:
            dict: Parameters ready for SQL execution
        """
        params = {}
        for i, row in enumerate(valid_rows):
            for col_name in [col[0] for col in self.schema]:
                params[f'{i}_{col_name}'] = row.get(col_name)
        
        return params
    
    def get_data_for_insert(self, conn, data_rows):
        """
        Process data rows and execute insert SQL.
        
        Args:
            conn: Database connection
            data_rows (list): List of dictionaries containing column-value pairs
            
        Returns:
            tuple: (sql, params, success_count, error_count)
        """
        # Generate SQL and get valid rows
        try:
            sql, valid_rows = self.insert_sql(data_rows)
            
            if not sql:
                print("No SQL generated - all rows invalid")
                return None, {}, 0, len(data_rows)
            
            # Prepare parameters
            params = self.prepare_params(valid_rows)
            
            # Return SQL and parameters for execution
            return sql, params, len(valid_rows), len(data_rows) - len(valid_rows)
        except Exception as e:
            print(f"Error in get_data_for_insert: {str(e)}")
            import traceback
            traceback.print_exc()
            return None, {}, 0, len(data_rows)
    
    def insert(self, conn, data_rows):
        """
        Insert data rows into the table using a simpler approach.
        
        Args:
            conn: Database connection
            data_rows (list): List of dictionaries containing column-value pairs
            
        Returns:
            tuple: (success_count, error_count)
        """
        if not data_rows:
            return 0, 0
        
        # Process rows according to schema and error_behavior
        valid_rows = []
        for row in data_rows:
            try:
                processed_row = {}
                for col_name, data_type in self.schema:
                    if col_name not in row:
                        processed_row[col_name] = None
                        continue
                    
                    value = row[col_name]
                    if value is None:
                        processed_row[col_name] = None
                        continue
                    
                    # Basic type conversions
                    if data_type.upper().startswith('INT') and not isinstance(value, int):
                        if self.error_behavior == 'convert':
                            processed_row[col_name] = int(float(value))
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Type mismatch for {col_name}")
                        else:  # skip
                            raise ValueError(f"Skipping row due to type mismatch for {col_name}")
                    elif data_type.upper().startswith(('FLOAT', 'DOUBLE', 'DECIMAL')) and not isinstance(value, (int, float)):
                        if self.error_behavior == 'convert':
                            processed_row[col_name] = float(value)
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Type mismatch for {col_name}")
                        else:  # skip
                            raise ValueError(f"Skipping row due to type mismatch for {col_name}")
                    elif data_type.upper().startswith(('BOOL', 'BOOLEAN')) and not isinstance(value, bool):
                        if self.error_behavior == 'convert':
                            if isinstance(value, str):
                                processed_row[col_name] = value.lower() in ('true', 't', 'yes', 'y', '1')
                            else:
                                processed_row[col_name] = bool(value)
                        elif self.error_behavior == 'null':
                            processed_row[col_name] = None
                        elif self.error_behavior == 'error':
                            raise ValueError(f"Type mismatch for {col_name}")
                        else:  # skip
                            raise ValueError(f"Skipping row due to type mismatch for {col_name}")
                    else:
                        processed_row[col_name] = value
                
                valid_rows.append(processed_row)
                
            except Exception as e:
                if self.error_behavior == 'error':
                    raise
                print(f"Skipping row due to error: {e}")
        
        if not valid_rows:
            return 0, len(data_rows)
        
        try:
            # Insert each valid row separately for better error handling
            success_count = 0
            for row in valid_rows:
                try:
                    # Build column and value lists
                    columns = []
                    values = []
                    for col_name, _ in self.schema:
                        columns.append(f'"{col_name}"')
                        values.append(row.get(col_name))
                    
                    # Create SQL
                    cols_str = ', '.join(columns)
                    placeholders = ', '.join(['?' for _ in values])
                    sql = f'INSERT INTO "{self.name}" ({cols_str}) VALUES ({placeholders})'
                    
                    # Execute
                    conn.execute(sql, values)
                    success_count += 1
                    
                except Exception as e:
                    print(f"Error inserting row: {e}")
            
            return success_count, len(data_rows) - success_count
        
        except Exception as e:
            print(f"Error in insert: {e}")
            return 0, len(data_rows)
    
    def create(self, conn):
        """
        Create the table in the database.
        
        Args:
            conn: Database connection
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn.execute(self.create_sql())
            return True
        except Exception as e:
            print(f"Error creating table: {e}")
            return False
