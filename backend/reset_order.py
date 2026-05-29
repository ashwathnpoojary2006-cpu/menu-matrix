import sqlite3
conn = sqlite3.connect('menumatrix.db')
c = conn.cursor()
c.execute("UPDATE orders SET status='pending' WHERE id=7")
conn.commit()
print('Reset order 7 to pending')
conn.close()
