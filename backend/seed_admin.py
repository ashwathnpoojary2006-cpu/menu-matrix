from app import app, db, User, hash_password, gen_token

with app.app_context():
    email = 'ashwathnpoojary2006u@gmail.com'
    password = 'nigga123'
    
    user = User.query.filter_by(email=email).first()
    if user:
        user.password_hash = hash_password(password)
        print("Admin user updated.")
    else:
        user = User(
            name='Admin Ashwath',
            email=email,
            phone='',
            password_hash=hash_password(password),
            auth_token=gen_token()
        )
        db.session.add(user)
        print("Admin user created.")
    
    db.session.commit()
