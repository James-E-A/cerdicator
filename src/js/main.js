function identifySecType(securityInfo){
	try {
		if(securityInfo.state!='secure') throw {status:'insecure',securityInfo:securityInfo};
		//TODO: complain to mozilla for better access
		// to ad-hoc/TOFU/self-signed connections.
		//Not only do they always show state='insecure',
		// (which is ARGUABLY correct,) but we're
		// even deprived so much as *access to* their
		// cert chain, so we cannot evaluate them!!
		let certChain=securityInfo.certificates;
		if(!certChain.length) throw {status:'emptyCertChainButItsSecure',securityInfo:securityInfo};
		let rootCert=certChain[certChain.length-1];
		//Now, this connection is...
		if(rootCert.isBuiltInRoot){
			//...Mozilla-supported
			return secTypes.Mozilla;
		} else if(!rootCert.isUntrusted) {
		 //...supported by a Non-Mozilla cert...
		 if(isItMITM(rootCert)){ //TODO
			//...TLS MITM proxy
			return secTypes.MITM;
		 } else {
			//...alternative Root CA
			return secTypes.aRoot;
		 }
		} else {
			//???
			throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
		}
	} catch(e) {
		switch(e.status){
		 case 'insecure':
			return secTypes.insecure;
		 break;
		 case 'emptyCertChainButItsSecure':
			//TODO: find out whytf this happens sometimes
			console.warn(e.status||e,securityInfo);
			return secTypes.indeterminate;
		 break;
		 default:
			console.error(e.status||e,securityInfo);
			return -1;
		}
	}
}

function genBrowserActionSpec(secType,certChain){
	let rootHost,iconPath;
	switch(secType){
	 case secTypes.Mozilla:
		rootHost=sha256fp_host[certChain[certChain.length-1].fingerprint.sha256];
		return {
			Icon: {path:`images/root_icons/${rootHost}.ico`},
		//	BadgeText: {text: '\u2026'}; //TODO?
		//	BadgeBackgroundColor: {color: 'LimeGreen'};
		};
	 break;
	 case secTypes.MITM:
		return {
			Icon: {path:`images/Twemoji_1f441.svg`},
			BadgeText: {text: '\u2026'}, //TODO: ...something?
			BadgeBackgroundColor: {color: 'Fuchsia'}
		};
	 break;
	 case secTypes.aRoot:
		rootHost=sha256fp_host_alt[certChain[certChain.length-1].fingerprint.sha256];
		if(rootHost){
			iconPath=`images/alt_root_icons/${rootHost}.ico`;
		} else {
			iconPath='images/Twemoji_1f50f.svg';
		}
		return {
			Icon: {path:iconPath},
			BadgeText: {text: '\u2026'}, //TODO: which aRoot?
			BadgeBackgroundColor: {color: 'Cyan'}
		};
	 break;
	 case secTypes.indeterminate:
		return {} //TODO???
	 break;
	 default:
		return {
			Icon: {path:`images/Twemoji_2716.svg`},
		//	BadgeText: {text: '\u2026'};
		//	BadgeBackgroundColor: {color: 'Grey'};
		};
	}
}

function updateTabBrowserAction(tabId,browserActionSpec){
	for(let prop in browserActionSpec){
		let cmd=new Object();
		Object.assign(cmd,browserActionSpec[prop]);
		Object.assign(cmd,{tabId:tabId});
		browser.browserAction['set'+prop](cmd);
	}
}

function isItMITM(cert){
	if(cert.fingerprint.sha256 in sha256fp_host || cert.fingerprint.sha256 in sha256fp_host_alt){
		return false;
	} else {
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
	let requestId=details.requestId;
	let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{certificateChain:true});
	if(details.frameId==0){
		return onReceivingMainFrame(tabId,securityInfo);
	} else {
		return onReceivingNonMainFrame(tabId,securityInfo);
	}
 },
 {
  urls:['<all_urls>']
 },
 ['blocking'] //this has to be blocking, or getSecurityInfo doesn't work
);

function onReceivingMainFrame(tabId,securityInfo){
	let secType=identifySecType(securityInfo);
	let certChain=securityInfo.certificates;
	let browserActionSpec=genBrowserActionSpec(secType,certChain);
	updateTabBrowserAction(tabId,browserActionSpec);
}

function onReceivingNonMainFrame(tabId,securityInfo){
	//TODO
}
