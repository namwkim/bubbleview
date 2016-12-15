
import os, pymongo, sys, datetime, csv

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print "provide a database, collection, and filename."
        sys.exit(0)
    # open remote database
    client 	= pymongo.MongoClient('54.69.103.85', 27017)
    db 		= client[sys.argv[1]]
    logs = db[sys.argv[2]].find({'action':'survey'})
    print logs.count()

    workers = dict()
    with open(sys.argv[3], 'ab') as f:
        writer = csv.writer(f)
        for log in logs:
            if workers.has_key(log["worker_id"]):
                continue
            workers[log["worker_id"]] = log["worker_id"]
            print workers[log["worker_id"]]
            writer.writerow([log["worker_id"]])
    print "extractioin finished!"
