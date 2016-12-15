import os, pymongo, sys



if len(sys.argv) < 2:
    print "provide a database name"
    sys.exit(0)
print "copying", sys.argv[1]
localClient = pymongo.MongoClient('localhost', 27017)
localClient.drop_database(sys.argv[1]);
localClient.admin.command('copydb',
                 fromdb=sys.argv[1],
                 todb=sys.argv[1],
                 fromhost='140.247.55.188:27017')
                 #fromhost='54.69.103.85:27017')
