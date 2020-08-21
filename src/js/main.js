const rootCertsByTab=new Object();

function genBrowserActionSpec(rootCerts){
 let browserActionSpec=new Object();
 for(let rootCert of (rootCerts.size?rootCerts:[null])){
  try {
	rootHost=sha256fp_host[rootCert];
	if(!rootHost) throw rootCert;

	browserActionSpec.Icon={path:`images/root_icons/${rootHost}.ico`};
	browserActionSpec.BadgeText={text:""};
	browserActionSpec.Title={title:rootHost};
  } catch(e) {
	//TODO: more edge cases here (self-signed, etc.)
	browserActionSpec.Icon={path:"images/Twemoji12_26a0.svg"};
	browserActionSpec.BadgeText={text:"!"};
	browserActionSpec.BadgeBackgroundColor={color:"red"};
	browserActionSpec.Title={title:JSON.stringify(e)};
	break;
  }
 }

 //console.log(browserActionSpec);
 return browserActionSpec;
}

function updateTabBrowserAction(tabId){
	let browserActionSpec=genBrowserActionSpec(rootCertsByTab[tabId]);
	for(let prop in browserActionSpec){
		let cmd={tabId:tabId};
		Object.assign(cmd,browserActionSpec[prop]);
		browser.browserAction['set'+prop](cmd);
	}
}

browser.webRequest.onBeforeRequest.addListener(
 //a new frame enters the tab; clear or create its rootCert set
 async function onBeforeMainFrameRequestListener(details){
	let tabId=details.tabId;
	if(rootCertsByTab[tabId]===undefined) rootCertsByTab[tabId]=new Set();
	else rootCertsByTab[tabId].clear();
	//console.log(rootCertsByTab);
	//TODO: fix memory leak
 },
 {
  types:['main_frame'],
  urls:['<all_urls>']
 },
 ['blocking']
);

browser.webRequest.onHeadersReceived.addListener(
 //this is the only point we can getSecurityInfo.
 //add it to rootCertsByTab
 async function onHeadersReceivedListener(details) {
	let tabId=details.tabId;
	let requestId=details.requestId;

	let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{certificateChain:true});
	//console.log({tabId:tabId,requestId:requestId,securityInfo:securityInfo});

	try {
		if(!(securityInfo.certificates.length>0)) throw securityInfo;
		let rootCert=securityInfo.certificates[securityInfo.certificates.length-1];
		rootCertsByTab[tabId].add(rootCert.fingerprint.sha256||null);
		//console.log(rootCertsByTab);
	} catch(e) {
		rootCertsByTab[tabId].add(null);
	}

	updateTabBrowserAction(tabId);

	return {};//TODO: maybe remove this line

 },
 {
  urls:['<all_urls>']
 },
 ['blocking'] //this has to be blocking, or getSecurityInfo doesn't work
);

