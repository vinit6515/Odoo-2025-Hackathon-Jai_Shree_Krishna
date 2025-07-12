from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import uuid
from PIL import Image
import logging
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(_name_)

app = Flask(_name_)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rewear.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_TYPE'] = 'filesystem'

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Create upload directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'items'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'bills'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'avatars'), exist_ok=True)

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'message': 'Authentication required. Please log in.'
            }), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'message': 'Authentication required. Please log in.'
            }), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin access required.'
            }), 403
        return f(*args, **kwargs)
    return decorated_function

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    points = db.Column(db.Integer, default=50)
    role = db.Column(db.String(20), default='user')
    avatar = db.Column(db.String(255))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    items = db.relationship('Item', backref='owner', lazy=True)
    swap_requests_sent = db.relationship('SwapRequest', foreign_keys='SwapRequest.requester_id', backref='requester', lazy=True)
    swap_requests_received = db.relationship('SwapRequest', foreign_keys='SwapRequest.owner_id', backref='owner_user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'points': self.points,
            'role': self.role,
            'avatar': self.avatar,
            'bio': self.bio,
            'location': self.location,
            'phone': self.phone,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    items = db.relationship('Item', backref='category_ref', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(20), nullable=False)
    condition = db.Column(db.String(50), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, swapped, claimed
    listing_type = db.Column(db.String(20), default='swap')  # swap, donation
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    bill_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    views = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    
    # Relationships
    images = db.relationship('ItemImage', backref='item', lazy=True, cascade='all, delete-orphan')
    tags = db.relationship('ItemTag', backref='item', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category_ref.name if self.category_ref else None,
            'type': self.type,
            'size': self.size,
            'condition': self.condition,
            'points': self.points,
            'status': self.status,
            'listing_type': self.listing_type,
            'views': self.views,
            'likes': self.likes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'owner': self.owner.to_dict() if self.owner else None,
            'images': [img.image_path for img in self.images],
            'tags': [tag.tag for tag in self.tags]
        }

class ItemImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ItemTag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    tag = db.Column(db.String(50), nullable=False)

class SwapRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    offered_item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=True)
    points_offered = db.Column(db.Integer, default=0)
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships with different foreign keys
    requested_item = db.relationship('Item', foreign_keys=[item_id], backref='swap_requests_for_item')
    offered_item = db.relationship('Item', foreign_keys=[offered_item_id], backref='swap_requests_offering_item')
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'requester_id': self.requester_id,
            'owner_id': self.owner_id,
            'offered_item_id': self.offered_item_id,
            'points_offered': self.points_offered,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'requester': self.requester.to_dict() if self.requester else None,
            'requested_item': self.requested_item.to_dict() if self.requested_item else None,
            'offered_item': self.offered_item.to_dict() if self.offered_item else None
        }

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Error Handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad Request',
        'message': 'The request could not be understood by the server.'
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Unauthorized',
        'message': 'Authentication required to access this resource.'
    }), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource.'
    }), 403

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Not Found',
        'message': 'The requested resource was not found.'
    }), 404

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        'success': False,
        'error': 'File Too Large',
        'message': 'The uploaded file is too large. Maximum size is 16MB.'
    }), 413

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500

# Utility Functions
def save_file(file, folder, max_size=(800, 800)):
    """Save uploaded file with proper validation and processing"""
    try:
        if not file or file.filename == '':
            raise ValueError("No file provided")
        
        filename = secure_filename(file.filename)
        if not filename:
            raise ValueError("Invalid filename")
        
        # Generate unique filename
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], folder, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Process image if it's an image file
        if file_ext in ALLOWED_IMAGE_EXTENSIONS:
            try:
                with Image.open(file_path) as img:
                    # Convert to RGB if necessary
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    
                    # Resize if too large
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    img.save(file_path, optimize=True, quality=85)
            except Exception as e:
                logger.warning(f"Image processing failed: {str(e)}")
        
        return unique_filename
    except Exception as e:
        logger.error(f"File save error: {str(e)}")
        raise

def calculate_item_points(condition, category, listing_type):
    """Calculate points for an item based on condition and category"""
    # Donations are always 0 points
    if listing_type == 'donation':
        return 0
    
    base_points = {
        'Tops': 10,
        'Bottoms': 15,
        'Dresses': 20,
        'Outerwear': 25,
        'Shoes': 20,
        'Accessories': 10,
        'Bags': 15,
        'Jewelry': 12
    }
    
    condition_multiplier = {
        'Like New': 1.5,
        'Excellent': 1.3,
        'Good': 1.0,
        'Fair': 0.7
    }
    
    base = base_points.get(category, 15)
    multiplier = condition_multiplier.get(condition, 1.0)
    
    return int(base * multiplier)

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validation
        if not data or not all(k in data for k in ('email', 'password', 'name')):
            return jsonify({
                'success': False,
                'message': 'Email, password, and name are required.'
            }), 400
        
        email = data['email'].lower().strip()
        name = data['name'].strip()
        password = data['password']
        
        # Validate email format
        if '@' not in email or len(email) < 5:
            return jsonify({
                'success': False,
                'message': 'Please enter a valid email address.'
            }), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 6 characters long.'
            }), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'success': False,
                'message': 'An account with this email already exists.'
            }), 400
        
        # Create new user
        user = User(
            email=email,
            name=name,
            password_hash=generate_password_hash(password),
            points=50  # Welcome bonus
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create session
        session['user_id'] = user.id
        session['user_role'] = user.role
        
        logger.info(f"New user registered: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully! Welcome to ReWear!',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({
                'success': False,
                'message': 'Email and password are required.'
            }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password.'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Your account has been deactivated. Please contact support.'
            }), 403
        
        # Create session
        session['user_id'] = user.id
        session['user_role'] = user.role
        
        logger.info(f"User logged in: {email}")
        
        return jsonify({
            'success': True,
            'message': f'Welcome back, {user.name}!',
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Login failed. Please try again.'
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'You have been successfully logged out.'
        })
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Logout failed.'
        }), 500

@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    try:
        user = User.query.get(session['user_id'])
        if not user:
            session.clear()
            return jsonify({
                'success': False,
                'message': 'User not found.'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch user data.'
        }), 500

# User Routes
@app.route('/api/user/profile', methods=['GET'])
@login_required
def get_profile():
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found.'
            }), 404
        
        # Get user statistics
        total_items = Item.query.filter_by(user_id=user_id).count()
        approved_items = Item.query.filter_by(user_id=user_id, status='approved').count()
        total_swaps = SwapRequest.query.filter_by(requester_id=user_id, status='completed').count()
        
        user_data = user.to_dict()
        user_data['stats'] = {
            'total_items': total_items,
            'approved_items': approved_items,
            'total_swaps': total_swaps
        }
        
        return jsonify({
            'success': True,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch profile.'
        }), 500

@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile():
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found.'
            }), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name'].strip()
        if 'bio' in data:
            user.bio = data['bio'].strip()
        if 'location' in data:
            user.location = data['location'].strip()
        if 'phone' in data:
            user.phone = data['phone'].strip()
        if 'address' in data:
            user.address = data['address'].strip()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully!',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update profile.'
        }), 500

# Category Routes
@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify({
            'success': True,
            'categories': [cat.to_dict() for cat in categories]
        })
    except Exception as e:
        logger.error(f"Get categories error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch categories.'
        }), 500

# Item Routes
@app.route('/api/items', methods=['POST'])
@login_required
def create_item():
    try:
        user_id = session['user_id']
        
        # Get form data
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_name = request.form.get('category', '').strip()
        item_type = request.form.get('type', '').strip()
        size = request.form.get('size', '').strip()
        condition = request.form.get('condition', '').strip()
        listing_type = request.form.get('listing_type', 'swap').strip()
        tags = request.form.getlist('tags[]')
        
        # Validation
        if not all([title, description, category_name, item_type, size, condition]):
            return jsonify({
                'success': False,
                'message': 'All item details are required.'
            }), 400
        
        # Get or create category
        category = Category.query.filter_by(name=category_name).first()
        if not category:
            category = Category(name=category_name)
            db.session.add(category)
            db.session.flush()
        
        # Calculate points
        points = calculate_item_points(condition, category_name, listing_type)
        
        # Create item
        item = Item(
            title=title,
            description=description,
            category_id=category.id,
            type=item_type,
            size=size,
            condition=condition,
            points=points,
            listing_type=listing_type,
            user_id=user_id,
            status='pending' if listing_type == 'swap' else 'approved'  # Auto-approve donations
        )
        
        db.session.add(item)
        db.session.flush()
        
        # Handle file uploads
        uploaded_files = []
        
        # Handle item images
        if 'images' in request.files:
            files = request.files.getlist('images')
            if len(files) > 5:
                return jsonify({
                    'success': False,
                    'message': 'Maximum 5 images allowed per item.'
                }), 400
            
            for i, file in enumerate(files):
                if file and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                    try:
                        filename = save_file(file, 'items')
                        item_image = ItemImage(
                            item_id=item.id,
                            image_path=filename,
                            is_primary=(i == 0)
                        )
                        db.session.add(item_image)
                        uploaded_files.append(filename)
                    except Exception as e:
                        logger.error(f"Image upload error: {str(e)}")
                        return jsonify({
                            'success': False,
                            'message': f'Failed to upload image: {file.filename}'
                        }), 400
        
        # Handle bill upload (optional for donations)
        if 'bill' in request.files:
            bill_file = request.files['bill']
            if bill_file and allowed_file(bill_file.filename, ALLOWED_DOCUMENT_EXTENSIONS):
                try:
                    bill_filename = save_file(bill_file, 'bills', max_size=(1200, 1200))
                    item.bill_path = bill_filename
                    uploaded_files.append(bill_filename)
                except Exception as e:
                    logger.error(f"Bill upload error: {str(e)}")
                    return jsonify({
                        'success': False,
                        'message': 'Failed to upload bill/receipt.'
                    }), 400
        
        # Add tags
        for tag in tags:
            if tag.strip():
                item_tag = ItemTag(item_id=item.id, tag=tag.strip().lower())
                db.session.add(item_tag)
        
        db.session.commit()
        
        logger.info(f"New item created: {title} by user {user_id} (type: {listing_type})")
        
        message = 'Item submitted successfully! It will be reviewed by our team.' if listing_type == 'swap' else 'Item donated successfully! It is now available for others to claim.'
        
        return jsonify({
            'success': True,
            'message': message,
            'item': {
                'id': item.id,
                'title': item.title,
                'status': item.status,
                'points': item.points,
                'listing_type': item.listing_type
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Clean up uploaded files on error
        for filename in uploaded_files:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], 'items', filename))
            except:
                pass
        
        logger.error(f"Create item error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create item. Please try again.'
        }), 500

@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        category = request.args.get('category')
        condition = request.args.get('condition')
        size = request.args.get('size')
        search = request.args.get('search', '').strip()
        status = request.args.get('status', 'approved')
        listing_type = request.args.get('listing_type', 'swap')
        
        # Build query
        query = Item.query.filter_by(status=status, listing_type=listing_type)
        
        if category and category != 'All':
            cat = Category.query.filter_by(name=category).first()
            if cat:
                query = query.filter_by(category_id=cat.id)
        
        if condition and condition != 'All':
            query = query.filter_by(condition=condition)
        
        if size and size != 'All':
            query = query.filter_by(size=size)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Item.title.ilike(search_term),
                    Item.description.ilike(search_term)
                )
            )
        
        # Order by creation date (newest first)
        query = query.order_by(Item.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        items = []
        for item in pagination.items:
            # Get primary image
            primary_image = ItemImage.query.filter_by(
                item_id=item.id, is_primary=True
            ).first()
            
            item_data = item.to_dict()
            item_data['primary_image'] = primary_image.image_path if primary_image else None
            items.append(item_data)
        
        return jsonify({
            'success': True,
            'items': items,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        logger.error(f"Get items error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch items.'
        }), 500

@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    try:
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found.'
            }), 404
        
        # Increment view count
        item.views += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': item.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Get item error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch item details.'
        }), 500

@app.route('/api/items/user', methods=['GET'])
@login_required
def get_user_items():
    try:
        user_id = session['user_id']
        items = Item.query.filter_by(user_id=user_id).order_by(Item.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'items': [item.to_dict() for item in items]
        })
        
    except Exception as e:
        logger.error(f"Get user items error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch your items.'
        }), 500

# Donation claim route
@app.route('/api/items/<int:item_id>/claim', methods=['POST'])
@login_required
def claim_donation_item(item_id):
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found.'
            }), 404
        
        if item.user_id == user_id:
            return jsonify({
                'success': False,
                'message': 'You cannot claim your own item.'
            }), 400
        
        if item.listing_type != 'donation':
            return jsonify({
                'success': False,
                'message': 'This item is not available for donation.'
            }), 400
        
        if item.status != 'approved':
            return jsonify({
                'success': False,
                'message': 'This item is not available for claiming.'
            }), 400
        
        # Process claim
        item.status = 'claimed'
        
        # Create a swap request record for tracking
        swap_request = SwapRequest(
            item_id=item_id,
            requester_id=user_id,
            owner_id=item.user_id,
            points_offered=0,
            message='Donation claim',
            status='completed'
        )
        
        db.session.add(swap_request)
        db.session.commit()
        
        logger.info(f"Donation claimed: {item_id} by user {user_id}")
        
        return jsonify({
            'success': True,
            'message': f'Item claimed successfully! Please contact {item.owner.name} to arrange pickup.',
            'owner_contact': {
                'name': item.owner.name,
                'location': item.owner.location,
                'phone': item.owner.phone if item.owner.phone else None
            }
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Claim item error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to claim item.'
        }), 500

# Admin Routes
@app.route('/api/admin/items/pending', methods=['GET'])
@admin_required
def get_pending_items():
    try:
        items = Item.query.filter_by(status='pending').order_by(Item.created_at.desc()).all()
        
        pending_items = []
        for item in items:
            # Get primary image
            primary_image = ItemImage.query.filter_by(
                item_id=item.id, is_primary=True
            ).first()
            
            item_data = item.to_dict()
            item_data['primary_image'] = primary_image.image_path if primary_image else None
            item_data['has_bill'] = bool(item.bill_path)
            item_data['bill_path'] = item.bill_path  # Add bill path for viewing
            pending_items.append(item_data)
        
        return jsonify({
            'success': True,
            'items': pending_items
        })
        
    except Exception as e:
        logger.error(f"Get pending items error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch pending items.'
        }), 500

@app.route('/api/admin/items/<int:item_id>/approve', methods=['POST'])
@admin_required
def approve_item(item_id):
    try:
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found.'
            }), 404
        
        if item.status != 'pending':
            return jsonify({
                'success': False,
                'message': 'Item is not pending approval.'
            }), 400
        
        item.status = 'approved'
        item.updated_at = datetime.utcnow()
        
        # Award points to the user for approved swaps
        if item.listing_type == 'swap':
            item.owner.points += 5  # Bonus for approved item
        
        db.session.commit()
        
        logger.info(f"Item approved: {item.title} (ID: {item.id}) by admin {session['user_id']}")
        
        return jsonify({
            'success': True,
            'message': f'Item "{item.title}" has been approved successfully!'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Approve item error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to approve item.'
        }), 500

@app.route('/api/admin/items/<int:item_id>/reject', methods=['POST'])
@admin_required
def reject_item(item_id):
    try:
        data = request.get_json()
        reason = data.get('reason', 'Item does not meet our guidelines.') if data else 'Item does not meet our guidelines.'
        
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found.'
            }), 404
        
        if item.status != 'pending':
            return jsonify({
                'success': False,
                'message': 'Item is not pending approval.'
            }), 400
        
        item.status = 'rejected'
        item.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Item rejected: {item.title} (ID: {item.id}) by admin {session['user_id']}")
        
        return jsonify({
            'success': True,
            'message': f'Item "{item.title}" has been rejected.'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Reject item error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to reject item.'
        }), 500

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    try:
        stats = {
            'pending_items': Item.query.filter_by(status='pending').count(),
            'approved_items': Item.query.filter_by(status='approved').count(),
            'total_users': User.query.filter_by(is_active=True).count(),
            'total_swaps': SwapRequest.query.filter_by(status='completed').count(),
            'reports': Report.query.filter_by(status='pending').count()
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Get admin stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch admin statistics.'
        }), 500

# File serving route
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Swap Request Routes
@app.route('/api/swap-requests', methods=['POST'])
@login_required
def create_swap_request():
    try:
        data = request.get_json()
        user_id = session['user_id']
        
        item_id = data.get('item_id')
        message = data.get('message', '')
        request_type = data.get('type', 'points')  # 'points' or 'item'
        offered_item_id = data.get('offered_item_id')
        points_offered = data.get('points_offered', 0)
        
        if not item_id:
            return jsonify({
                'success': False,
                'message': 'Item ID is required.'
            }), 400
        
        # Get the item
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found.'
            }), 404
        
        if item.user_id == user_id:
            return jsonify({
                'success': False,
                'message': 'You cannot request to swap your own item.'
            }), 400
        
        if item.status != 'approved':
            return jsonify({
                'success': False,
                'message': 'This item is not available for swap.'
            }), 400
        
        if item.listing_type != 'swap':
            return jsonify({
                'success': False,
                'message': 'This item is not available for swap.'
            }), 400
        
        # Check if user has enough points for points-based swap
        user = User.query.get(user_id)
        if request_type == 'points' and user.points < item.points:
            return jsonify({
                'success': False,
                'message': f'Insufficient points. You need {item.points} points but have {user.points}.'
            }), 400
        
        # Check for existing pending request
        existing_request = SwapRequest.query.filter_by(
            item_id=item_id,
            requester_id=user_id,
            status='pending'
        ).first()
        
        if existing_request:
            return jsonify({
                'success': False,
                'message': 'You already have a pending request for this item.'
            }), 400
        
        # Create swap request
        swap_request = SwapRequest(
            item_id=item_id,
            requester_id=user_id,
            owner_id=item.user_id,
            offered_item_id=offered_item_id if request_type == 'item' else None,
            points_offered=points_offered if request_type == 'points' else 0,
            message=message
        )
        
        db.session.add(swap_request)
        db.session.commit()
        
        logger.info(f"Swap request created: {swap_request.id} by user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Swap request sent successfully!',
            'swap_request': swap_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create swap request error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create swap request.'
        }), 500

@app.route('/api/swap-requests/user', methods=['GET'])
@login_required
def get_user_swap_requests():
    try:
        user_id = session['user_id']
        request_type = request.args.get('type', 'all')  # 'sent', 'received', 'all'
        
        query = SwapRequest.query
        
        if request_type == 'sent':
            query = query.filter_by(requester_id=user_id)
        elif request_type == 'received':
            query = query.filter_by(owner_id=user_id)
        else:
            query = query.filter(
                db.or_(
                    SwapRequest.requester_id == user_id,
                    SwapRequest.owner_id == user_id
                )
            )
        
        swap_requests = query.order_by(SwapRequest.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'swap_requests': [req.to_dict() for req in swap_requests]
        })
        
    except Exception as e:
        logger.error(f"Get user swap requests error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch swap requests.'
        }), 500

@app.route('/api/swap-requests/<int:request_id>/accept', methods=['POST'])
@login_required
def accept_swap_request(request_id):
    try:
        user_id = session['user_id']
        
        swap_request = SwapRequest.query.get(request_id)
        if not swap_request:
            return jsonify({
                'success': False,
                'message': 'Swap request not found.'
            }), 404
        
        if swap_request.owner_id != user_id:
            return jsonify({
                'success': False,
                'message': 'You can only accept requests for your own items.'
            }), 403
        
        if swap_request.status != 'pending':
            return jsonify({
                'success': False,
                'message': 'This request has already been processed.'
            }), 400
        
        # Process the swap
        item = swap_request.requested_item
        requester = swap_request.requester
        owner = User.query.get(swap_request.owner_id)
        
        if swap_request.points_offered > 0:
            # Points-based swap
            if requester.points < swap_request.points_offered:
                return jsonify({
                    'success': False,
                    'message': 'Requester has insufficient points.'
                }), 400
            
            # Transfer points
            requester.points -= swap_request.points_offered
            owner.points += swap_request.points_offered
        
        # Update swap request status
        swap_request.status = 'accepted'
        swap_request.updated_at = datetime.utcnow()
        
        # Mark item as swapped
        item.status = 'swapped'
        
        db.session.commit()
        
        logger.info(f"Swap request accepted: {request_id}")
        
        # Return contact information for coordination
        return jsonify({
            'success': True,
            'message': 'Swap request accepted successfully!',
            'contact_info': {
                'requester': {
                    'name': requester.name,
                    'location': requester.location,
                    'phone': requester.phone
                },
                'owner': {
                    'name': owner.name,
                    'location': owner.location,
                    'phone': owner.phone
                }
            }
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Accept swap request error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to accept swap request.'
        }), 500

@app.route('/api/swap-requests/<int:request_id>/reject', methods=['POST'])
@login_required
def reject_swap_request(request_id):
    try:
        user_id = session['user_id']
        
        swap_request = SwapRequest.query.get(request_id)
        if not swap_request:
            return jsonify({
                'success': False,
                'message': 'Swap request not found.'
            }), 404
        
        if swap_request.owner_id != user_id:
            return jsonify({
                'success': False,
                'message': 'You can only reject requests for your own items.'
            }), 403
        
        if swap_request.status != 'pending':
            return jsonify({
                'success': False,
                'message': 'This request has already been processed.'
            }), 400
        
        swap_request.status = 'rejected'
        swap_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Swap request rejected: {request_id}")
        
        return jsonify({
            'success': True,
            'message': 'Swap request rejected.'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Reject swap request error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to reject swap request.'
        }), 500

# Points redemption route
@app.route('/api/items/<int:item_id>/redeem', methods=['POST'])
@login_required
def redeem_item_with_points(item_id):
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found.'
            }), 404
        
        if item.user_id == user_id:
            return jsonify({
                'success': False,
                'message': 'You cannot redeem your own item.'
            }), 400
        
        if item.status != 'approved':
            return jsonify({
                'success': False,
                'message': 'This item is not available for redemption.'
            }), 400
        
        if item.listing_type != 'swap':
            return jsonify({
                'success': False,
                'message': 'This item is not available for redemption.'
            }), 400
        
        if user.points < item.points:
            return jsonify({
                'success': False,
                'message': f'Insufficient points. You need {item.points} points but have {user.points}.'
            }), 400
        
        # Process redemption
        user.points -= item.points
        item.owner.points += item.points
        item.status = 'swapped'
        
        # Create a swap request record for tracking
        swap_request = SwapRequest(
            item_id=item_id,
            requester_id=user_id,
            owner_id=item.user_id,
            points_offered=item.points,
            message='Direct redemption with points',
            status='completed'
        )
        
        db.session.add(swap_request)
        db.session.commit()
        
        logger.info(f"Item redeemed: {item_id} by user {user_id} for {item.points} points")
        
        return jsonify({
            'success': True,
            'message': f'Item redeemed successfully for {item.points} points!',
            'remaining_points': user.points,
            'contact_info': {
                'owner': {
                    'name': item.owner.name,
                    'location': item.owner.location,
                    'phone': item.owner.phone
                }
            }
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Redeem item error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to redeem item.'
        }), 500

# Messages/Chat routes
@app.route('/api/messages', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.get_json()
        sender_id = session['user_id']
        recipient_id = data.get('recipient_id')
        content = data.get('content', '').strip()
        
        if not recipient_id or not content:
            return jsonify({
                'success': False,
                'message': 'Recipient and message content are required.'
            }), 400
        
        if sender_id == recipient_id:
            return jsonify({
                'success': False,
                'message': 'You cannot send a message to yourself.'
            }), 400
        
        # Check if recipient exists
        recipient = User.query.get(recipient_id)
        if not recipient:
            return jsonify({
                'success': False,
                'message': 'Recipient not found.'
            }), 404
        
        # For now, just return success (implement actual messaging later)
        return jsonify({
            'success': True,
            'message': f'Message sent to {recipient.name}!'
        })
        
    except Exception as e:
        logger.error(f"Send message error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to send message.'
        }), 500

# Initialize database
def create_tables():
    with app.app_context():
        # Drop all tables first to avoid foreign key issues
        db.drop_all()
        
        # Create all tables
        db.create_all()
        
        # Create default categories
        default_categories = [
            'Tops', 'Bottoms', 'Dresses', 'Outerwear', 
            'Shoes', 'Accessories', 'Bags', 'Jewelry'
        ]
        
        for cat_name in default_categories:
            category = Category(name=cat_name)
            db.session.add(category)
        
        # Create admin user if not exists
        admin_email = 'admin@rewear.com'
        admin = User(
            email=admin_email,
            name='Admin',
            password_hash=generate_password_hash('admin123'),
            role='admin',
            points=1000
        )
        db.session.add(admin)
        
        # Create a test user
        test_user = User(
            email='test@rewear.com',
            name='Test User',
            password_hash=generate_password_hash('test123'),
            role='user',
            points=100,
            location='New York, NY',
            phone='+1 (555) 123-4567'
        )
        db.session.add(test_user)
        
        db.session.commit()
        
        # Create some sample items for the carousel
        sample_items = [
            {
                'title': 'Vintage Denim Jacket',
                'description': 'Classic vintage denim jacket in excellent condition.',
                'category': 'Outerwear',
                'type': 'Casual',
                'size': 'M',
                'condition': 'Excellent',
                'listing_type': 'swap',
                'user_id': test_user.id
            },
            {
                'title': 'Designer Silk Scarf',
                'description': 'Beautiful silk scarf from a luxury brand.',
                'category': 'Accessories',
                'type': 'Formal',
                'size': 'One Size',
                'condition': 'Like New',
                'listing_type': 'swap',
                'user_id': test_user.id
            },
            {
                'title': 'Cotton Summer Dress',
                'description': 'Light and comfortable summer dress.',
                'category': 'Dresses',
                'type': 'Casual',
                'size': 'S',
                'condition': 'Good',
                'listing_type': 'donation',
                'user_id': test_user.id
            }
        ]
        
        for item_data in sample_items:
            category = Category.query.filter_by(name=item_data['category']).first()
            if category:
                points = calculate_item_points(item_data['condition'], item_data['category'], item_data['listing_type'])
                item = Item(
                    title=item_data['title'],
                    description=item_data['description'],
                    category_id=category.id,
                    type=item_data['type'],
                    size=item_data['size'],
                    condition=item_data['condition'],
                    points=points,
                    listing_type=item_data['listing_type'],
                    user_id=item_data['user_id'],
                    status='approved'  # Pre-approve sample items
                )
                db.session.add(item)
        
        db.session.commit()
        print("Database initialized with sample data including donations!")

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, host='0.0.0.0', port=5001)
# KEEP THIS FILE AS APP.PY