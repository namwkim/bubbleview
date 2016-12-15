from boto.mturk.connection import MTurkConnection, MTurkRequestError
from boto.mturk.question import ExternalQuestion
from boto.mturk.qualification import LocaleRequirement, PercentAssignmentsApprovedRequirement, Qualifications, Requirement
import os, pymongo, sys, random, time, csv, math

######  AMT CONFIGURATION PARAMETRS  ######

SANDBOX = False# Select whether to post to the sandbox (using fake money), or live MTurk site (using REAL money)
HIT_URL = "https://study.namwkim.org/bubble"  # Provide the URL that you want workers to sent sent to complete you task
##TEMPORARY COMMENT: batch 10 has 40 HITS
NUMBER_OF_HITS = 4  # Number of different HITs posted for this task
HIT_SIZE = 3 #  NUMBER OF HITS x HIT_SIZE ~ IMAGE SIZE
NUMBER_OF_ASSIGNMENTS = 9  # Number of tasks that DIFFERENT workers will be able to take for each HIT
LIFETIME = 60 * 60 * 24 * 7  # How long that the task will stay visible if not taken by a worker (in seconds)
REWARD = 0.5  # Base payment value for completing the task (in dollars)
DURATION = 60*45  # How long the worker will be able to work on a single task (in seconds)
APPROVAL_DELAY = 60*60*24*7  # How long after the task is completed will the worker be automatically paid if not manually approved (in seconds)


# HIT title (as it will appear on the public listing)
TITLE = 'Graph/Chart Descriptions'
# Description of the HIT that workers will see when deciding to accept it or not
DESCRIPTION = ("This HIT should take about 5 minutes to complete. In this HIT, you will be presented with a series of images containing graphs and diagrams. "+
				"For each image, you will be asked to describe the image in as much detail as possible (minimum 150 characters). The image is heavily blurred so that you can only see a rough outline of the image. However, you can click to reveal small, circular areas of the image ('bubbles') to inspect the full details.")
# Search terms for the HIT posting
KEYWORDS = ['Easy', 'Chart', 'Graph', 'Text', 'Visualization', 'Image', 'Describe']


# Your Amazon Web Services Access Key (private)
AWS_ACCESS_KEY = ''
# Your Amazon Web Services Secret Key (private)
AWS_SECRET_KEY = ''
# Your Amazon Web Services IAM User Name (private)

######  BUBBLE CONFIGURATION PARAMETRS  ######
BASE_URI = "/images/bubble-db-pilot/targets/"
BASE_URI_BLUR = "/images/bubble-db-pilot/targets_blurred/"
#######################################

def create_blocklist(conn, qualtype, blockfile):
	if blockfile is not None:
		with open(blockfile, 'r') as f:
			reader = csv.reader(f)
			workers = []
			for row in reader:
				workers.append(row[0])
				# assign qualification for past workers to prevent from accepting this hit
				try:
					conn.assign_qualification(qualification_type_id = qualtype[0].QualificationTypeId,
						worker_id=row[0], value="50")
				except MTurkRequestError:
					print "Assign Qualification Failed - No worker found (id:"+ row[0] + ")"
			print "# of workerers participated before: ", len(workers)

def create_hits(keyfile, blockfile):

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

	# collect target image filenames
	targets = []
	for root, dirs, files in os.walk("../../public"+BASE_URI):
		for file in files:
			if file.startswith('.'):
				continue
			targets.append(file)

	targets_blurred = []
	for root, dirs, files in os.walk("../../public"+BASE_URI_BLUR):
		for file in files:
			if file.startswith('.'):
				continue
			targets_blurred.append(file)

	# exit if the number of images do not match
	if len(targets)!=len(targets_blurred):
		print "target!=targets_blurred";
		sys.exit(0)

	# Calculate number of hits
	NUMBER_OF_HITS = int(math.ceil(len(targets)/float(HIT_SIZE)))
	print "NUMBER OF HITS:", NUMBER_OF_HITS
	# Create External Question
	q = ExternalQuestion(external_url=HIT_URL, frame_height=800)
	conn = MTurkConnection(aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY, host=mturk_url)

	# Create a block list
	qname = "Nam Wook Kim - Qualification to Prevent Retakes ("+time.strftime("%S-%M-%H-%d-%m-%Y")+")"
	qualtype = conn.create_qualification_type(name=qname,
		description="This qualification is for people who have worked for me on this task before.",
	    status = 'Active',
	    keywords="Worked for me before",
	    auto_granted = False)
	create_blocklist(conn, qualtype, blockfile) # Assign qualifications to prevent workers from previous HITs
	# print qualtype[0]
	# Create Qualifications
	quals = Qualifications()
	# check to see if workers have the qualification only assigned for workers from previous HITs
	quals.add(Requirement(qualification_type_id = qualtype[0].QualificationTypeId, comparator="DoesNotExist"))
	# demographic qualifications
	quals.add(PercentAssignmentsApprovedRequirement(comparator="GreaterThan", integer_value="95"))
	quals.add(LocaleRequirement(comparator="EqualTo", locale="US"))
	# TODO

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
	db 		= client.bubblestudy
	images	= db.images

	#remove existing documents
	images.delete_many({})

	# calculate the number of images for each HIT
	# hitSize = len(targets)/len(hitIDs);

	# shuffle

	z = zip(targets, targets_blurred)
	random.shuffle(z)
	targets, targets_blurred = zip(*z)

	hitIdx 	= 0
	hitID 	= hitIDs[hitIdx]
	count 	= 0
	print "Image Size:", len(targets)
	print("HIT ID: " + hitID)
	for i in range(len(targets)):
		count +=1
		images.insert_one({"hit_id": hitID, "group": hitIdx, "img_url": BASE_URI+targets[i], "blur_img_url": BASE_URI_BLUR+targets_blurred[i]}) # insert an image into the db with HIT ID assigned
		print (" - Image #"+str(i)+": "+(BASE_URI+targets[i]))
		if count>=HIT_SIZE:
			print("HIT SIZE: " + str(count));
			count   = 0
			hitIdx += 1
			if hitIdx>=len(hitIDs):
				break
			hitID 	= hitIDs[hitIdx]
			print("HIT ID: " + hitID)

if __name__ == "__main__":
	blockfile = None
	if len(sys.argv) < 3:
		print "block list is not provided"
	else:
		blockfile = sys.argv[2]
	create_hits(sys.argv[1], blockfile)
