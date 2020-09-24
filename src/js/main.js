const cachedSecurityInfosByTabIdAndURL=new Object();//global cache
browser.browserAction.disable();//This intentionally omits windowId

function identifySecType(securityInfo){
	try {
	 switch(securityInfo.state){
	  case 'insecure':

		//genuinely not HTTPS
		return secTypes.insecure;

	  case 'secure':
		let certChain=securityInfo.certificates;

		if(certChain.length==0){
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

		if(!securityInfo.isUntrusted){//why didn't they use .isTrusted lol
			//...supported by a Non-Mozilla cert,...
			if(isItMitM(rootCert)){ //TODO
				//...a TLS MITM proxy
				return secTypes.MitM;
			} else {
				//...an alternative Root CA
				if(certChain[certChain.length-1].fingerprint.sha256 in sha256fp_host_alt) {
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
		switch(e.status){
		 default:
			console.error(e.status||e,{securityInfo:securityInfo});
			return secTypes.unknown;
		}
	}
}

browser.tabs.onUpdated.addListener(
 function onTabUpdatedStatusListener(tabId,changeInfo,tabInfo){
	let securityInfo,letType,certChain,browserActionSpec,extraCmds=[];
	try {
		securityInfo=cachedSecurityInfosByTabIdAndURL[tabId][tabInfo.url];
		if(changeInfo.status=='complete' && securityInfo) extraCmds={enable:tabId};
		secType=identifySecType(securityInfo);
		certChain=securityInfo.certificates;
		browserActionSpec=genBrowserActionSpec(secType,certChain);
	} catch(e) {
		secType=secTypes.unknown;
	} finally {
		applyBrowserActionSpec({tabId:tabId},browserActionSpec,extraCmds);
	}
 },
 {
  properties: ["status"]
 }
);

browser.tabs.onRemoved.addListener(
 async function onTabRemovedListener(tabId,removeInfo) {
	delete cachedSecurityInfosByTabIdAndURL[tabId];
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
	let requestUrl=details.url;
	let securityInfo = await browser.webRequest.getSecurityInfo(requestId,{certificateChain:true,rawDER:true});
	switch(type){
	 case 'main_frame':
		if(!(tabId in cachedSecurityInfosByTabIdAndURL)) cachedSecurityInfosByTabIdAndURL[tabId]={};
		cachedSecurityInfosByTabIdAndURL[tabId][requestUrl]=securityInfo;
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
