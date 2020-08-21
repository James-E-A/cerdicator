#!/usr/bin/env python3
import sys,csv,json

# https://wiki.mozilla.org/CA/Included_Certificates
# https://ccadb-public.secure.force.com/mozilla/IncludedCACertificateReportCSVFormat

#three lines of code
#this script is nearly objective
with open('IncludedCACertificateReportCSVFormat') as f:
	r=csv.DictReader(f)
	json.dump([ca for ca in r],sys.stdout,indent=2)
