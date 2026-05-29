import os
from backend.app import app, db, Order, Payment, Customer, User

def cleanup():
    with app.app_context():
        print("Cleaning up database...")
        try:
            # Delete all payments
            num_payments = Payment.query.delete()
            # Delete all orders
            num_orders = Order.query.delete()
            db.session.commit()
            print(f"Successfully deleted {num_payments} payments and {num_orders} orders.")
        except Exception as e:
            db.session.rollback()
            print("Error during cleanup:", e)

if __name__ == '__main__':
    cleanup()
