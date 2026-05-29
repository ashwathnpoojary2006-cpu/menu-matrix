import os, json
from fpdf import FPDF
from datetime import datetime

PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'pdfs')
os.makedirs(PDF_DIR, exist_ok=True)

class MenuMatrixPDF(FPDF):
    def header(self):
        self.set_fill_color(124, 58, 237)
        self.rect(0, 0, 210, 40, 'F')
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 22)
        self.set_y(10)
        self.cell(0, 10, 'MenuMatrix', align='C', new_x="LMARGIN", new_y="NEXT")
        self.set_font('Helvetica', '', 10)
        self.cell(0, 6, 'Premium Catering Service', align='C', new_x="LMARGIN", new_y="NEXT")
        self.set_y(45)
        self.set_text_color(26, 16, 40)

    def footer(self):
        self.set_y(-20)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 136, 168)
        self.cell(0, 10, f'MenuMatrix | Page {self.page_no()}', align='C', new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 5, 'www.menumatrix.com | hello@menumatrix.com | +91 98765 43210', align='C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(124, 58, 237)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(124, 58, 237)
        self.line(self.l_margin, self.get_y(), 200 - self.r_margin, self.get_y())
        self.ln(4)
        self.set_text_color(26, 16, 40)

    def info_row(self, label, value):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(150, 136, 168)
        self.cell(60, 7, label)
        self.set_text_color(26, 16, 40)
        self.set_font('Helvetica', 'B', 10)
        self.cell(0, 7, str(value), new_x="LMARGIN", new_y="NEXT")

    def price_row(self, label, value, bold=False):
        self.set_font('Helvetica', 'B' if bold else '', 10)
        self.set_text_color(92, 79, 114)
        self.cell(120, 7, label)
        self.set_text_color(124, 58, 237) if bold else self.set_text_color(26, 16, 40)
        self.set_font('Helvetica', 'B', 12 if bold else 10)
        self.cell(0, 7, f"Rs. {value:,.0f}", align='R', new_x="LMARGIN", new_y="NEXT")

def generate_invoice_pdf(order):
    pdf = MenuMatrixPDF()
    pdf.add_page()
    items = json.loads(order.menu_items) if order.menu_items else []

    # Invoice header
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 12, 'INVOICE', align='R', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(150, 136, 168)
    pdf.cell(0, 6, f'Order: {order.order_id}', align='R', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f'Date: {datetime.now().strftime("%d %b %Y")}', align='R', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Customer info
    pdf.section_title('Customer Details')
    c = order.customer
    if c:
        pdf.info_row('Name', c.name)
        pdf.info_row('Email', c.email)
        if c.phone: pdf.info_row('Phone', c.phone)
    pdf.ln(4)

    # Event info
    pdf.section_title('Event Details')
    pdf.info_row('Event Type', order.event_type or '-')
    pdf.info_row('Date', str(order.event_date) if order.event_date else '-')
    pdf.info_row('Time', order.event_time or '-')
    pdf.info_row('Venue', order.venue_name or '-')
    pdf.info_row('Guests', str(order.guest_count))
    pdf.info_row('Food Preference', order.food_preference or '-')
    pdf.ln(4)

    # Menu items table
    pdf.section_title('Menu Items')
    pdf.set_fill_color(250, 248, 255)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(124, 58, 237)
    pdf.cell(10, 8, '#', border=1, fill=True)
    pdf.cell(80, 8, 'Item', border=1, fill=True)
    pdf.cell(30, 8, 'Category', border=1, fill=True)
    pdf.cell(20, 8, 'Qty', border=1, align='C', fill=True)
    pdf.cell(30, 8, 'Price', border=1, align='R', fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(26, 16, 40)
    for i, item in enumerate(items, 1):
        qty = item.get('qty', 1)
        pdf.cell(10, 7, str(i), border=1)
        pdf.cell(80, 7, item.get('name', ''), border=1)
        pdf.cell(30, 7, item.get('category', '').title(), border=1)
        pdf.cell(20, 7, str(qty), border=1, align='C')
        pdf.cell(30, 7, f"Rs. {item.get('price',0)*qty:,}", border=1, align='R', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Pricing
    pdf.section_title('Price Breakdown')
    pdf.price_row('Per Plate Cost', order.per_plate)
    pdf.price_row(f'Number of Guests', order.guest_count)
    pdf.price_row('Subtotal', order.subtotal)
    pdf.price_row('Service Charge (5%)', order.service_charge)
    pdf.price_row('GST (18%)', order.gst)
    pdf.set_draw_color(124, 58, 237)
    pdf.line(pdf.l_margin, pdf.get_y()+2, 200-pdf.r_margin, pdf.get_y()+2)
    pdf.ln(4)
    pdf.price_row('GRAND TOTAL', order.grand_total, bold=True)

    # Payment info
    if order.payments:
        pay = order.payments[-1]
        pdf.ln(4)
        pdf.section_title('Payment Details')
        pdf.info_row('Transaction ID', pay.transaction_id)
        pdf.info_row('Payment Type', pay.payment_type.title() if pay.payment_type else '-')
        pdf.info_row('Method', pay.payment_method.upper() if pay.payment_method else '-')
        pdf.info_row('Amount Paid', f"Rs. {pay.amount_paid:,.0f}")
        if pay.balance_due > 0:
            pdf.info_row('Balance Due', f"Rs. {pay.balance_due:,.0f}")

    # Status badge
    pdf.ln(6)
    status_colors = {'pending': (245,158,11), 'approved': (16,185,129), 'rejected': (239,68,68), 'confirmed': (16,185,129)}
    color = status_colors.get(order.status, (124,58,237))
    pdf.set_fill_color(*color)
    pdf.set_text_color(255,255,255)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(60, 10, f'  Status: {order.status.upper()}', fill=True, align='L')

    path = os.path.join(PDF_DIR, f"invoice_{order.order_id}.pdf")
    pdf.output(path)
    return path

def generate_menu_pdf(order):
    pdf = MenuMatrixPDF()
    pdf.add_page()
    items = json.loads(order.menu_items) if order.menu_items else []

    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(26, 16, 40)
    pdf.cell(0, 12, f'Menu Card - {order.event_type}', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(150, 136, 168)
    pdf.cell(0, 7, f'{order.venue_name or ""} | {order.event_date or ""} | {order.guest_count} Guests', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Group by category
    cats = {}
    for item in items:
        cat = item.get('category', 'other')
        cats.setdefault(cat, []).append(item)

    cat_names = {'starters':'Starters','maincourse':'Main Course','breads':'Breads','rice':'Rice & Biryani','desserts':'Desserts','beverages':'Beverages'}

    for cat_id, cat_items in cats.items():
        pdf.set_font('Helvetica', 'B', 12)
        pdf.set_text_color(124, 58, 237)
        pdf.set_fill_color(250, 248, 255)
        pdf.cell(0, 9, f'  {cat_names.get(cat_id, cat_id.title())}', fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        for item in cat_items:
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(26, 16, 40)
            pdf.cell(8, 7, '-')  # bullet
            pdf.cell(110, 7, item.get('name', ''))
            pdf.set_text_color(217, 119, 6)
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(0, 7, f"Rs. {item.get('price',0)}", align='R', new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

    # Total
    pdf.ln(4)
    pdf.set_draw_color(124, 58, 237)
    pdf.line(pdf.l_margin, pdf.get_y(), 200-pdf.r_margin, pdf.get_y())
    pdf.ln(4)
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(124, 58, 237)
    pdf.cell(0, 10, f'Per Plate: Rs. {order.per_plate:,.0f}', align='C')

    path = os.path.join(PDF_DIR, f"menu_{order.order_id}.pdf")
    pdf.output(path)
    return path
