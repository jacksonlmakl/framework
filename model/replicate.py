import json

# Sample customer data
customer_data = [
   {
       "customer_id": 1, 
       "name": "John Doe", 
       "email": "john@example.com", 
       "signup_date": "2023-01-15", 
       "lifetime_value": 1250.50, 
       "is_active": True
   },
   {
       "customer_id": 2, 
       "name": "Jane Smith", 
       "email": "jane@example.com", 
       "signup_date": "2023-02-20", 
       "lifetime_value": 550.75, 
       "is_active": True
   }
]

# Write the data to data.json
with open('model/data.json', 'w') as json_file:
   # Use indent for pretty formatting and ensure_ascii=False to handle non-ASCII characters
   json.dump(customer_data, json_file, indent=4, ensure_ascii=False)
   
print("Successfully created data.json")