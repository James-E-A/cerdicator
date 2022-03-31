const fp_alg = 'sha256';
const fp_alg_key = fp_alg.replace(/(\w+?)(\d+)/, (m, alg, n) => `${alg.toUpperCase()}-${n} Fingerprint`)

const issue_tracker_url = 'https://github.com/JamesTheAwesomeDude/cerdicator/issues';

const secTypes = {
	Mozilla:       0,
	MitM:          1,
	aRootKnown:    2,
	aRootUnknown:  3,
	selfSigned:    4,
	unknown:       254,
	insecure:      255
};
Object.freeze(secTypes);

// https://en.wikipedia.org/wiki/Country_code_top-level_domain#ASCII_ccTLDs_not_in_ISO_3166-1
const country_tld_exceptions = new Map(Object.entries(getAsset("db/cctld_overrides.json", "json")));

const fp_host = new Map();
const host_country = new Map();
const fp_host_alt = new Map();

//TODO TODO TODO TODO TODO TODO TODO
fp_host_alt.set('07:ED:BD:82:4A:49:88:CF:EF:42:15:DA:20:D4:8C:2B:41:D7:15:29:D7:C9:00:F5:70:92:6F:27:7C:C2:30:C5', 'cacert.org');
fp_host_alt.set('89:4E:BC:0B:23:DA:2A:50:C0:18:6B:7F:8F:25:EF:1F:6B:29:35:AF:32:A9:45:84:EF:80:AA:F8:77:A3:A0:6E', 'us');  // fpki.gov
fp_host_alt.set('D2:6D:2D:02:31:B7:C3:9F:92:CC:73:85:12:BA:54:10:35:19:E4:40:5D:68:B5:BD:70:3E:97:88:CA:8E:CF:31', 'ru');  // gosuslugi.ru

// Record the Fingerprint -> (reduced) hostname mappings
// As well as non-idiopathic Fingerprint -> country mappings
getAsset("db/IncludedCACertificateReport.json", "json")
.filter(ca => new Set(ca['Trust Bits'].split(';')).has('Websites'))
.forEach(ca => {
	const fp = ccadb2ff_fp(ca[fp_alg_key]);

	const host = reduceHostname(new URL(ca["Company Website"]).hostname);

	fp_host.set(fp, host);

	let country = identifyCountry(host);
	if( country ) host_country.set(host, country);
});

//Apply idiopathic country mappings
Object.entries(getAsset("db/host_geo.json","json"))
.forEach(([host, geo]) => {
	if( host_country.has(host) ) {
		console.warn(`Overwriting country! Database may need to be checked.\nIf you're seeing this, please open an issue on the issue tracker (${issue_tracker_url}); include the following:`,
		 {
			host: host,
			currently: host_country.get(host),
			geo: geo
		 }
		);
	}
	host_country.set(host, geo["Country"].toLowerCase());
});

