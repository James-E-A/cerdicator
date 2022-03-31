browser.browserAction.disable();//This should be greyed-out by default

function getAsset(path,type=null){
	const assetURL = browser.runtime.getURL(path);
	const xhr = new XMLHttpRequest();
	xhr.open('GET',assetURL,false);
	xhr.send();
	if(intDiv(xhr.status,100) != 2) throw xhr;
	switch(type){
	 case null:
		return xhr.response;
	 case 'json':
		return JSON.parse(xhr.response);
	 default:
		throw {error:'unsupported "type"',type:type};
	}
}

function ccadb2ff_fp(s) {
	//perforate the fingerprints with : every 2 characters
	//(i.e. convert from CCADB-format to Firefox-format)
	return s.replaceAll(/(\w{2})(?=\w)/g, '$1:');
}

function flag(s){
	return String.fromCodePoint(...s.split('').map(u=>u.codePointAt()+127365));
}

function urldefrag(url){
	//Removes the fragment from a URL
	//TODO? iff profiler indicts this function:
	// return url.match(/^[^#]*/)[0];
	let u = new URL(url);
	u.hash = "";
	return u.toString();
}

function intDiv(a,b){
	//Functions as e.g. Python's integer division
	//Divides then casts directly to integer
	return a/b>>0;
}

function genBrowserActionSpec(secType=null, caId=null){
	switch(secType) {
	 case secTypes.Mozilla:
		return {
			Icon: {path: `images/root_icons/${caId}.ico`},
			Title: {title: `${flag(identifyCountry(caId)||'XX')} ${caId}\n(Mozilla-trusted Root CA)`},
			BadgeText: {text: '\uD83E\uDD8A'},
			BadgeBackgroundColor: {color: 'LimeGreen'}
		};
	 case secTypes.MitM:
		return {
			Icon: {path: `images/Twemoji_1f441.svg`},
			Title: {title: "MitM TLS Proxy\n(This network's administrator is eavesdropping your connection; you have no reasonable expectation of privacy here.)"},
			BadgeText: {text: '\u2013'},
			BadgeBackgroundColor: {color: 'Fuchsia'}
		};
	 case secTypes.aRootKnown:
		return {
			Icon: {path: `images/alt_root_icons/${caId}.ico`},
			Title: {title: `${flag(identifyCountry(caId)||'XX')} ${caId}\n(Alternative Root CA)`},
			BadgeText: {text: caId[0]}, //TODO
			BadgeBackgroundColor: {color: 'Teal'}
		};
	 case secTypes.aRootUnknown:
		return {
			//TODO: better support for these?
			Icon: {path: 'images/Twemoji_1f50f.svg'},
			Title: {title: `I've\u2026never heard of this Root CA before.\n\nWe seem to be identifying it as:\n${caId}`},
			BadgeText: {text: '\u24D8\uFE0F'},
			BadgeBackgroundColor: {color: 'Cyan'}
		};
	 case secTypes.insecure:
		return {
			Icon: {path: 'images/Twemoji_26a0.svg'},
			Title: {title: "Unsecure connection."},
			BadgeText: {text: '\u2013'},
			BadgeBackgroundColor: {color: 'Grey'}
		}
	 default:
		return {
			Icon: {path: 'images/Twemoji_2753.svg'},
			Title: {title: "Could not get security info."},
			BadgeText: {text: '\u274C'},
			BadgeBackgroundColor: {color: 'DarkCyan'}
		};
	}
}

function isItMitM(cert){
	//TODO check with the user about this
	if( fp_host.has(cert.fingerprint[fp_alg]) || fp_host_alt.has(cert.fingerprint[fp_alg]) ) {
		//The cert was in EITHER database
		//therefore it is legitimate,
		//i.e. NOT a MitM:
		return false;
	} else {
		//The cert was in NEITHER database
		//therefore it IS a MitM:
		return true;
	}
}

function applyBrowserActionSpec(propCmdDefaults={},browserActionSpec,extraCmds={}){
	//TODO: why does[?] Firefox not give us an atomic version of this function??
	for(const prop in browserActionSpec) {
		const cmd = Object.assign(new Object(),
		    propCmdDefaults,
		    browserActionSpec[prop]);
		browser.browserAction['set'+prop](cmd);
	}
	for(const cmd in extraCmds){
		browser.browserAction[cmd](extraCmds[cmd]);
	}
}

function resetBrowserAction(propCmdDefaults={}){
	return applyBrowserActionSpec(propCmdDefaults,
	 {
		Title: null,
		Icon: null,
		Popup: null,
		BadgeText: null,
		BadgeBackgroundColor: null,
		BadgeTextColor: null,
	 }
	);
}

browser.runtime.onInstalled.addListener(
 function onInstalledListener(details){
	// Only pester the user if this is a fresh installation [1],
	// or at least a minor version bump [2].
	const openPathInTab = path=>browser.tabs.create({url:browser.runtime.getURL(path)});
	const curVersion = browser.runtime.getManifest().version;
	if( details.reason == "install" ) {
		//[1]
		openPathInTab('db/welcome/install.htm');
	} else {
		const curMinorVersion = curVersion.split('.').splice(0,2).join('.');
		const prevMinorVersion = details.previousVersion.split('.').splice(0,2).join('.');
		if( curMinorVersion != prevMinorVersion ) {
			//[2]
			//openPathInTab('db/welcome/update.htm');//TODO
		}
	}
 }
);

function match0(s,r){
	//Returns the match of r on s
	//Otherwise, null
	//https://stackoverflow.com/a/64083302
	const m = s.match(r);
	if(m) {
		return m[0];
	} else {
		return null;
	}
}

function identifyCountry(hostname, only_gov=false){ 
	const h = hostname.split ? hostname.split('.') : hostname;
	if( host_country.has(h.join('.')) ) return host_country.get(h.join('.'));
	const len = h.length;
	const tld = len >= 1 ? h[len-1] : null;
	const sld = len >= 2 ? h[len-2] : null;

	if( only_gov && sld != 'gov' && tld != 'gov' ) return null;

	if( country_tld_exceptions.has(tld) ) return country_tld_exceptions.get(tld);
	else if( tld.length == 2 ) return tld;
}

function reduceHostname(hostname){
	//Takes in a hostname (e.g. "www.pki.gov.tw") and reduces it to
	//just the "bare minimum" pure-interest/semantic value (e.g. "tw")
	//i.e. it does the following (in order):
	// 1. Strips off the "www" subdomain
	// 2. Strips off the "pki" subdomain
	// 3. If the host is a government domain, return just the country
	// (otherwise, it returns the hostname as-modified per 1 and 2)

	let h = hostname.split('.');
	const tld = h[h.length-1];
	const sld = h.length >= 2 ? h[h.length-2] : null;

	// 1.
	if( h[0] == 'www') h.splice(0,1);

	// 2.
	if( h[0] == 'pki') h.splice(0,1);

	// 3.
	const govCountry = identifyCountry(h, true);
	if( govCountry ) return govCountry;

	return h.join('.');
}

