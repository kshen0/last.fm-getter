import sqlite3 as lite
con = lite.connect("lastfm.db")

with con:
  cur = con.cursor()
  cur.execute("DROP TABLE IF EXISTS Tracks")
  cur.execute("CREATE TABLE Tracks(Title TEXT, Artist TEXT, Album TEXT, Date_text TEXT, Date_uts TEXT)")
  print "Table 'Tracks' created"