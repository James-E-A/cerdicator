function getAsset(path){
	const assetURL = browser.runtime.getURL(path);
	const xhr = new XMLHttpRequest();
	xhr.open('GET',assetURL,false);
	xhr.send();
	return xhr.response;
}

const sha256fp_host = new Object();
{
	let data=getAsset("db/sha256fp_host.tsv");
	data.split('\n')
	.map(row=>row.split('\t'))
	.forEach(([fp,host])=>{
		sha256fp_host[fp]=host;
	});
	Object.freeze(sha256fp_host);
}

const host_country = new Object();
{
	let data=getAsset("db/host_country_cityCounty.tsv");
	data.split('\n')
	.map(row=>row.split('\t'))
	.forEach(([host,country,cityCounty])=>{
		host_country[host]=country;
	});
	Object.freeze(host_country);
}
