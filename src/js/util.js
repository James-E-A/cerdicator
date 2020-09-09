function getAsset(path){
	const assetURL = browser.runtime.getURL(path);
	const xhr = new XMLHttpRequest();
	xhr.open('GET',assetURL,false);
	xhr.send();
	return xhr.response;
}

function genBrowserActionSpec(secType,certChain){
	let rootHost,iconPath;
	switch(secType){
	 case secTypes.Mozilla:
		rootHost=sha256fp_host[certChain[certChain.length-1].fingerprint.sha256];
		return {
			Icon: {path: `images/root_icons/${rootHost}.ico`},
			Title: {title: `${rootHost}\n(Mozilla-trusted Root CA)`},
			BadgeText: {text: '\uD83E\uDD8A'},
			BadgeBackgroundColor: {color: 'LimeGreen'}
		};
	 break;
	 case secTypes.MITM:
		return {
			Icon: {path: `images/Twemoji_1f441.svg`},
			Title: {title: "MitM TLS Proxy\n(Your network administrator is inspecting this connection.)"},
			BadgeText: {text: '\u2139\uFE0F'},
			BadgeBackgroundColor: {color: 'Fuchsia'}
		};
	 break;
	 case secTypes.aRootKnown:
		rootHost=sha256fp_host_alt[certChain[certChain.length-1].fingerprint.sha256];
		return {
			Icon: {path: `images/alt_root_icons/${rootHost}.ico`},
			Title: {title: `${rootHost}\n(Alternative Root CA)`},
			BadgeText: {text: rootHost[0].toUpperCase()}, //TODO
			BadgeBackgroundColor: {color: 'Teal'}
		};
	 break;
	 case secTypes.aRootUnknown:
		return {
			//TODO: better support for these?
			Icon: {path: 'images/Twemoji_1f50f.svg'},
			Title: {title: `I've\u2026never heard of this Root CA before.\n\nIts fingerprint is:\n${certChain[certChain.length-1].fingerprint.sha256}`},
			BadgeText: {text: '\u24D8\uFE0F'},
			BadgeBackgroundColor: {color: 'Cyan'}
		};
	 break;
	 case secTypes.indeterminate:
		return {} //TODO???
	 break;
	 default:
		return {
			Icon: {path: 'images/Twemoji_26a0.svg'}, //TODO: is this too dramatic?
			Title: {title: "Unsecure connection."},
			BadgeText: {text: '\u274C'},
			BadgeBackgroundColor: {color: 'Grey'}
		};
	}
}

function updateBrowserAction(tabId,browserActionSpec){
	//TODO: why does Firefox not give us an atomic version of this function??
	let cmdDefaults={};
	if(tabId!=-1) cmdDefaults.tabId=tabId;
	for(let prop in browserActionSpec){
		//consider parallelizing this loop to mitigate possible race condition meanwhile
		let cmd=Object.assign(new Object(),
		    cmdDefaults,
		    browserActionSpec[prop]);
		browser.browserAction['set'+prop](cmd);
	}
}

browser.runtime.onInstalled.addListener(
 function onInstalledListener(details){
	if(!details.temporary) browser.tabs.create({url:'https://github.com/JamesTheAwesomeDude/cerdicator/blob/v0.0.7/stuff/welcome.rst'});
 }
);
