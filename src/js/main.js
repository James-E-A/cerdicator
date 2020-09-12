const queuedBrowserActionSpecsByTabId=new Object();//global cache

function identifySecType(securityInfo){
	try {
		if(securityInfo.state!='secure'){
			//once the above is fixed, this if-block
			//will have to be factored out
			return secTypes.insecure;
		}

		let certChain=securityInfo.certificates;

		if(securityInfo.isUntrusted){
			//TODO/FIXME: Mozilla doesn't provide
			//any access whatsoever to self-signed
			//or otherwise nominally-invalid certs
			// https://discourse.mozilla.org/t/webrequest-getsecurityinfo-cant-get-self-signed-tofu-exception-certificates/67135
			return secTypes.unknown;
		}

		let rootCert=certChain[certChain.length-1];

		//Now, this connection is...
		if(rootCert.isBuiltInRoot){
			//...Mozilla-supported
			return secTypes.Mozilla;
		}

		//...supported by a Non-Mozilla cert...
		if(isItMitM(rootCert)){ //TODO
			//...TLS MITM proxy
			return secTypes.MitM;
		} else {
			//...alternative Root CA
			if(certChain[certChain.length-1].fingerprint.sha256 in sha256fp_host_alt) {
				return secTypes.aRootKnown;
			} else {
				return secTypes.aRootUnknown;
			}
		}

		throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
	} catch(e) {
		switch(e.status){
		 default:
			console.error(e.status||e,securityInfo);
			return -1;
		}
	}
}

browser.tabs.onUpdated.addListener(
 async function onTabUpdatedStatusListener(tabId,changeInfo,tabInfo){
	switch(changeInfo.status){
	 case('complete'):
		if(tabId in queuedBrowserActionSpecsByTabId){
			let myQueuedBrowserActionSpec=queuedBrowserActionSpecsByTabId[tabId];
			delete queuedBrowserActionSpecsByTabId[tabId];
			await updateBrowserAction(tabId,myQueuedBrowserActionSpec);
		} else {
			browser.browserAction.disable(tabId);
		}
	 break;
	 case('loading'):
		browser.browserAction.enable(tabId);
	 break;
	}
 },
 {
  properties: ["status"]
 }
);

browser.tabs.onRemoved.addListener(
 async function onTabRemovedListener(tabId,removeInfo) {
	delete queuedBrowserActionSpecsByTabId[tabId];
 }
);

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
	let securityInfo = await browser.webRequest.getSecurityInfo(requestId,{certificateChain:true,rawDER:true});
	let secType=identifySecType(securityInfo);
	let certChain=securityInfo.certificates;
	let browserActionSpec;
	switch(type){
	 case 'main_frame':
		let browserActionSpec=genBrowserActionSpec(secType,certChain);
		queuedBrowserActionSpecsByTabId[tabId]=browserActionSpec;
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

browser.windows.onCreated.addListener(
 async function onWindowCreatedListener(window) {
	browser.browserAction.disable();
 }
);
