browser.browserAction.disable();//This should be greyed-out by default

class SecurityDetails {
	constructor(requestDetails,securityInfo) {
		this.securityInfo = securityInfo;
		this.requestDetails = requestDetails;

		Object.freeze(this.securityInfo);
		Object.freeze(this.requestDetails);

		//lazily-evaluated:
		this._secType=undefined;
		this._caId=undefined;
	}

	get secType() {
		if( this._secType === undefined ) {
			this._secType = SecurityDetails.identifySecType(this.securityInfo);
		}
		return this._secType;
	}

	get caId() {
		if( this._caId === undefined ) {
			this._caId = SecurityDetails.identifyCaId(this.securityInfo);
		}
		return this._caId;
	}

	static identifySecType(securityInfo){
		//Takes in a browser.webRequest.getSecurityInfo object
		//and returns an integer from secTypes corresponding to the 
		try {
			switch(securityInfo.state) {
			 case 'insecure':
				//genuinely not HTTPS

				return secTypes.insecure;

			 case 'secure':
				// ANY HTTPS-secured connection //

				const certChain=securityInfo.certificates;

				//If it's length-0 -OR- somehow undefined/null/etc
				if(!( certChain.length >= 1 )) {
					//TODO/FIXME: Mozilla doesn't provide
					//any access whatsoever to self-signed
					//or otherwise nominally-invalid certs
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1678492
					return secTypes.unknown;
				} else if( certChain.length == 1 ) {
					
					return secTypes.selfSigned;
				}

				const rootCert = certChain[certChain.length-1];

				//Now, this connection is...
				if(rootCert.isBuiltInRoot){
					//...Mozilla-supported
					return secTypes.Mozilla;
				}

				if(!securityInfo.isUntrusted){//why didn't they use .isTrusted lol
					//...supported by a Non-Mozilla cert,...
					if(isItMitM(rootCert)){ //TODO
						//...a TLS MITM proxy
						return secTypes.MitM;
					} else {
						//...an alternative Root CA
						if(certChain[certChain.length-1].fingerprint[fp_alg] in fp_host_alt) {
							return secTypes.aRootKnown;
						} else {
							return secTypes.aRootUnknown;
						}
					}
				}
			 default:
				throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
			}
		} catch(e) {
			console.error(e.status||e,{securityInfo:securityInfo});
			return secTypes.unknown;
		}
	}

	static identifyCaId(securityInfo) {
		try {
			const certChain = securityInfo.certificates;
			if( ! certChain.length ) {
				return null;
			} else if( certChain.length == 1 ) {
				return 'self';
			} else {
				const rootCert = certChain[certChain.length-1];
				const fp = rootCert.fingerprint[fp_alg];
				if( fp in fp_host){
					return fp_host.get(fp);
				} else if( fp_host_alt.has(fp) ){
					return fp_host_alt.get(fp);
				} else {
					console.warn('Unknown CA',certChain);
					return fp;
				}
			}
			throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
		} catch(e) {
			console.error(e.status||e,{securityInfo:securityInfo});
			return null;
		}
	}
}

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

function flag(s){
	return String.fromCodePoint(...s.split('').map(u=>u.codePointAt()+127365));
}

function removeFragment(url){
	//Removes the fragment from a URL
	//TODO? iff profiler indicts this function:
	// return url.match(/^[^#]*/)[0];
	let u=new URL(url);
	u.hash="";
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
			Title: {title: `${flag(host_country.get(caId)||'XX')} ${caId}\n(Mozilla-trusted Root CA)`},
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
			Title: {title: `${caId}\n(Alternative Root CA)`},
			BadgeText: {text: rootHost[0].toUpperCase()}, //TODO
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
	const len = h.length;
	const tld = len >= 1 ? h[len-1] : null;
	const sld = len >= 2 ? h[len-2] : null;

	if( country_tld_exceptions.has(tld) ) return country_tld_exceptions.get(tld);
	else return null;
	if( only_gov && sld != 'gov' ) return null;
	if
	switch( match0(tld,exceptionRe) ) {
	 case 'uk':
		
		return 'gb';
	 case 'ac':
		
		return 'sh';
	 case 'gov':
		
		return 'us';
		 case null:
			//2-letter TLD *not* in the exception list;
			//it's a valid ccTLD corresponding to its country
			return tld;
		 default:
			//2-letter TLD *in* the exception list (e.g.: .eu);
			//it's not a valid ccTLD and we don't know the country
			return null;
		}
	} else {
		return null;
	}
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

