const secTypes={
	Mozilla:       0,
	MitM:          1,
	aRootKnown:    2,
	aRootUnknown:  3,
	selfSigned:    4,
	unknown:       254,
	insecure:      255
};
Object.freeze(secTypes);

const sha256fp_host = new Object();
const host_country = new Object();
const sha256fp_host_alt = new Object();

//TODO TODO TODO TODO TODO TODO TODO
sha256fp_host_alt['07:ED:BD:82:4A:49:88:CF:EF:42:15:DA:20:D4:8C:2B:41:D7:15:29:D7:C9:00:F5:70:92:6F:27:7C:C2:30:C5']='cacert.org';
sha256fp_host_alt['89:4E:BC:0B:23:DA:2A:50:C0:18:6B:7F:8F:25:EF:1F:6B:29:35:AF:32:A9:45:84:EF:80:AA:F8:77:A3:A0:6E']='us';//fpki.gov=us
Object.freeze(sha256fp_host_alt);

//Record the SHA-256 Fingerprint -> (reduced) hostname mappings
//As well as non-idiopathic SHA-256 Fingerprint -> country mappings
getAsset("db/IncludedCACertificateReport.json","json")
.forEach(ca => {
	const sha256fp = ca["SHA-256 Fingerprint"].replaceAll(/(\w{2})(?=\w)/g,'$1:');
	//perforate the fingerprints with : every 2 characters
	//(i.e. convert from CCADB-format to Firefox-format)

	const host = reduceHostname(new URL(ca["Company Website"]).hostname);

	sha256fp_host[sha256fp] = host;

	let country = identifyCountry(host);
	if( country ) host_country[host] = country;
});
Object.freeze(sha256fp_host);

//Apply idiopathic country mappings
Object.entries(getAsset("db/host_cityStateCountry.json","json"))
.forEach(([host,[city,state,country]]) => {
	if( host in host_country ) {
		console.warn("Overwriting country! Database may need to be checked.\nIf you're seeing this, please open an issue on GitHub; include the following:",
		 {
			host: host,
			currently: host_country[host],
			csc: [city,state,country]
		 }
		);
	}
	host_country[host] = country.toLowerCase();
});
Object.freeze(host_country);

