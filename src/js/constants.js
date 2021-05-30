const fp_alg = 'sha256';
const fp_alg_key = fp_alg.replace(/(\w+?)(\d+)/, (m, alg, n) => `${alg.toUpperCase()}-${n} Fingerprint`)

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
const country_tld_exceptions = new Map([
	// AMERICAA
	['gov', 'us'],
	// Britain owns+uses this one
	['uk', 'gb'],
	// Ascension Island is part of the British Overseas territory,
	// "Saint Helena, Ascension and Tristan da Cunha"
	['ac', 'sh'],
	// European Union
	['eu', null]
]);

const fp_host = new Map();
const host_country = new Map();
const fp_host_alt = new Map();

//TODO TODO TODO TODO TODO TODO TODO
fp_host_alt.set('07:ED:BD:82:4A:49:88:CF:EF:42:15:DA:20:D4:8C:2B:41:D7:15:29:D7:C9:00:F5:70:92:6F:27:7C:C2:30:C5', 'cacert.org');
fp_host_alt.set('89:4E:BC:0B:23:DA:2A:50:C0:18:6B:7F:8F:25:EF:1F:6B:29:35:AF:32:A9:45:84:EF:80:AA:F8:77:A3:A0:6E', 'us');  //fpki.gov=us
fp_host_alt.set('B1:07:B3:3F:45:3E:55:10:F6:8E:51:31:10:C6:F6:94:4B:AC:C2:63:DF:01:37:F8:21:C1:B3:C2:F8:F8:63:D2', 'us'); // whytf does the DoD have so many roots, and why was this one never cross-signed?

//Record the SHA-256 Fingerprint -> (reduced) hostname mappings
//As well as non-idiopathic SHA-256 Fingerprint -> country mappings
getAsset("db/IncludedCACertificateReport.json", "json")
.filter(ca => new Set(ca['Trust Bits'].split(';')).has('Websites'))
.forEach(ca => {
	const fp = ca[fp_alg_key].replaceAll(/(\w{2})(?=\w)/g,'$1:');
	//perforate the fingerprints with : every 2 characters
	//(i.e. convert from CCADB-format to Firefox-format)

	const host = reduceHostname(new URL(ca["Company Website"]).hostname);

	fp_host.set(fp, host);

	let country = identifyCountry(host);
	if( country ) host_country.get(host) = country;
});

//Apply idiopathic country mappings
Object.entries(getAsset("db/host_cityStateCountry.json","json"))
.forEach(([host, [city, state, country]]) => {
	if( host in host_country ) {
		console.warn("Overwriting country! Database may need to be checked.\nIf you're seeing this, please open an issue on GitHub; include the following:",
		 {
			host: host,
			currently: host_country.get(host),
			csc: [city, state, country]
		 }
		);
	}
	host_country.set(host, country.toLowerCase());
});

