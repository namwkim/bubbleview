import os
import pymongo
import sys
import datetime
import csv
import itertools
from itertools import tee, izip
import numpy as np


def pairwise(iterable):
    "s -> (s0,s1), (s1,s2), (s2, s3), ..."
    a, b = tee(iterable)
    next(b, None)
    return izip(a, b)


def getKey(log):
	return log['hit_id'] + '/' + log['assignment_id'] + '/' + log['worker_id']


def splitKey(key):
	splited = key.split("/")
	return {'hit_id': splited[0], 'assignment_id': splited[1], 'worker_id': splited[2]}
if __name__ == "__main__":
	# open log database
	client = pymongo.MongoClient('54.69.103.85', 27017)
	# client 	= pymongo.MongoClient('localhost', 27017)
	db = client.bubblestudy
	cols = db[sys.argv[1]]

	tempHits = {}
	# sort and group by hit id
	sortedLogs = sorted(cols.find({}), key=lambda x: x['hit_id'])
	for k, g in itertools.groupby(sortedLogs, key=lambda x: x['hit_id']):
		tempHits[k] = list(g)

	print "# of HITs: ", len(tempHits.values())

	hits = {}
   	totalMins    = 0.0
	totalWorkers = 0
	for hitID, hitData in tempHits.iteritems():  # loop over hit
		sortedLogs = sorted(hitData, key=lambda x: x['assignment_id'])
		assignments = {}
		# loop over assignment
		for k, g in itertools.groupby(sortedLogs, key=lambda x: x['assignment_id']):
			# print "----------- ", k, "-----------"
			sortedLogs = sorted(list(g), key=lambda x: x['worker_id'])
			workers = {}

			# loop over worker
			for wk, wg in itertools.groupby(sortedLogs, key=lambda x: x['worker_id']):
				sortedLogs = sorted(list(wg), key=lambda x: x['timestamp'])
				survey = filter(lambda x: x['action'] == "survey", sortedLogs)
				start = filter(lambda x: x['action'] == "start-experiment", sortedLogs)
				descs = filter(lambda x: x['action'] == "explain", sortedLogs)
                # print len(survey), len(start), len(descs)
                if len(survey) == 1:
                    start = datetime.datetime.fromtimestamp(int(start[0]['timestamp'])/1000.0)
                    end = datetime.datetime.fromtimestamp(int(survey[0]['timestamp'])/1000.0)
                    # print 'TIME:', (end - start).seconds/60.0
                    workers[wk] = sortedLogs
                    totalMins += (end - start).seconds/60.0
                    totalWorkers+=1
                # else:
                    # print 'STRANGE: more than one survey,', wk
	if len(workers.values())==1:
		assignments[k] = workers.values()[0]
    	print 'AVG.TIME:', totalMins/totalWorkers
