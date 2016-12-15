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
    db = client[sys.argv[1]]
    cols = db[sys.argv[2]]

    # outlier removal.
    # print 'filtering bad data...'
    tempHits = {}
    # sort and group by hit id
    sortedLogs = sorted(cols.find({}), key=lambda x: x['hit_id'])
    for k, g in itertools.groupby(sortedLogs, key=lambda x: x['hit_id']):
        tempHits[k] = list(g)

    print "# of HITs: ", len(tempHits.values())

    hits = {}
    for hitID, hitData in tempHits.iteritems():  # loop over hit
        sortedLogs = sorted(hitData, key=lambda x: x['assignment_id'])
        # print "============== ", hitID, " =============="
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
                start = filter(lambda x: x['action']
                               == "start-experiment", sortedLogs)
                descs = filter(lambda x: x['action'] == "explain", sortedLogs)
                if len(survey) == 1 and len(start) == 1 and len(descs) == 4:
                    workers[wk] = sortedLogs
            if len(workers.values()) == 1:
                assignments[k] = workers.values()[0]
        if len(assignments.values()) == 0:
            print 'no assignments found: ', len(workers.values())
        else:
            print '# assignments', len(assignments.keys())
            hits[hitID] = assignments

    images = {}
    descMap = {} # to find duplicate description
    CLICK_THRESHOLD = 10
    taskTimes = []
    taskDescs = []
    for hitID, hitData in hits.iteritems():
        for asmtID, asmtData in hitData.iteritems():
            # for workerID, workerData in asmtData.iteritems():
            # print asmtID, ' len: ', len(asmtData)

            start  = filter(lambda x: x['action'] == "start-experiment", asmtData)
            descs  = filter(lambda x: x['action'] == "explain" and x['data']['is_practice'] == "false", asmtData)
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

                if images.has_key(imageName)==False:
                    images[imageName] = { 'image': imageName, 'logs': [] }

                clicks = filter(lambda x: x['action'] == "click" and x['data']['is_practice'] == "false"\
                    and x['data']['image'] == e['data']['image'], asmtData)

                # 2) too small clicks (how can they describe without revealing images, suspicious!)
                if len(clicks)<=CLICK_THRESHOLD:
                    print asmtID, ", ", imageName, " has too small click counts (=", len(clicks), ")"
                    continue

                # 3) calculate time taken & description length
                startTime = datetime.datetime.fromtimestamp(int(s['timestamp'])/1000.0)
                endTime = datetime.datetime.fromtimestamp(int(e['timestamp'])/1000.0)
                taskTimes.append((endTime - startTime).seconds/60.0)
                taskDescs.append(len(desc))
                # print 'saving... ', imageName, " (diffs, clicks = ", len(diffs), ", ", len(clicks), ")"
                images[imageName]['logs'].append({
                        'id': hitID+"/"+asmtID,
                        # 'diffs': diffs,
                        'desc': e,
                        'time': (endTime - startTime).seconds/60.0,
                        'clicks': clicks,
                        'survey': survey[0]
                    })


    assignments = []
    filterRates = []
    taskTimes = []
    for image, imageData in images.iteritems():
        # 3) outlier removal
        # calc stats
        clickCounts = []
        for log in imageData['logs']:
            clickCounts.append(len(log['clicks']))
        if not clickCounts:
            print "ERROR: clickCounts is empty"
            continue
        median 	= np.median(clickCounts)
        iqr75 	= np.percentile(clickCounts, 75)
        iqr25   = np.percentile(clickCounts, 25)
        iqr 	= iqr75-iqr25;

        filtered = []
        remaining = []
        for log in imageData['logs']:
            val = len(log['clicks'])
            if val<(iqr25-3*iqr) or val>(iqr75+3*iqr):
                print log['id'], " is removed as an outlier! (clickCount: ", val, ")"
                filtered.append(log)
            else:
                remaining.append(log)
                taskTimes.append(log['time'])

        imageData['logs'] = remaining
        filterRates.append(float(len(filtered))/len(remaining)*100.0)

        print image , "' asmt size:", len(imageData['logs'])

        print "median click count: ", median, ", iqr range: ", iqr25, " ~ ", iqr75
        assignments.append(len(remaining))
    print '========= STATS =================================================='
    print 'DESC-CHAR (MEAN, STD):', "M={0:.2f}".format(np.mean(taskDescs)) +', '+\
        "SD={0:.2f}".format(np.std(taskDescs))
    print 'AVG.TIME-MIN (MEAN, MEDIAN, STD) (outlier removed):', "M={0:.2f}".format(np.mean(taskTimes))+', '+\
        "MD={0:.2f}".format(np.median(taskTimes))+', '+\
        "SD={0:.2f}".format(np.std(taskTimes))
    print 'AVG.FILTERRATE-% (MEAN, STD):', "M={0:.2f}".format(np.mean(filterRates))+', '+\
        "SD={0:.2f}".format(np.std(filterRates))
    print 'AVG.ASMT-MIN (MEAN, STD):', "M={0:.2f}".format(np.mean(assignments))+', '+\
        "SD={0:.2f}".format(np.std(assignments))+" (min={0:.2f}".format(min(assignments))+')'
