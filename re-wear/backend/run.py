"""
Production-ready Flask application runner
"""
import os
from app import app, db

if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Import and run initialization
        from app import create_tables
        create_tables()
    
    # Run the application
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
