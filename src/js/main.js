//Global cache of SecurityDetails objects:
const cachedSecurityDetails=new Map();

browser.tabs.onUpdated.addListener(
 function onTabUpdatedStatusListener(tabId,changeInfo,tabInfo){
	let browserActionSpec = genBrowserActionSpec(secTypes.unknown);
	let extraCmds = {};
	try {
		const host = new URL(tabInfo.url).host;
		const securityDetails = cachedSecurityDetails.get(tabId).get(host);
		if( changeInfo.status == 'complete' && securityDetails ) extraCmds.enable = tabId;
		browserActionSpec = genBrowserActionSpec(securityDetails.secType,securityDetails.caId);
	} finally {
		applyBrowserActionSpec({tabId:tabId},browserActionSpec,extraCmds);
	}
 },
 {
  properties: ["status"]//TODO: include "url"? -will require some refactoring.
 }
);

browser.tabs.onRemoved.addListener(
 async function onTabRemovedListener(tabId,removeInfo){
	cachedSecurityDetails.delete(tabId);
 }
);

// Until or unless Mozilla fixes https://bugzilla.mozilla.org/show_bug.cgi?id=1499592
// attackers may intercept at least one outbound request
// (no matter how well we code) before detection.
// blocked by the following upstream bug with Priority: P5
// https://bugzilla.mozilla.org/show_bug.cgi?id=1499592
browser.webRequest.onHeadersReceived.addListener(
 async function onHeadersReceivedListener(details){
	const tabId = details.tabId;
	const type = details.type;
	const requestId = details.requestId;
	const host = new URL(details.url).host;
	const securityInfo = await browser.webRequest.getSecurityInfo(requestId,{certificateChain:true,rawDER:true});
	switch(type){
	 case 'main_frame':
		// TODO
		if( !cachedSecurityDetails.has(tabId) ) cachedSecurityDetails.set(tabId, new Map());
		const secDetails = new SecurityDetails(details, securityInfo);
		return cachedSecurityDetails.get(tabId).set(host, secDetails);
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

