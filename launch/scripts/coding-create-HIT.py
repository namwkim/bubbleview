from boto.mturk.connection import MTurkConnection
from boto.mturk.question import ExternalQuestion
from boto.mturk.qualification import LocaleRequirement, PercentAssignmentsApprovedRequirement, Qualifications
import os, pymongo, sys, random, csv, copy

######  AMT CONFIGURATION PARAMETRS  ######

SANDBOX = False  # Select whether to post to the sandbox (using fake money), or live MTurk site (using REAL money)
HIT_URL = "https://study.namwkim.org/coding"  # Provide the URL that you want workers to sent sent to complete you task

NUMBER_OF_HITS = 15  # Number of different HITs posted for this task
NUMBER_OF_ASSIGNMENTS = 2  # Number of tasks that DIFFERENT workers will be able to take for each HIT
LIFETIME = 60 * 60 * 24 * 7  # How long that the task will stay visible if not taken by a worker (in seconds)
REWARD = 0.2  # Base payment value for completing the task (in dollars)
DURATION = 60*20  # How long the worker will be able to work on a single task (in seconds)
APPROVAL_DELAY = 60*60*24*7  # How long after the task is completed will the worker be automatically paid if not manually approved (in seconds)

PAIRS_PER_HIT = 5

# HIT title (as it will appear on the public listing)
TITLE = 'Evaluating Chart/Graph Description'
# Description of the HIT that workers will see when deciding to accept it or not
DESCRIPTION = ("This HIT should take about 2 minutes to complete. In this HIT, you will be presented with a series of images containing graphs and diagrams, along with their descriptions. "+
				"You will be asked to evaluate the quality of description for each image with scale of zero to three (poor to excellent).")
# Search terms for the HIT posting
KEYWORDS = ['Easy', 'Text', 'Description', 'Evaluation', 'Chart', 'Graph', 'Visualization', 'Image']


# Your Amazon Web Services Access Key (private)
AWS_ACCESS_KEY = ''
# Your Amazon Web Services Secret Key (private)
AWS_SECRET_KEY = ''
# Your Amazon Web Services IAM User Name (private)

######  BUBBLE CONFIGURATION PARAMETRS  ######
BASE_URI = "/images/bubble-db-pilot/targets_prev/"
#BASE_URI_BLUR = "/images/bubble-db-pilot/targets_blurred/"
#######################################


def create_hits(keyfile, descfile):
	# read a keyfile
	with open(keyfile, 'r') as f:
		AWS_ACCESS_KEY = f.readline().split('=')[1].rstrip('\r\n')
		AWS_SECRET_KEY = f.readline().split('=')[1].rstrip('\r\n')

	print AWS_ACCESS_KEY
	print AWS_SECRET_KEY

	if SANDBOX:
		mturk_url = 'mechanicalturk.sandbox.amazonaws.com'
		preview_url = 'https://workersandbox.mturk.com/mturk/preview?groupId='
	else:
		mturk_url = 'mechanicalturk.amazonaws.com'
		preview_url = 'https://mturk.com/mturk/preview?groupId='

	# read image-description pairs
	codings = []
	with open(descfile, 'rU') as codingcsv:	
		codingreader = csv.reader(codingcsv)
		next(codingreader, None); # skip header
		
		
		curImage = ""
		removed  = False
		for row in codingreader:
			if row[1] == "":# -> image number
				# if row[1] == "REMOVED":
				# 	removed = True
				# else:
				# 	removed = False

				curImage = row[9].split("=")[3].split(".")[0]+".png"
				
				
				
			elif removed!=True:
				#print '---'
				#print curImage, row[0], row[9]
				codings.append({ 'img_url': BASE_URI + curImage, 'pid': row[0], 'desc': row[9]});
				#codings = codingMap[curImage]
				#coding = Coding(curImage, row[1], row[2], row[3], row[4], row[5], row[6].split(','), row[7], row[8], row[9])
				#codings.append(coding)
				#print curImage, row[1], row[2], row[3], row[4], row[5], row[6].split(','), row[7], row[8]
		
		
	# calculate the number of hits
	idx = 0
	while len(codings)%PAIRS_PER_HIT!=0:
		codings.append(copy.copy(codings[idx]))
		idx += 1
	NUMBER_OF_HITS = len(codings)/PAIRS_PER_HIT
	
	


	# Create External Question
	q = ExternalQuestion(external_url=HIT_URL, frame_height=800)
	conn = MTurkConnection(aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY, host=mturk_url)

	# Create Qualifications
	quals = Qualifications()
	quals.add(PercentAssignmentsApprovedRequirement(comparator="GreaterThan", integer_value="95"))
	quals.add(LocaleRequirement(comparator="EqualTo", locale="US"))

	#Create HITs
	hitIDs = []
	for i in range(0, NUMBER_OF_HITS):
		create_hit_rs = conn.create_hit(question=q, lifetime=LIFETIME, max_assignments=NUMBER_OF_ASSIGNMENTS, title=TITLE, keywords=KEYWORDS, reward=REWARD, duration=DURATION, approval_delay=APPROVAL_DELAY, description=DESCRIPTION, qualifications=quals)
		print(preview_url + create_hit_rs[0].HITTypeId)
		print("HIT ID: " + create_hit_rs[0].HITId)

		# save HIT IDs
		hitIDs.append(create_hit_rs[0].HITId); 

	# open db connection
	client 	= pymongo.MongoClient('localhost', 27017)
	db 		= client.coding
	stimuli	= db.stimuli

	#remove existing documents
	stimuli.remove({})

	# shuffle
	random.shuffle(codings)
	
	idx = 0
	for i in range(len(hitIDs)):
		hitID = hitIDs[i]
		print hitID
		for j in range(PAIRS_PER_HIT):
			stimulus = codings[i*5 + j]
			stimulus["hit_id"] = hitID
			stimuli.insert(stimulus)
			print stimulus["img_url"]


	# for image in images.find():
	# 	print image
	print "NUM.HITS: ", NUMBER_OF_HITS
	print("HIT.SIZE: " + str(PAIRS_PER_HIT));
   
if __name__ == "__main__":
	create_hits(sys.argv[1], sys.argv[2])

