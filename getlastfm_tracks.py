import sqlite3 as lite
import urllib2
import sys
import json

# configuration
username = "yellowJumpsuit"
apiKey = "2be05c4b50dd8b0b315ca2181feb7b35"
page = 1
limit = 200
url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=%s&page=%d&user=%s&api_key=%s&format=json" % (limit, page, username, apiKey)

# send request to API
response = urllib2.urlopen(url)
data = json.loads(response.read())
tracks = data["recenttracks"]["track"]

# parse data to list of tuples
rows = []

# throw out currently playing track, if there is one
tracks = tracks[1:]

for song in tracks:
	newRow = (song["name"], song["artist"]["#text"], song["album"]["#text"], song["date"]["#text"], song["date"]["uts"])
	print newRow
	rows.append(newRow)

con = lite.connect("lastfm.db")

with con:
	cur = con.cursor()
	cur.execute("DROP TABLE IF EXISTS Tracks")
	cur.execute("CREATE TABLE Tracks(Title TEXT, Artist TEXT, Album TEXT, Date_text TEXT, Date_uts TEXT)")
	cur.executemany("INSERT INTO Tracks VALUES(?, ?, ?, ?, ?)", rows)

	# retrieve data
	'''
	cur.execute("SELECT * FROM Tracks")
	rows = cur.fetchall()
	for row in rows:
		print row
	'''