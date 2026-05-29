from backend.app import app, db

def recreate():
    with app.app_context():
        print("Recreating database schema...")
        db.drop_all()
        db.create_all()
        print("Database schema successfully recreated with all new columns!")

if __name__ == '__main__':
    recreate()
