import sqlite3 as lite
import urllib2
import sys
import json
import time
import os

def appendRows(tracks, rows):
	for song in tracks:
		newRow = (song["name"], song["artist"]["#text"], song["album"]["#text"], song["date"]["#text"], song["date"]["uts"])
		rows.append(newRow)
	return rows

def queryUrl(config):
	url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=%s&page=%d&user=%s&to=%d&api_key=%s&format=json" %  (config["limit"], config["page"], config["username"], config["startTime"], config["apiKey"])
	print url

	# send request to API
	response = urllib2.urlopen(url)
	data = json.loads(response.read())
	return data

def insertRows(rows, con, rowNum):
	with con:
		cur = con.cursor()
		cur.executemany("INSERT INTO Tracks VALUES(?, ?, ?, ?, ?)", rows)
		print "Inserted rows %d-%d beginning with row %s" % (rowNum, rowNum + len(rows) - 1, json.dumps(rows[0]))
	rowNum = rowNum + len(rows)
	return rowNum

os.system("createscript.py")

# configuration
config = {
	"startTime": int(time.time()) - 5, #data collection window from beginning of user history to 5 minutes ago
	"username": "yellowJumpsuit",
	"apiKey": "2be05c4b50dd8b0b315ca2181feb7b35",
	"page": 1,
	"limit": 200,
}

data = queryUrl(config)
numPages = int(data["recenttracks"]["@attr"]["totalPages"])
tracks = data["recenttracks"]["track"]

# parse data to list of tuples
rows = []
rowNum = 1

# special case: first page of results, which may include currently playing track
# throw out currently playing track, if there is one
if "@attr" in tracks[0] and tracks[0]["@attr"]["nowplaying"] == "true":
	tracks = tracks[1:]

# open connection
con = lite.connect("lastfm.db")

# append first page of song results
appendRows(tracks, rows)
rowNum = insertRows(rows, con, rowNum)

for pageNum in xrange(2, numPages + 1):
	rows = []
	config["page"] = pageNum
	data = queryUrl(config)
	tracks = data["recenttracks"]["track"]
	appendRows(tracks, rows)
	rowNum = insertRows(rows, con, rowNum)
