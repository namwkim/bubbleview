from boto.mturk.connection import MTurkConnection
from boto.mturk.question import ExternalQuestion

import sys

######  CONFIGURATION PARAMETRS  ######

SANDBOX = True  # Select whether to post to the sandbox (using fake money), or live MTurk site (using REAL money)

# Your Amazon Web Services Access Key (private)
AWS_ACCESS_KEY = '' # <-- TODO: Enter your access key here
# Your Amazon Web Services Secret Key (private)
AWS_SECRET_KEY = '' # <-- TODO: Enter your private key here

#######################################


""" Delete the HIT associated with the supplied HITId. """
def delete_all_hit(keyfile):
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

	for hit in conn.get_all_hits():
		conn.expire_hit(hit.HITId)
		time.sleep(0.25)
		# Update Hit
		hit = conn.get_hit(hit_id=hit.HITId)[0];
		print "HIT " + hit.HITId + "(Status: "+hit.HITStatus+")"
		if hit.HITStatus == "Reviewable":
			assignments = conn.get_assignments(hit_id=hit.HITId, status="Submitted", page_size=100);
			print " # of assignments = " + assignments.NumResults
			for assignment in assignments:
				print "Approving " + assignment.AssignmentId + "(Status: " + assignment.AssignmentStatus + ")"
				conn.approve_assignment(assignment.AssignmentId);
			conn.dispose_hit(hit.HITId)

if __name__ == "__main__":
	import time
	delete_all_hit(sys.argv[1])
