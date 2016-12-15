from boto.mturk.connection import MTurkConnection
from boto.mturk.question import ExternalQuestion

import sys

######  CONFIGURATION PARAMETRS  ######

SANDBOX = False# Select whether to post to the sandbox (using fake money), or live MTurk site (using REAL money)

# Your Amazon Web Services Access Key (private)
AWS_ACCESS_KEY = '' # <-- TODO: Enter your access key here
# Your Amazon Web Services Secret Key (private)
AWS_SECRET_KEY = '' # <-- TODO: Enter your private key here

#######################################

STATUS = "Rejected" #"Submitted", "Approved"
""" Delete the HIT associated with the supplied HITId. """
def add_asignments(keyfile, numAsmt):
	# read a keyfile
	with open(keyfile, 'r') as f:
		AWS_ACCESS_KEY = f.readline().split('=')[1].rstrip('\r\n')
		AWS_SECRET_KEY = f.readline().split('=')[1].rstrip('\r\n')

	#print AWS_ACCESS_KEY
	#print AWS_SECRET_KEY

	if SANDBOX:
		mturk_url = 'mechanicalturk.sandbox.amazonaws.com'
		preview_url = 'https://workersandbox.mturk.com/mturk/preview?groupId='
	else:
		mturk_url = 'mechanicalturk.amazonaws.com'
		preview_url = 'https://mturk.com/mturk/preview?groupId='

	conn = MTurkConnection(aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY, host=mturk_url)
	hits = conn.get_all_hits()
	for hit in hits:
		print "HIT " + hit.HITId + " : " + hit.Title
		print "--- HITStatus: "+hit.HITStatus+", ReviewStatus: " + hit.HITReviewStatus + ", Expiration: " +hit.Expiration+""
		# conn.expire_hit(hit.HITId)

		# Give the HIT a moment to expire.
		# time.sleep(0.25)

		# Update Hit
		hit = conn.get_hit(hit_id=hit.HITId)[0];
		# print hit.expired
		# print "HIT " + hit.HITId + "(Status: "+hit.HITStatus+")"
            	conn.extend_hit(hit_id=hit.HITId, assignments_increment=numAsmt)

if __name__ == "__main__":
	import time
	add_asignments(sys.argv[1], sys.argv[2])
