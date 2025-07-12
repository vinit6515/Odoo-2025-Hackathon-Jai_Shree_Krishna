#!/usr/bin/env python3
"""
Initialize the database with proper schema and sample data
"""
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app, create_tables

if __name__ == '__main__':
    print("Initializing database...")
    create_tables()
    print("Database initialization complete!")
