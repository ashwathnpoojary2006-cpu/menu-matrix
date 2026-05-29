from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import json, os, random, secrets, hashlib, traceback
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='../')
CORS(app)

# ===== NO-CACHE HEADERS — must be before app.run =====
@app.after_request
def add_no_cache(response):
    ct = response.content_type or ''
    if any(x in ct for x in ('text/html', 'application/javascript', 'text/css')):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma']        = 'no-cache'
        response.headers['Expires']       = '0'
    return response

# ===== DATABASE =====
use_sqlite = os.getenv('USE_SQLITE', 'true').lower() == 'true'
if use_sqlite:
    db_path = os.path.join(os.path.dirname(__file__), 'menumatrix.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
else:
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '3306')
    user = os.getenv('DB_USER', 'root')
    pwd  = os.getenv('DB_PASSWORD', '')
    name = os.getenv('DB_NAME', 'menumatrix')

    # Auto-create MySQL database if it doesn't exist
    try:
        import pymysql
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=pwd
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {name}")
        cursor.close()
        conn.close()
        print(f"[DB] Ensured MySQL database '{name}' exists.")
    except Exception as e:
        print(f"[DB Warning] Could not check/create MySQL database: {e}")

    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True}
db = SQLAlchemy(app)

# ===== MODELS =====
class Customer(db.Model):
    __tablename__ = 'customers'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(200), nullable=False)
    email      = db.Column(db.String(200), nullable=False)
    phone      = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders     = db.relationship('Order', backref='customer', lazy=True)

class Order(db.Model):
    __tablename__ = 'orders'
    id             = db.Column(db.Integer, primary_key=True)
    order_id       = db.Column(db.String(20), unique=True, nullable=False)
    customer_id    = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    event_type     = db.Column(db.String(50))
    event_date     = db.Column(db.Date)
    event_time     = db.Column(db.String(20))
    venue_name     = db.Column(db.String(300))
    venue_address  = db.Column(db.Text)
    guest_count    = db.Column(db.Integer, default=100)
    food_preference= db.Column(db.String(20))
    special_notes  = db.Column(db.Text)
    menu_items     = db.Column(db.Text)
    package_id     = db.Column(db.String(20))
    per_plate      = db.Column(db.Float, default=0)
    subtotal       = db.Column(db.Float, default=0)
    service_charge = db.Column(db.Float, default=0)
    gst            = db.Column(db.Float, default=0)
    grand_total    = db.Column(db.Float, default=0)
    status         = db.Column(db.String(20), default='pending')
    submission_id  = db.Column(db.String(80), nullable=True)  # idempotency key
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    payments       = db.relationship('Payment', backref='order', lazy=True)

class Payment(db.Model):
    __tablename__  = 'payments'
    id             = db.Column(db.Integer, primary_key=True)
    order_id       = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    payment_type   = db.Column(db.String(20))
    payment_method = db.Column(db.String(20))
    amount_paid    = db.Column(db.Float, default=0)
    balance_due    = db.Column(db.Float, default=0)
    transaction_id = db.Column(db.String(50))
    paid_at        = db.Column(db.DateTime, default=datetime.utcnow)

class AdminMessage(db.Model):
    __tablename__  = 'admin_messages'
    id             = db.Column(db.Integer, primary_key=True)
    order_id       = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    message        = db.Column(db.Text, nullable=False)
    sent_by        = db.Column(db.String(200), default='admin')  # 'admin' or customer email
    sent_at        = db.Column(db.DateTime, default=datetime.utcnow)
    read           = db.Column(db.Boolean, default=False)

class EmailLog(db.Model):
    __tablename__ = 'email_logs'
    id          = db.Column(db.Integer, primary_key=True)
    order_id    = db.Column(db.String(20), nullable=True)
    recipient   = db.Column(db.String(200), nullable=False)
    subject     = db.Column(db.String(200), nullable=False)
    body        = db.Column(db.Text, nullable=False)
    sent_at     = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(200), nullable=False)
    email         = db.Column(db.String(200), unique=True, nullable=False)
    phone         = db.Column(db.String(20))
    password_hash = db.Column(db.String(200), nullable=False)
    auth_token    = db.Column(db.String(100))
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

# ===== HELPERS =====
ADMIN_EMAIL = 'ashwathnpoojary2006u@gmail.com'

def gen_order_id():
    """Generate unique order ID, retry on collision."""
    for _ in range(10):
        oid = f"MM-{random.randint(100000, 999999)}"
        if not Order.query.filter_by(order_id=oid).first():
            return oid
    return f"MM-{random.randint(1000000, 9999999)}"

def hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

def gen_token():
    return secrets.token_hex(32)

def safe_hour(event_time):
    try:
        if not event_time:
            return -1
        t = str(event_time).strip().upper()
        if 'AM' in t or 'PM' in t:
            from datetime import datetime as dt
            for fmt in ('%I:%M %p', '%I %p', '%I:%M%p', '%I%p'):
                try:
                    return dt.strptime(t, fmt).hour
                except Exception:
                    continue
            return -1
        return int(t.split(':')[0])
    except Exception:
        return -1

def is_lunch(event_time):
    h = safe_hour(event_time)
    return 0 <= h < 16

def order_to_dict(o):
    try:
        items = json.loads(o.menu_items) if o.menu_items else []
    except Exception:
        items = []
    amount_paid = sum(float(p.amount_paid or 0) for p in (o.payments or []))
    balance_due = float(o.grand_total or 0) - amount_paid
    grand = float(o.grand_total or 0)

    # Determine payment status label
    if o.status != 'confirmed' or amount_paid == 0:
        payment_status = 'unpaid'
    elif balance_due <= 0:
        payment_status = 'full'
    else:
        payment_status = '50%'

    # Get the payment type from the most recent payment
    last_payment_type = ''
    if o.payments:
        last_pay = sorted(o.payments, key=lambda p: p.paid_at or datetime.min)[-1]
        last_payment_type = last_pay.payment_type or ''

    # Count messages
    msgs = AdminMessage.query.filter_by(order_id=o.id).order_by(AdminMessage.sent_at.asc()).all()
    messages_list = [{
        'id': m.id,
        'message': m.message,
        'sent_by': m.sent_by,
        'sent_at': m.sent_at.isoformat() if m.sent_at else None,
        'read': m.read,
    } for m in msgs]

    return {
        'id':              o.id,
        'order_id':        o.order_id,
        'customer_id':     o.customer_id,
        'event_type':      o.event_type or '',
        'event_date':      str(o.event_date) if o.event_date else None,
        'event_time':      o.event_time or '',
        'venue_name':      o.venue_name or '',
        'venue_address':   o.venue_address or '',
        'guest_count':     o.guest_count or 0,
        'food_preference': o.food_preference or '',
        'special_notes':   o.special_notes or '',
        'menu_items':      items,
        'package_id':      o.package_id,
        'per_plate':       float(o.per_plate or 0),
        'subtotal':        float(o.subtotal or 0),
        'service_charge':  float(o.service_charge or 0),
        'gst':             float(o.gst or 0),
        'grand_total':     grand,
        'status':          o.status or 'pending',
        'amount_paid':     amount_paid,
        'balance_due':     max(0, balance_due),
        'payment_status':  payment_status,
        'payment_type':    last_payment_type,
        'message_count':   len(messages_list),
        'messages':        messages_list,
        'created_at':      o.created_at.isoformat() if o.created_at else None,
        'customer_name':   o.customer.name  if o.customer else '',
        'customer_email':  o.customer.email if o.customer else '',
        'customer_phone':  o.customer.phone if o.customer else '',
    }

def user_to_dict(u):
    return {
        'id':       u.id,
        'name':     u.name,
        'email':    u.email,
        'phone':    u.phone or '',
        'is_admin': u.email.lower() == ADMIN_EMAIL.lower(),
    }

def try_email(fn, *args):
    """Run email function — never crash the calling request."""
    try:
        fn(*args)
    except Exception as e:
        print(f"[EMAIL ERROR] {fn.__name__}: {e}")
        traceback.print_exc()

def try_excel():
    """Update master excel — never crash the calling request."""
    try:
        from services.excel_service import update_master_excel
        update_master_excel()
    except Exception as e:
        print(f"[EXCEL ERROR] {e}")

# ===== GLOBAL ERROR HANDLER =====
@app.errorhandler(Exception)
def handle_exception(e):
    traceback.print_exc()
    return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

# ===== AUTH ROUTES =====
@app.route('/api/auth/register', methods=['POST'])
def register():
    d     = request.json or {}
    name  = (d.get('name') or '').strip()
    email = (d.get('email') or '').strip().lower()
    phone = (d.get('phone') or '').strip()
    pwd   = d.get('password') or ''

    if not name or not email or not pwd:
        return jsonify({'success': False, 'error': 'Name, email and password are required'}), 400
    if '@' not in email:
        return jsonify({'success': False, 'error': 'Please enter a valid email address'}), 400
    if len(pwd) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'An account with this email already exists'}), 409

    token = gen_token()
    user  = User(name=name, email=email, phone=phone,
                 password_hash=hash_password(pwd), auth_token=token)
    db.session.add(user)
    db.session.commit()
    print(f"[AUTH] New user registered: {email}")
    return jsonify({'success': True, 'token': token, 'user': user_to_dict(user)}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    d     = request.json or {}
    email = (d.get('email') or '').strip().lower()
    pwd   = d.get('password') or ''

    if not email or not pwd:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"[AUTH] Login failed — no user found for: {email}")
        return jsonify({'success': False, 'error': 'No account found with this email'}), 401
    if user.password_hash != hash_password(pwd):
        print(f"[AUTH] Login failed — wrong password for: {email}")
        return jsonify({'success': False, 'error': 'Incorrect password'}), 401

    token = gen_token()
    user.auth_token = token
    db.session.commit()
    print(f"[AUTH] Login success: {email}")
    return jsonify({'success': True, 'token': token, 'user': user_to_dict(user)})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    token = (request.headers.get('Authorization') or '').replace('Bearer ', '').strip()
    if not token:
        return jsonify({'authenticated': False}), 401
    user = User.query.filter_by(auth_token=token).first()
    if not user:
        return jsonify({'authenticated': False}), 401
    return jsonify({'authenticated': True, 'user': user_to_dict(user)})

# ===== ORDER ROUTES =====
@app.route('/api/orders', methods=['POST'])
def create_order():
    d = request.json or {}

    # ── DEDUP: Idempotency key — return existing order if same submission_id ──
    sub_id = (d.get('submission_id') or '').strip()
    if sub_id:
        existing = Order.query.filter_by(submission_id=sub_id).first()
        if existing:
            print(f"[ORDER] Dedup hit — returning existing {existing.order_id} for submission_id={sub_id}")
            return jsonify({'success': True, 'order': order_to_dict(existing)}), 201

    # ── DEDUP: Time-based fallback — same customer, same total, within 60s ──
    email = (d.get('email') or '').strip().lower() or 'guest@menumatrix.com'
    cust  = Customer.query.filter_by(email=email).first()

    if cust:
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(seconds=60)
        try:
            per_plate_check = float(d.get('per_plate') or 0)
            guests_check    = int(d.get('guest_count') or 100)
        except (TypeError, ValueError):
            per_plate_check = 0
            guests_check    = 100
        recent_dup = Order.query.filter(
            Order.customer_id == cust.id,
            Order.guest_count == guests_check,
            Order.per_plate   == per_plate_check,
            Order.created_at  >= cutoff
        ).order_by(Order.created_at.desc()).first()
        if recent_dup:
            print(f"[ORDER] Time-based dedup — returning existing {recent_dup.order_id} for {email}")
            return jsonify({'success': True, 'order': order_to_dict(recent_dup)}), 201

    # Customer — find or create
    if not cust:
        cust = Customer(
            name  = (d.get('name') or 'Guest').strip(),
            email = email,
            phone = (d.get('phone') or '').strip()
        )
        db.session.add(cust)
        try:
            db.session.flush()  # get cust.id without committing yet
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': 'Failed to create customer record'}), 500

    # Pricing — safe conversions
    try:
        per_plate = float(d.get('per_plate') or 0)
    except (TypeError, ValueError):
        per_plate = 0.0
    try:
        guests = int(d.get('guest_count') or 100)
    except (TypeError, ValueError):
        guests = 100

    subtotal = per_plate * guests
    service  = round(subtotal * 0.05)
    gst      = round(subtotal * 0.18)
    grand    = subtotal + service + gst

    # Event date — safe parse
    evt_date = None
    try:
        raw = (d.get('event_date') or '').strip()
        if raw:
            evt_date = date.fromisoformat(raw[:10])  # only take YYYY-MM-DD part
    except Exception:
        pass

    # Capacity check for auto-approve
    evt_time   = (d.get('event_time') or '').strip()
    lunch_slot = is_lunch(evt_time)
    capacity   = 0
    if evt_date:
        existing = Order.query.filter_by(event_date=evt_date).filter(
            Order.status.in_(['approved', 'confirmed'])
        ).all()
        for eo in existing:
            if is_lunch(eo.event_time or '') == lunch_slot:
                capacity += int(eo.guest_count or 0)

    if guests < 3000:
        # Under 3000 guests → auto-approve immediately
        auto_status = 'approved'
    else:
        # 3000 or more guests → require manual admin approval (pending)
        auto_status = 'pending'

    # Menu items — safe JSON
    try:
        menu_json = json.dumps(d.get('menu_items') or [])
    except Exception:
        menu_json = '[]'

    order = Order(
        order_id       = gen_order_id(),
        customer_id    = cust.id,
        submission_id  = sub_id or None,
        event_type     = (d.get('event_type') or '').strip(),
        event_date     = evt_date,
        event_time     = evt_time,
        venue_name     = (d.get('venue_name') or '').strip(),
        venue_address  = (d.get('venue_address') or '').strip(),
        guest_count    = guests,
        food_preference= (d.get('food_preference') or '').strip(),
        special_notes  = (d.get('special_notes') or '').strip(),
        menu_items     = menu_json,
        package_id     = d.get('package_id'),
        per_plate      = per_plate,
        subtotal       = subtotal,
        service_charge = service,
        gst            = gst,
        grand_total    = grand,
        status         = auto_status,
    )
    db.session.add(order)
    db.session.commit()
    print(f"[ORDER] Created {order.order_id} status={auto_status} for {email}")

    # Emails — never crash the request
    if auto_status == 'approved':
        from services.email_service import send_order_approved
        try_email(send_order_approved, order, cust)
    else:
        # pending — waiting for admin confirmation
        from services.email_service import send_order_submitted
        try_email(send_order_submitted, order, cust)

    try_excel()
    return jsonify({'success': True, 'order': order_to_dict(order)}), 201

@app.route('/api/orders', methods=['GET'])
def list_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([order_to_dict(o) for o in orders])

# ===== IMPORTANT: specific string routes BEFORE <int:oid> =====
@app.route('/api/orders/excel', methods=['GET'])
def export_excel():
    date_str = request.args.get('date')
    if date_str:
        try:
            fd     = date.fromisoformat(date_str)
            orders = Order.query.filter(Order.event_date == fd).order_by(Order.created_at.desc()).all()
        except Exception:
            orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.order_by(Order.created_at.desc()).all()
    from services.excel_service import generate_orders_excel
    path = generate_orders_excel(orders, date_str)
    return send_file(path, as_attachment=True, download_name=f"MenuMatrix_Orders_{date_str or 'all'}.xlsx")

@app.route('/api/orders/daily-count', methods=['GET'])
def daily_count():
    date_str = request.args.get('date')
    try:
        d = date.fromisoformat(date_str) if date_str else date.today()
    except Exception:
        return jsonify({'error': 'Invalid date'}), 400
    total     = Order.query.filter(Order.event_date == d).count()
    confirmed = Order.query.filter(Order.event_date == d, Order.status == 'confirmed').count()
    pending   = Order.query.filter(Order.event_date == d, Order.status == 'pending').count()
    return jsonify({'date': str(d), 'total_orders': total, 'confirmed': confirmed, 'pending': pending})

@app.route('/api/orders/<int:oid>', methods=['GET'])
def get_order(oid):
    o = Order.query.get_or_404(oid)
    return jsonify(order_to_dict(o))

@app.route('/api/orders/<int:oid>/status', methods=['GET'])
def get_order_status(oid):
    o = Order.query.get_or_404(oid)
    return jsonify({'status': o.status, 'order_id': o.order_id, 'grand_total': float(o.grand_total or 0)})

@app.route('/api/orders/<int:oid>/approve', methods=['PATCH'])
def approve_order(oid):
    o = Order.query.get_or_404(oid)
    o.status = 'approved'
    db.session.commit()
    from services.email_service import send_order_approved
    try_email(send_order_approved, o, o.customer)
    try_excel()
    return jsonify({'success': True, 'status': o.status})

@app.route('/api/orders/<int:oid>/reject', methods=['PATCH'])
def reject_order(oid):
    o = Order.query.get_or_404(oid)
    o.status = 'rejected'
    db.session.commit()
    from services.email_service import send_order_rejected
    try_email(send_order_rejected, o, o.customer)
    try_excel()
    return jsonify({'success': True, 'status': o.status})

@app.route('/api/orders/<int:oid>/update', methods=['POST'])
def update_order_email(oid):
    o   = Order.query.get_or_404(oid)
    msg = (request.json or {}).get('message', '').strip()
    if not msg:
        return jsonify({'error': 'Message is required'}), 400
    from services.email_service import send_order_update
    try_email(send_order_update, o, o.customer, f"Update on Order #{o.order_id}", msg)
    return jsonify({'success': True})

@app.route('/api/orders/<int:oid>/messages', methods=['GET'])
def get_order_messages(oid):
    """Get all admin messages for an order."""
    Order.query.get_or_404(oid)
    msgs = AdminMessage.query.filter_by(order_id=oid).order_by(AdminMessage.sent_at.asc()).all()
    return jsonify([{
        'id': m.id,
        'message': m.message,
        'sent_by': m.sent_by,
        'sent_at': m.sent_at.isoformat() if m.sent_at else None,
        'read': m.read,
    } for m in msgs])

@app.route('/api/orders/<int:oid>/messages', methods=['POST'])
def send_order_message(oid):
    """Admin sends a direct message to a customer for a specific order."""
    o   = Order.query.get_or_404(oid)
    d   = request.json or {}
    msg = (d.get('message') or '').strip()
    if not msg:
        return jsonify({'error': 'Message is required'}), 400

    admin_msg = AdminMessage(
        order_id = o.id,
        message  = msg,
        sent_by  = 'admin',
    )
    db.session.add(admin_msg)
    db.session.commit()
    print(f"[MSG] Admin message sent for order {o.order_id}: {msg[:60]}...")

    # Also send as email if configured
    from services.email_service import send_order_update
    try_email(send_order_update, o, o.customer, f"Message from MenuMatrix — Order #{o.order_id}", msg)

    return jsonify({
        'success': True,
        'message': {
            'id': admin_msg.id,
            'message': admin_msg.message,
            'sent_by': admin_msg.sent_by,
            'sent_at': admin_msg.sent_at.isoformat() if admin_msg.sent_at else None,
        }
    }), 201

@app.route('/api/orders/<int:oid>/invoice', methods=['GET'])
def download_invoice(oid):
    o = Order.query.get_or_404(oid)
    from services.pdf_service import generate_invoice_pdf
    path = generate_invoice_pdf(o)
    return send_file(path, as_attachment=True, download_name=f"MenuMatrix_Invoice_{o.order_id}.pdf")

@app.route('/api/orders/<int:oid>/menu-pdf', methods=['GET'])
def download_menu(oid):
    o = Order.query.get_or_404(oid)
    from services.pdf_service import generate_menu_pdf
    path = generate_menu_pdf(o)
    return send_file(path, as_attachment=True, download_name=f"MenuMatrix_Menu_{o.order_id}.pdf")

# ===== CAPACITY =====
@app.route('/api/capacity', methods=['GET'])
def get_capacity():
    orders       = Order.query.filter(Order.status.in_(['approved', 'confirmed'])).all()
    capacity_map = {}
    for o in orders:
        if not o.event_date:
            continue
        key = str(o.event_date)
        if key not in capacity_map:
            capacity_map[key] = {'lunch': 0, 'dinner': 0}
        slot = 'lunch' if is_lunch(o.event_time or '') else 'dinner'
        capacity_map[key][slot] += int(o.guest_count or 0)
    return jsonify(capacity_map)

# ===== PAYMENTS =====
@app.route('/api/payments', methods=['POST'])
def create_payment():
    d   = request.json or {}
    oid = d.get('order_id')
    if not oid:
        return jsonify({'error': 'order_id required'}), 400
    o = Order.query.get_or_404(int(oid))

    # Guard: reject duplicate payment on already-confirmed orders
    if o.status == 'confirmed':
        existing_paid = sum(float(p.amount_paid or 0) for p in (o.payments or []))
        existing_bal  = max(0, float(o.grand_total or 0) - existing_paid)
        return jsonify({
            'success': True,
            'transaction_id': (o.payments[-1].transaction_id if o.payments else 'N/A'),
            'amount_paid': existing_paid,
            'balance_due': existing_bal,
            'note': 'Payment already recorded for this order'
        })

    try:
        paid = float(d.get('amount_paid') or 0)
    except (TypeError, ValueError):
        paid = 0.0

    # Calculate balance considering ALL prior payments for this order
    previously_paid = sum(float(p.amount_paid or 0) for p in (o.payments or []))
    total_paid      = previously_paid + paid
    balance         = max(0, float(o.grand_total or 0) - total_paid)
    txn             = f"TXN{random.randint(1000000, 9999999)}"

    pay = Payment(
        order_id       = o.id,
        payment_type   = (d.get('payment_type') or 'advance').strip(),
        payment_method = (d.get('payment_method') or 'upi').strip(),
        amount_paid    = paid,
        balance_due    = balance,
        transaction_id = txn,
    )
    o.status = 'confirmed'
    db.session.add(pay)
    db.session.commit()
    print(f"[PAYMENT] Order {o.order_id} confirmed. ThisPayment=Rs.{paid} TotalPaid=Rs.{total_paid} Balance=Rs.{balance} TXN={txn}")

    from services.email_service import send_payment_received
    try_email(send_payment_received, o, o.customer, pay)
    try_excel()
    return jsonify({'success': True, 'transaction_id': txn, 'amount_paid': total_paid, 'balance_due': balance})

# ===== MY ORDERS =====
@app.route('/api/my-orders', methods=['GET'])
def my_orders():
    token = (request.headers.get('Authorization') or '').replace('Bearer ', '').strip()
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    user = User.query.filter_by(auth_token=token).first()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    cust = Customer.query.filter_by(email=user.email).first()
    if not cust:
        return jsonify([])
    orders = Order.query.filter_by(customer_id=cust.id).order_by(Order.created_at.desc()).all()
    return jsonify([order_to_dict(o) for o in orders])

# ===== STATIC FILE SERVING =====
@app.route('/')
def index():
    return send_from_directory('../', 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    try:
        return send_from_directory('../', path)
    except Exception:
        return send_from_directory('../', 'index.html')

# ===== INIT DB =====
with app.app_context():
    db.create_all()
    print("[DB] Database ready.")

if __name__ == '__main__':
    print("[SERVER] Starting MenuMatrix on http://127.0.0.1:5000")
    app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False)
