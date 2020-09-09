const secTypes={
	Mozilla:       0,
	MitM:          1,
	aRootKnown:    2,
	aRootUnknown:  3,
	indeterminate: 254,
	insecure:      255
};
Object.freeze(secTypes);

const sha256fp_host = new Object();
const host_country = new Object();
const sha256fp_host_alt = new Object();

//TODO TODO TODO TODO TODO TODO TODO
sha256fp_host_alt['07:ED:BD:82:4A:49:88:CF:EF:42:15:DA:20:D4:8C:2B:41:D7:15:29:D7:C9:00:F5:70:92:6F:27:7C:C2:30:C5']='cacert.org';
Object.freeze(sha256fp_host_alt);

{
	let data=JSON.parse(getAsset("db/IncludedCACertificateReport.json"));
	data.forEach(ca=>{
		let reducedHostname;
		let sha256fp=ca["SHA-256 Fingerprint"]
		.replaceAll(/(\w{2})(?=\w)/g,'$1:'); //perforate the fingerprints with : every 2 characters

		let hostParts=(new URL(ca["Company Website"])).hostname.split('.')

		//www isn't a real subdomain
		if(hostParts[0]=='www') hostParts.splice(0,1);

		//neither is pki
		if(hostParts[0]=='pki') hostParts.splice(0,1);

		//.<ccTLD> is from that country
		if(hostParts[hostParts.length-1].length==2){
			//gov is also a non-semantic subdomain
			if(hostParts[hostParts.length-2]=='gov') hostParts.splice(0,hostParts.length-1);
			reducedHostname=hostParts.join('.');
			host_country[reducedHostname]=hostParts[hostParts.length-1].toUpperCase();
		} else {
			reducedHostname=hostParts.join('.');
		}

		sha256fp_host[sha256fp]=reducedHostname;
	});
}
Object.freeze(sha256fp_host);

{
	let data=JSON.parse(getAsset("db/host_cityStateCountry.json"));
	for(let host in data){
		host_country[host]=data[host].split(', ')[2];
	}
}
Object.freeze(host_country);

