#!/usr/bin/env python3
from sys import stdin, stdout
import csv, json

# https://wiki.mozilla.org/CA/Included_Certificates
"""Usage:
curl https://ccadb-public.secure.force.com/mozilla/IncludedCACertificateReportCSVFormat \
| python3 CAReport2json.py \
> IncludedCACertificateReport.json
"""

# two lines of code
# this script is nearly objective
CACertificateReport = list(csv.DictReader(stdin))
json.dump(CACertificateReport, stdout, indent=2)
