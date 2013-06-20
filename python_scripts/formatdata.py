# formats data for streamgraph.js

import urllib2
import sqlite3 as lite
import sys
import json

def get_timeslice(counts):
  timeslice = [0] * len(artist_rank)
  for artist in counts:
    index = artist_rank[artist]
    try:
      timeslice[index] = counts[artist]
    except IndexError:
      print "Index %d out of bounds for artist %s" % (index, artist)
  return timeslice

def populate_artist_rank():
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
      name = 'Joe Hisashi'

    artist_rank[name] = rank - 1 
    artists.append(name)


# configuration
config = {
  "username": "yellowJumpsuit",
  "api_key": "2be05c4b50dd8b0b315ca2181feb7b35",
  "limit": 15,
  "period": "overall",
}

artist_rank = {} # maps artist name to popularity with user
artists = []
all_data = []
start_year = 2009
end_year = 2013

populate_artist_rank()

con = lite.connect('lastfm.db')
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
with con:
  cur = con.cursor()

  # loop goes here
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

      all_data.append(get_timeslice(counts))

print all_data
print json.dumps(artists)

