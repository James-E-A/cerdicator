browser.webRequest.onHeadersReceived.addListener(
 async (details)=>{
	let tabId=details.tabId;

	let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{certificateChain:true});
//	console.log('onHeadersReceived event triggered\n\nMore information:',{details:details,securityInfo:securityInfo});

	let rootCert,fp,rootHost,path;
	try {
		rootCert=securityInfo.certificates[securityInfo.certificates.length-1];
		fp=rootCert.fingerprint.sha256;
		rootHost=sha256fp_host[fp];
		if(!rootHost) throw rootCert;
		path=`images/root_icons/${rootHost}.ico`;
	} catch {
		console.warn('Unknown root CA',rootCert);
		path = "images/Twemoji12_26a0.svg";
	}

	browser.browserAction.setIcon(
	 {
		//tabId: tabId, //TODO: WHY DOES UNCOMMENTING THIS MAKE IT ONLY LAST 0.01s???
		path: path
	 }
	);

	browser.browserAction.setTitle(
	 {
		//tabId: tabId, //TODO????????????
		title: rootHost||`?? ${fp} ??`
	 }
	);

 },
 {
  types:['main_frame'], //TODO: handle this "appropriately"…whatever that means…
//threat model: attacker intercepting non-main_frame requests
//or intercepting-then-refreshing-it-back-before-anyone-notices

//idea: blockingly fail if cert fingerprint is different between the main_frame and children?
  urls:['<all_urls>']
 },
 ['blocking']
);

