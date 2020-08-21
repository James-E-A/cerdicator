function getAsset(path){
	const assetURL = browser.runtime.getURL(path);
	const xhr = new XMLHttpRequest();
	xhr.open('GET',assetURL,false);
	xhr.send();
	return xhr.response;
}

const sha256fp_host = new Object();
const host_country = new Object();

{
	let data=getAsset("db/IncludedCACertificateReportJSONFormat");
	JSON.parse(data).forEach(ca=>{
		let sha256fp=ca["SHA-256 Fingerprint"].replaceAll(/(\w{2})(?=\w)/g,'$1:');

		let hostParts=(new URL(ca["Certification Practice Statement (CPS)"])).hostname.split('.')
		//www isn't a real subdomain
		if(hostParts[0]=='www') hostParts.splice(0,1);
		//neither is pki
		if(hostParts[0]=='pki') hostParts.splice(0,1);
		//*.gov.<ccTLD> is just *from* that country
		if(hostParts[hostParts.length-2]=='gov' && hostParts[hostParts.length-1].length==2){
			hostParts.splice(0,[hostParts.length-1]);
			host_country[sha256fp]=hostParts[0];
		}
		let reducedHostname=hostParts.join('.');

		sha256fp_host[sha256fp]=reducedHostname;
	});
	Object.freeze(sha256fp_host);
}

{
	let data=getAsset("db/host_country_cityCounty.tsv");
	data.split('\n').map(row=>row.split('\t'))
	.forEach(([host,country,cityCounty])=>{
		host_country[host]=country;
	});
	Object.freeze(host_country);
}
