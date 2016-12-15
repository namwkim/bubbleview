from boto.mturk.connection import MTurkConnection
from boto.mturk.question import ExternalQuestion

import sys, csv
from pprint import pprint
######  CONFIGURATION PARAMETRS  ######

SANDBOX = False  # Select whether to post to the sandbox (using fake money), or live MTurk site (using REAL money)

# Your Amazon Web Services Access Key (private)
AWS_ACCESS_KEY = '' # <-- TODO: Enter your access key here
# Your Amazon Web Services Secret Key (private)
AWS_SECRET_KEY = '' # <-- TODO: Enter your private key here

#######################################

""" Delete the HIT associated with the supplied HITId. """
def revoke_qualification(keyfile, worker_list_file):
    # read a keyfile
    with open(keyfile, 'r') as f:
        AWS_ACCESS_KEY = f.readline().split('=')[1].rstrip('\r\n')
        AWS_SECRET_KEY = f.readline().split('=')[1].rstrip('\r\n')

    #print AWS_ACCESS_KEY
    #print AWS_SECRET_KEY
    #rea
    # workers = []
    # with open(worker_list_file, 'r') as f:
    #     csvreader = csv.reader(f);
    #     for row in csvreader:
    #         workers.append(row[0])

    if SANDBOX:
        mturk_url = 'mechanicalturk.sandbox.amazonaws.com'
        preview_url = 'https://workersandbox.mturk.com/mturk/preview?groupId='
    else:
        mturk_url = 'mechanicalturk.amazonaws.com'
        preview_url = 'https://mturk.com/mturk/preview?groupId='

    # find qualification ID
    conn = MTurkConnection(aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY, host=mturk_url)
    hits = conn.get_all_hits()
    for hit in hits:
        #
        hit = conn.get_hit(hit_id=hit.HITId)[0];
        if not hit.expired and hit.Title=="Graph/Chart Descriptions":
            print "HIT " + hit.HITId + " : " + hit.Title
            print "--- HITStatus: "+hit.HITStatus+", ReviewStatus: " + hit.HITReviewStatus + ", Expiration: " +hit.Expiration+""
            print hit.Description
            print hit.__dict__
    # for worker in workers:
    #     conn.revoke_qualification(worker, qualTypeID);

if __name__ == "__main__":
    revoke_qualification(sys.argv[1], sys.argv[1])
