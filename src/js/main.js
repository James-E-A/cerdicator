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
		let rootCert=certChain[certChain.length-1];
		//Now, this connection is...
		if(rootCert.isBuiltInRoot){
			//...Mozilla-supported
			return secTypes.Mozilla;
		} else if(!rootCert.isUntrusted) {
		 //...supported by a Non-Mozilla cert...
		 if(true){ //TODO
			//...TLS MITM proxy
			return secTypes.MITM;
		 } else {
			//...alternative Root CA
			return secTypes.aRoot;
		 }
		} else {
			//???
			console.warn("THIS SHOULD NEVER HAPPEN...?");
			throw {status:'WTF',securityInfo:securityInfo};
		}
	} catch(e) {
		switch(e.status){
		 case 'insecure':
			return secTypes.insecure;
		 break;
		 default:
			return -1;
		}
	}
}

function genBrowserActionSpec(secType,certChain){
	switch(secType){
	 case secTypes.Mozilla:
		let rootHost=sha256fp_host[certChain[certChain.length-1].fingerprint.sha256];
		return {
			Icon: {path:`images/root_icons/${rootHost}.ico`},
		//	BadgeText: {Text: '\u2026'}; //TODO?
		//	BackgroundColor: {color: 'LimeGreen'};
		};
	 break;
	 case secTypes.MITM:
		return {
			Icon: {path:`images/Twemoji_2716.svg`},
			BadgeText: {Text: '\u2026'}, //TODO: ...something?
			BackgroundColor: {color: 'Fuchsia'}
		};
	 break;
	 case secTypes.aRoot:
		return {
			Icon: {path:`images/Twemoji_1f50f.svg`},
			BadgeText: {text: '\u2026'}, //TODO: which aRoot?
			BackgroundColor: {color: 'Cyan'}
		};
	 break;
	 default:
		return {
			Icon: {path:`images/Twemoji_2716.svg`},
		//	BadgeText: {text: '\u2026'};
		//	BackgroundColor: {color: 'Grey'};
		};
	}
}

function updateTabBrowserAction(tabId,browserActionSpec){
	for(let prop in browserActionSpec){
		let cmd=new Object();
		Object.assign(cmd,browserActionSpec[prop]);
		Object.assign(cmd,{tabId:tabId});
		browser.browserAction['set'+prop](cmd);
		console.log(`browser.browserAction['${'set'+prop}'](${JSON.stringify(cmd)});`);
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
