function identifySecType(securityInfo){
	try {
		//TODO/FIXME: Mozilla doesn't provide
		//any access whatsoever to self-signed
		//or otherwise nominally-invalid certs
		// https://discourse.mozilla.org/t/webrequest-getsecurityinfo-cant-get-self-signed-tofu-exception-certificates/67135
		if(securityInfo.state!='secure'){
			//once the above is fixed, this if-block
			//will have to be factored out
			return secTypes.insecure;
		}
		let certChain=securityInfo.certificates;
		if(!certChain.length) {
			//TODO: find out whytf this happens sometimes
			throw {status:'emptyCertChainButItsSecure',securityInfo:securityInfo};
		}

		let rootCert=certChain[certChain.length-1];

		//Now, this connection is...
		if(rootCert.isBuiltInRoot){
			//...Mozilla-supported
			return secTypes.Mozilla;
		} else if(!rootCert.isUntrusted) {
			//...supported by a Non-Mozilla cert...
			if(isItMitM(rootCert)){ //TODO
				//...TLS MITM proxy
				return secTypes.MITM;
			} else {
				//...alternative Root CA
				return secTypes.aRoot;
			}
		}
		throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
	} catch(e) {
		//TODO this bit of code could be cleaner, I think
		switch(e.status){
		 case 'emptyCertChainButItsSecure':
			console.warn(e.status||e,securityInfo);
			return secTypes.indeterminate;
		 break;
		 default:
			console.error(e.status||e,securityInfo);
			return -1;
		}
	}
}

function isItMitM(cert){
	//TODO check with the user about this
	if(cert.fingerprint.sha256 in sha256fp_host || cert.fingerprint.sha256 in sha256fp_host_alt){
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

browser.webRequest.onHeadersReceived.addListener(
 //this is the only point we can getSecurityInfo.
 //this is a design flaw IMO, since it allows attackers
 //to intercept at least one outbound request (no matter
 //how well we code) before detection.
 //TODO: pester Mozilla about this
 async function onHeadersReceivedListener(details) {
	let tabId=details.tabId;
	let type=details.type;
	let requestId=details.requestId;
	let securityInfo = await browser.webRequest.getSecurityInfo(requestId,{certificateChain:true});
	let secType=identifySecType(securityInfo);
	let certChain=securityInfo.certificates;
	let browserActionSpec;
	switch(type){
	 case 'main_frame':
		let browserActionSpec=genBrowserActionSpec(secType,certChain);
		setTimeout(()=>{
			updateTabBrowserAction(tabId,browserActionSpec);
		},250); //TODO TODO TODO TODO
		//I know this is absolutely disgusting, but it
		//yields the best UX for now
		return;
	 break;
	 default:
		//TODO
		return;
	}
 },
 {
  urls:['<all_urls>'],
 },
 ['blocking'] //this has to be blocking, or getSecurityInfo doesn't work
);
