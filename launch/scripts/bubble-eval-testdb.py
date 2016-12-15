
import os, pymongo, sys, datetime, csv
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from collections import Counter


if __name__ == "__main__":
	# open remote database
	client 	= pymongo.MongoClient('54.69.103.85', 27017)
	db 		= client.bubblestudy
	allLogs 	= db.logs.find({})

	localClient = pymongo.MongoClient('localhost', 27017)
	localDb 	= localClient.bubblestudy
	print 'Start copying records'
	i=0
	for log in allLogs:
		i+=1
		print i
		localDb.logs.insert(log)

	print 'Done.'