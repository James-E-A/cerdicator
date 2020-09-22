#!/usr/bin/env python3
import sys,csv,json

# https://wiki.mozilla.org/CA/Included_Certificates
# https://ccadb-public.secure.force.com/mozilla/IncludedCACertificateReportCSVFormat

#three lines of code
#this script is nearly objective
with open('IncludedCACertificateReportCSVFormat') as f:
	CACertificateReport=list(csv.DictReader(f))

json.dump(CACertificateReport,sys.stdout,indent=2)
