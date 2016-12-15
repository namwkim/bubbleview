import os, pymongo, sys, datetime, csv, itertools
from itertools import tee, izip
import numpy as np

def pairwise(iterable):
	"s -> (s0,s1), (s1,s2), (s2, s3), ..."
	a, b = tee(iterable)
	next(b, None)
	return izip(a, b)
def getKey(log):
	return log['hit_id']+'/'+log['assignment_id']+'/'+log['worker_id']
def splitKey(key):
	splited = key.split("/")
	return {'hit_id': splited[0], 'assignment_id':splited[1], 'worker_id':splited[2] }
if __name__ == "__main__":
	# open log database
	client 	= pymongo.MongoClient('54.69.103.85', 27017)
	# client 	= pymongo.MongoClient('localhost', 27017)
	db 		= client.bubblestudy
	fromCol = db[sys.argv[1]]
	toCol 	= db[sys.argv[2]]
	toCol.remove({})

	# filter data

	# 1. create temp database containing filtered data

	tempHits = {}
	# sort and group by hit id
	sortedLogs = sorted(fromCol.find({}), key=lambda x: x['hit_id'])
	for k, g in itertools.groupby(sortedLogs, key=lambda x: x['hit_id']):
		tempHits[k] = list(g)

	print "# of HITs: ", len(tempHits.values())

	print 'filtering bad data...'
	hits = {}


	for hitID, hitData in tempHits.iteritems(): # loop over hit
		sortedLogs = sorted(hitData, key=lambda x: x['assignment_id'])
		print "============== ", hitID, " =============="
		assignments = {}
		for k, g in itertools.groupby(sortedLogs, key=lambda x: x['assignment_id']): # loop over assignment
			# print "----------- ", k, "-----------"
			sortedLogs = sorted(list(g), key=lambda x: x['worker_id'])
			workers = {}

			for wk, wg in itertools.groupby(sortedLogs, key=lambda x: x['worker_id']): # loop over worker
				sortedLogs = sorted(list(wg), key=lambda x: x['timestamp'])
				survey = filter(lambda x: x['action'] == "survey", sortedLogs)
				start  = filter(lambda x: x['action'] == "start-experiment", sortedLogs)
				descs  = filter(lambda x: x['action'] == "explain", sortedLogs)
				if len(survey)==1 and len(start)==1 and len(descs)==4:
					workers[wk] = sortedLogs
				# else:
				# 	print 'filtered: ', wk
			if len(workers.values())==1:
				assignments[k] = workers.values()[0]
			# elif len(workers.values())>1:
			# 	print 'multiple workers participated'
			# else:
			# 	print 'no workers participated'

		if len(assignments.values())==0:
			print 'no assignments found: ', len(workers.values())
		else:
			print '# assignments', len(assignments.keys())
			hits[hitID] = assignments

	print 'constructing refined logs...'
	images = {}
	descMap = {} # to find duplicate description
	CLICK_THRESHOLD = 10
	for hitID, hitData in hits.iteritems():
		for asmtID, asmtData in hitData.iteritems():
			# for workerID, workerData in asmtData.iteritems():
			print asmtID, ' len: ', len(asmtData)

			start  = filter(lambda x: x['action'] == "start-experiment", asmtData)
			descs  = filter(lambda x: x['action'] == "explain" and x['data']['is_practice'] == "false", asmtData)
			# diffs  = filter(lambda x: x['action'] == "desc-change" and x['data']['is_practice'] == "false", asmtData)

			survey = filter(lambda x: x['action'] == "survey", asmtData)
			# print survey
			marks = start + descs
			for s, e in pairwise(marks):
				imageName = e['data']['image'].split("/")[-1].split(".")[0]

				# 1) there should not be duplicate descritions (other option: remove all asmts when duplicate found)
				desc = e['data']['desc']
				if descMap.has_key(desc)==True:
					print "duplicate description found"
					continue
				else:
					descMap[desc]=True

				if images.has_key(imageName)==False:
					images[imageName] = { 'image': imageName, 'logs': [] }


				# filter diffs data based on start and end timestamp
				diffs = filter(lambda x: x['action'] == "desc-change" and x['data']['is_practice'] == "false" \
					and s['timestamp']<= x['timestamp'] and x['timestamp']<e['timestamp'], asmtData)

				clicks = filter(lambda x: x['action'] == "click" and x['data']['is_practice'] == "false"\
					and x['data']['image'] == e['data']['image'], asmtData)

				# 2) too small clicks (how can they describe without revealing images, suspicious!)
				if len(clicks)<=CLICK_THRESHOLD:
					print asmtID, ", ", imageName, " has too small click counts (=", len(clicks), ")"
					continue


				print 'saving... ', imageName, " (diffs, clicks = ", len(diffs), ", ", len(clicks), ")"
				images[imageName]['logs'].append({
						'id': hitID+"/"+asmtID,
						'diffs': diffs,
						'desc': e,
						'clicks': clicks,
						'survey': survey[0]
					})
	totalCount = 0
	filteredCount = 0
	for image, imageData in images.iteritems():
		# 3) outlier removal
		# calc stats
		clickCounts = []
		for log in imageData['logs']:
			clickCounts.append(len(log['clicks']))

		totalCount += len(clickCounts)

		if not clickCounts:
			print "ERROR: clickCounts is empty"
			continue
		median 	= np.median(clickCounts)
		iqr75 	= np.percentile(clickCounts, 75)
		iqr25   = np.percentile(clickCounts, 25)
		iqr 	= iqr75-iqr25;

		filtered = []
		for log in imageData['logs']:
			val = len(log['clicks'])
			if val<(iqr25-3*iqr) or val>(iqr75+3*iqr):
				print log['id'], " is removed as an outlier! (clickCount: ", val, ")"
			else:
				filtered.append(log)
		filteredCount += len(filtered)
		imageData['logs'] = filtered

		print image , "' asmt size: ", len(imageData['logs'])
		print "median click count: ", median, ", iqr range: ", iqr25, " ~ ", iqr75
		# print len(imageData['logs'])
		toCol.insert(imageData)

	print len(images), " images saved."
	print 'filteredCount', filteredCount
	print 'totalCount', totalCount
	print ((totalCount-filteredCount)*1.0/totalCount*100.0), ' percent data points survived'

	# #collect survey data
	# filtered 	= logs.find({'action':'survey'})
	# survey = {}
	# for log in filtered:
	# 	key = getKey(log) #log['hit_id']+'/'+log['assignment_id']
	# 	if survey.has_key(key):
	# 		cnt = logs.find({'action':'start-experiment', 'worker_id':survey[key]['worker_id']}).count()
	# 		if cnt>2:
	# 			print 'A worker participated in multiple hits!? : ' + key  ## ERROR1: Duplicate Participation
	# 	else:
	# 		survey[key] = log;

	# #collect text-description
	# filtered 	= logs.find({'action':'explain', 'data.is_practice':'false'})
	# desc = {}
	# for log in filtered:

	# 	if survey.has_key(getKey(log))==False: # if no survey exists, discard this data
	# 		print 'desc filtered'
	# 		continue
	# 	key = getKey(log) + '/' + log['data']['image']
	# 	if desc.has_key(key):
	# 		print 'Duplicate text description found! : ' + key
	# 		continue
	# 	else:
	# 		desc[key] = log;

	# #print desc

	# # collect text changes
	# changes = logs.find({'action': 'desc-change', 'data.is_practice':'false'});
	# sortedChanges = sorted(changes, key=lambda x: getKey(x));
	# textChanges = {}
	# for k, g in itertools.groupby(sortedChanges, key=lambda x: getKey(x)):
	# 	keys = splitKey(k)
	# 	if survey.has_key(k)==False: # if no survey exists, discard this data
	# 		print 'desc change filtered'
	# 		continue
	# 	times = logs.find({'hit_id':keys['hit_id'], 'assignment_id': keys['assignment_id'], 'worker_id':keys['worker_id'], \
	# 							'$or':[ {'action':'start-experiment'}, {'action': 'explain', 'data.is_practice':'false'}]})
	# 	sortedTimes = sorted(times, key=lambda x: x['timestamp'])
	# 	# print '=========================='
	# 	temp = sorted(list(g), key=lambda x: x['timestamp'])
	# 	print "=======", len(sortedTimes)
	# 	for s, e in pairwise(sortedTimes):
	# 		# print s['timestamp'], ", ", e['timestamp']
	# 		print s, e, k
	# 		within = []
	# 		for c in temp:
	# 			if s['timestamp']<= c['timestamp'] and c['timestamp']<e['timestamp']:
	# 				c['data']['image'] = e['data']['image']
	# 				within.append(c)
	# 				# print c['data']['image']
	# 		# print len(within)

	# 		if textChanges.has_key(k + '/' + e['data']['image']):
	# 			print 'weirdo'
	# 		textChanges[k + '/' + e['data']['image']] = within
	# 	# print '=========================='
	# 	# print len(texts[k])

	# #collect click data
	# filtered 	= logs.find({'action':'click', 'data.is_practice':'false'})
	# clicks = []
	# for x in filtered:
	# 	if survey.has_key(x['hit_id']+'/'+x['assignment_id']) and \
	# 	 	desc.has_key(x['hit_id']+'/'+x['assignment_id']+ '/' + x['data']['image']):
	# 	 	clicks.append(x)
	# #print clicks

	# #group by images

	# sortedByImage = sorted(clicks, key=lambda x : x['data']['image'])
	# for k, g in itertools.groupby(sortedByImage, key=lambda x : x['data']['image']):
	# 	#save back to database
	# 	imageName = k.split("/")[-1].split(".")[0]
	# 	print 'saving... ', imageName
	# 	groupClicks = list(g)
	# 	sortedByAsmt = sorted(groupClicks, key=lambda x : getKey(x))
	# 	assignments = []
	# 	#group by assignments
	# 	for ak, ag in itertools.groupby(sortedByAsmt, key=lambda x : getKey(x)):
	#     	#sort clicks
	# 		sortedClicks = sorted(ag, key=lambda x: x['timestamp'])

	# 		#sort desc-changes
	# 		sortedDescChgs = sorted(descChanges[k][ak], key=lambda x: x['timestamp'])
	# 		asmt = {}
	# 		asmt["id"]		= ak
	# 		asmt["clicks"] 	= sortedClicks
	# 		asmt["desc"] 	= desc[ak+'/'+k]
	# 		asmt["survey"] 	= survey[ak]
	# 		asmt["texts"] 	= textChanges[ak+'/'+k]

	# 		assignments.append(asmt)
	# 		print 'assignment ID: ', ak, ', click counts: ', len(asmt["clicks"])



	# 	print len(assignments)
	# 	toCol.insert({ "image": imageName, "logs": assignments })
