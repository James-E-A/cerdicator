browser.webRequest.onHeadersReceived.addListener(
 async function onHeadersReceivedListener(details) {
//	console.log('onHeadersReceived event triggered!',{details:details});

	let tabId=details.tabId;
	let requestId=details.requestId;

	let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{certificateChain:true});
//	console.log({requestId:requestId,securityInfo:securityInfo});

	browser.tabs.sendMessage(tabId,{onHeadersReceived:details,securityInfo:securityInfo});

	return {};//TODO: maybe remove this line

 },
 {
  types:['main_frame'],//TODO remove this, I just put it in for debugging
  urls:['<all_urls>']
 },
 ['blocking'] //this has to be blocking, or getSecurityInfo doesn't work
);

browser.webRequest.onCompleted.addListener(
 async function browserActionImageUpdate(details) {
	console.log("Beginning onCompleted...",{details:details});

	let tabId=details.tabId;
	let browserActionSpec=(
	 await browser.tabs.sendMessage(tabId,{onCompleted:details}) );
	console.log("Tab returned:",browserActionSpec);//WHY IS THIS UNDEFINED AAARGH

	for(let prop in browserActionSpec){
		let cmd={tabId:tabId};
		Object.assign(cmd,browserActionSpec[prop]);
		browser.browserAction['set'+prop](cmd);
	}
 },
 {
  types:['main_frame'],
  urls: ["<all_urls>"]
 }
);
