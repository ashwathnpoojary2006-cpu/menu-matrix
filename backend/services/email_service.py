"""
MenuMatrix Email Service
- Saves email to MySQL database (XAMPP) instead of local files
- Sends real email via SMTP if SEND_REAL_EMAIL=true AND SMTP credentials are set
"""
import os, json, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SEND_REAL   = os.getenv('SEND_REAL_EMAIL', 'false').lower() == 'true'
SMTP_HOST   = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT   = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER   = os.getenv('SMTP_USER', '')
SMTP_PASS   = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM   = os.getenv('SMTP_FROM', 'MenuMatrix <noreply@menumatrix.com>')
OWNER_EMAIL = os.getenv('OWNER_EMAIL', '')


# ===== HTML TEMPLATE =====
def _base(title, body_html):
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'Segoe UI',Arial,sans-serif;background:#f8f5ff;padding:20px}}
.wrap{{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,.12)}}
.hdr{{background:linear-gradient(135deg,#7c3aed,#5b21b6);padding:32px;text-align:center;color:#fff}}
.hdr h1{{font-size:24px;font-weight:800;margin-bottom:4px}}
.hdr p{{font-size:14px;opacity:.85}}
.bod{{padding:32px}}
.bod h2{{color:#1a1028;font-size:18px;margin-bottom:16px}}
.bod p{{color:#5c4f72;font-size:14px;line-height:1.7;margin-bottom:12px}}
.box{{background:#faf8ff;border:1px solid rgba(124,58,237,.12);border-radius:12px;padding:16px;margin:16px 0}}
.row{{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid rgba(124,58,237,.06)}}
.row:last-child{{border-bottom:none}}
.row .lbl{{color:#9688a8}}
.row .val{{font-weight:600;color:#1a1028;text-align:right;max-width:60%}}
.total{{border-top:2px solid #7c3aed;margin-top:8px;padding-top:10px}}
.total .lbl{{font-weight:700;color:#1a1028}}
.total .val{{color:#7c3aed;font-weight:800;font-size:16px}}
.badge{{display:inline-block;padding:4px 14px;border-radius:50px;font-size:12px;font-weight:700;margin-left:8px}}
.pending{{background:#fef3c7;color:#92400e}}
.approved{{background:#d1fae5;color:#065f46}}
.rejected{{background:#fee2e2;color:#991b1b}}
.confirmed{{background:#d1fae5;color:#065f46}}
.btn{{display:inline-block;margin:16px 0;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;border-radius:50px;font-weight:600;font-size:14px}}
.ftr{{background:#1a1028;padding:20px;text-align:center;color:rgba(255,255,255,.4);font-size:12px}}
.ftr a{{color:#fbbf24;text-decoration:none}}
</style></head><body>
<div class="wrap">
<div class="hdr"><h1>MenuMatrix</h1><p>{title}</p></div>
<div class="bod">{body_html}</div>
<div class="ftr"><p>&copy; 2026 MenuMatrix &mdash; Premium Catering</p></div>
</div></body></html>"""


def _row(label, value):
    return f'<div class="row"><span class="lbl">{label}</span><span class="val">{value}</span></div>'


def _event_box(o):
    rows = _row('Event', o.event_type or '—')
    rows += _row('Date', str(o.event_date) if o.event_date else '—')
    rows += _row('Time', o.event_time or '—')
    rows += _row('Venue', o.venue_name or '—')
    rows += _row('Guests', f"{o.guest_count:,}" if o.guest_count else '—')
    rows += _row('Food Preference', o.food_preference or '—')
    return f'<div class="box">{rows}</div>'


def _price_box(o):
    rows  = _row('Per Plate', f"₹{float(o.per_plate or 0):,.0f}")
    rows += _row('Subtotal', f"₹{float(o.subtotal or 0):,.0f}")
    rows += _row('Service Charge (5%)', f"₹{float(o.service_charge or 0):,.0f}")
    rows += _row('GST (18%)', f"₹{float(o.gst or 0):,.0f}")
    # Grand total row with highlighted styling — built directly, no fragile slicing
    rows += (f'<div class="row" style="border-top:2px solid #7c3aed;margin-top:6px;padding-top:8px;">'
             f'<span class="lbl" style="font-weight:700;color:#1a1028">Grand Total</span>'
             f'<span class="val" style="color:#7c3aed;font-weight:800;font-size:16px">'
             f'₹{float(o.grand_total or 0):,.0f}</span></div>')
    return f'<div class="box">{rows}</div>'


def _menu_box(o):
    try:
        items = json.loads(o.menu_items) if o.menu_items else []
    except Exception:
        items = []
    if not items:
        return ''
    rows = ''
    for item in items:
        try:
            price = float(item.get('price') or 0)
            qty   = int(item.get('qty') or 1)
            name  = str(item.get('name') or 'Item')
            rows += _row(f"{name}{' x'+str(qty) if qty > 1 else ''}", f"₹{price * qty:,.0f}")
        except Exception:
            continue
    return f'<div class="box">{rows}</div>' if rows else ''


def _save_email(to, subject, html, order):
    """Save email to MySQL database instead of local file."""
    try:
        from app import db, EmailLog
        oid = order.order_id if order else None
        log = EmailLog(
            recipient=to,
            subject=subject,
            body=html,
            order_id=oid,
            sent_at=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        print(f"[EMAIL] Saved to DB → recipient: {to}, subject: {subject}")
    except Exception as e:
        print(f"[EMAIL] DB Save failed: {e}")


def _send_smtp(to, subject, html):
    """Send real SMTP email. Only called if SEND_REAL=true and credentials exist."""
    if not SEND_REAL or not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL] SMTP skipped (SEND_REAL_EMAIL=false or no credentials). Would send to: {to}")
        return
    try:
        msg            = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = SMTP_FROM
        msg['To']      = to
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.ehlo()
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, [to], msg.as_string())
        print(f"[EMAIL] Sent to {to}: {subject}")
    except smtplib.SMTPAuthenticationError:
        print(f"[EMAIL] AUTH FAILED — check SMTP_USER and SMTP_PASSWORD in .env")
    except smtplib.SMTPException as e:
        print(f"[EMAIL] SMTP error: {e}")
    except Exception as e:
        print(f"[EMAIL] Send error: {e}")


def _send(to, subject, html, order=None):
    """Core send function — save to DB always, send via SMTP if configured."""
    _save_email(to, subject, html, order)
    _send_smtp(to, subject, html)
    if OWNER_EMAIL and to != OWNER_EMAIL:
        # Also send a copy to owner for customer emails
        pass  # owner gets their own separate call where needed


# ===== PUBLIC EMAIL FUNCTIONS =====

def send_order_submitted(order, customer):
    """Sent to customer when order is pending review."""
    body = f"""
<h2>Order Received! <span class="badge pending">Pending Review</span></h2>
<p>Hi {customer.name},</p>
<p>Your catering order <strong>#{order.order_id}</strong> has been received. Our team will review your request and confirm availability within 1–2 hours.</p>
<h3 style="margin:20px 0 8px;color:#1a1028">Event Details</h3>
{_event_box(order)}
<h3 style="margin:20px 0 8px;color:#1a1028">Menu Selected</h3>
{_menu_box(order)}
<h3 style="margin:20px 0 8px;color:#1a1028">Pricing</h3>
{_price_box(order)}
<p>We'll send you an email once your order is approved.</p>"""

    _send(customer.email, f"Order #{order.order_id} Received — MenuMatrix",
          _base("Order Received", body), order)

    # Notify owner
    if OWNER_EMAIL:
        owner_body = f"""
<h2>New Order — Action Required</h2>
<p>Order <strong>#{order.order_id}</strong> from <strong>{customer.name}</strong> ({customer.email})</p>
{_event_box(order)}{_menu_box(order)}{_price_box(order)}
<p>Please log in to the admin panel to approve or reject this order.</p>"""
        _send(OWNER_EMAIL, f"[Admin] New Order #{order.order_id} — Review Required",
              _base("New Order Alert", owner_body), order)


def send_order_approved(order, customer):
    """Sent to customer when order is approved."""
    body = f"""
<h2>Order Approved! <span class="badge approved">Approved</span></h2>
<p>Hi {customer.name},</p>
<p>Great news! Your order <strong>#{order.order_id}</strong> has been approved. We're available for your event date!</p>
{_event_box(order)}
{_price_box(order)}
<p><strong>Next step:</strong> Please complete payment to confirm your booking. You can pay 50% advance now and the balance on event day.</p>
<a href="http://127.0.0.1:5000/payment.html" class="btn">Complete Payment</a>"""

    _send(customer.email, f"Order #{order.order_id} Approved! — MenuMatrix",
          _base("Order Approved", body), order)


def send_order_rejected(order, customer):
    """Sent to customer when order is rejected."""
    body = f"""
<h2>Order Update <span class="badge rejected">Unavailable</span></h2>
<p>Hi {customer.name},</p>
<p>Unfortunately we are fully booked for <strong>{order.event_date}</strong> and cannot fulfil order <strong>#{order.order_id}</strong>.</p>
{_event_box(order)}
<p>We apologize for the inconvenience. Please try a different date or contact us for alternatives.</p>
<a href="http://127.0.0.1:5000/function.html" class="btn">Book Another Date</a>"""

    _send(customer.email, f"Order #{order.order_id} — Date Unavailable",
          _base("Order Update", body), order)


def send_payment_received(order, customer, payment):
    """Sent to customer after payment is recorded."""
    balance_row = _row('Balance Due on Event Day', f"₹{float(payment.balance_due or 0):,.0f}") \
                  if float(payment.balance_due or 0) > 0 else ''
    body = f"""
<h2>Payment Confirmed! <span class="badge confirmed">Booking Confirmed</span></h2>
<p>Hi {customer.name},</p>
<p>Your payment has been received and your booking is now <strong>confirmed</strong>. See you at your event!</p>
<div class="box">
{_row('Order ID', order.order_id)}
{_row('Transaction ID', payment.transaction_id or '—')}
{_row('Payment Method', (payment.payment_method or '').upper())}
{_row('Payment Type', (payment.payment_type or '').title())}
{_row('Amount Paid', f"₹{float(payment.amount_paid or 0):,.0f}")}
{balance_row}
</div>
<h3 style="margin:20px 0 8px;color:#1a1028">Event Details</h3>
{_event_box(order)}
<h3 style="margin:20px 0 8px;color:#1a1028">Menu</h3>
{_menu_box(order)}
<p style="margin-top:16px">Thank you for choosing MenuMatrix. We look forward to serving you!</p>"""

    _send(customer.email, f"Booking Confirmed #{order.order_id} — MenuMatrix",
          _base("Booking Confirmed", body), order)

    if OWNER_EMAIL:
        owner_body = f"""
<h2>Payment Received</h2>
<p>Order <strong>#{order.order_id}</strong> from <strong>{customer.name}</strong> has been paid and confirmed.</p>
<div class="box">
{_row('Amount Paid', f"₹{float(payment.amount_paid or 0):,.0f}")}
{_row('Balance Due', f"₹{float(payment.balance_due or 0):,.0f}")}
{_row('Transaction ID', payment.transaction_id or '—')}
</div>
{_event_box(order)}"""
        _send(OWNER_EMAIL, f"[Admin] Payment Received #{order.order_id}",
              _base("Payment Received", owner_body), order)


def send_order_update(order, customer, subject_line, custom_message):
    """Sent to customer with a custom message from admin."""
    body = f"""
<h2>Update on Order #{order.order_id}</h2>
<p>Hi {customer.name},</p>
<div class="box" style="background:#fff8e1;border-color:#f59e0b">
  <p style="color:#92400e;font-weight:600;margin-bottom:8px">Message from MenuMatrix:</p>
  <p style="color:#78350f;font-size:15px;line-height:1.6">{custom_message}</p>
</div>
{_event_box(order)}
<p>If you have questions, please reply to this email.</p>"""

    _send(customer.email, subject_line, _base("Order Update", body), order)
