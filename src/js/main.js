//Global cache of SecurityDetails objects:
const cachedSecurityDetails=new Object();

browser.tabs.onUpdated.addListener(
 function onTabUpdatedStatusListener(tabId,changeInfo,tabInfo){
	let browserActionSpec = genBrowserActionSpec(secTypes.unknown);
	let extraCmds = {};
	try {
		const url = removeFragment(tabInfo.url);
		const securityDetails = cachedSecurityDetails[tabId][url];
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
	delete cachedSecurityDetails[tabId];
 }
);

//this is the only point we can getSecurityInfo.
//this is a design flaw IMO, since it allows attackers
//to intercept at least one outbound request (no matter
//how well we code) before detection.
//TODO: pester Mozilla about this
browser.webRequest.onHeadersReceived.addListener(
 async function onHeadersReceivedListener(details){
	const tabId = details.tabId;
	const type = details.type;
	const requestId = details.requestId;
	const requestUrl = removeFragment(details.url);
	const securityInfo = await browser.webRequest.getSecurityInfo(requestId,{certificateChain:true,rawDER:true});
	switch(type){
	 case 'main_frame':
		if(!( tabId in cachedSecurityDetails )) cachedSecurityDetails[tabId] = new Object();
		const secDetails = new SecurityDetails(details, securityInfo);
		return cachedSecurityDetails[tabId][requestUrl] = secDetails;
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
