#!/usr/bin/env python3
import sys, csv, json

# https://wiki.mozilla.org/CA/Included_Certificates
"""Usage:
curl https://ccadb-public.secure.force.com/mozilla/IncludedCACertificateReportCSVFormat \
| python3 CAReport2json.py \
> IncludedCACertificateReport.json
"""

# two lines of code
# this script is nearly objective
CACertificateReport = list(csv.DictReader(sys.stdin))
json.dump(CACertificateReport, sys.stdout, indent=2)
