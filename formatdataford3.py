# formats data for streamgraph.js

import urllib2
import sqlite3 as lite
import sys
import json

def update_timeslice(counts, timeslice):
	for artist in all_data:
		artist_name = artist["name"]
		if artist_name in counts:
			artist["values"].append({"x": timeslice, "y": counts[artist["name"]]})
		else:
			artist["values"].append({"x": timeslice, "y": 0})

def init_array():
	url = "http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=%s&limit=%d&period=%s&api_key=%s&format=json" % \
	(config["username"], config["limit"], config["period"], config["api_key"])
	response = urllib2.urlopen(url)
	data = json.loads(response.read())["topartists"]["artist"]

	print url

	for artist in data:
		rank = int(artist["@attr"]["rank"])

		# really terrible fix for Joe Hisaishi's Japanese unicode name
		if rank != 3:
			name = artist["name"]
		else:
			print "joe found"
			name = 'Joe Hisaishi'

		artist_rank[name] = rank
		all_data.append({"name": name, "values": []})





# configuration
config = {
	"username": "yellowJumpsuit",
	"api_key": "2be05c4b50dd8b0b315ca2181feb7b35",
	"limit": 40,
	"period": "overall",
}

artist_rank = {}
all_data = []
start_year = 2009
end_year = 2013

init_array()
print json.dumps(artist_rank)

print json.dumps(all_data)

con = lite.connect('lastfm.db')
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
with con:
	cur = con.cursor()

	timeslice = 0
	for year in xrange(start_year, end_year + 1):
		for month in months:
			counts = {}

			query_string = "SELECT Artist FROM Tracks WHERE Date_text LIKE '%%%s %d%%'" % (month, year)
			cur.execute(query_string)

			results = cur.fetchall()

			for track in results:
				artist = track[0]

				# skip this artist, as s/he is not a top artist
				if not artist in artist_rank:
					continue

				# increment play count
				if artist in counts:
					counts[artist] = counts[artist] + 1
				else:
					counts[artist] = 1

			update_timeslice(counts, timeslice)
			timeslice += 1

			if month == 'Jan' and year == 2013:
				break

# print
all_data.reverse()
print json.dumps(all_data)