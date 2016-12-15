import os, sys, csv

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print "provide a csv input and output filename."
        sys.exit(0)



    with open(sys.argv[1], 'r') as f:
        workers = dict()
        reader = csv.reader(f)
        for row in reader:
            if workers.has_key(row[0]):
                continue
            workers[row[0]] = row[0]

        with open(sys.argv[2], 'ab') as f:
            writer = csv.writer(f)
            for worker_id in workers.values():
                print worker_id
                writer.writerow([worker_id])
        print "duplicate removal finished! : ", len(workers.values())
