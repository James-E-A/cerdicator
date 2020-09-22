function getAsset(path){
	const assetURL = browser.runtime.getURL(path);
	const xhr = new XMLHttpRequest();
	xhr.open('GET',assetURL,false);
	xhr.send();
	if(xhr.status/100|0 != 2) throw xhr;
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
	 case secTypes.MitM:
		return {
			Icon: {path: `images/Twemoji_1f441.svg`},
			Title: {title: "MitM TLS Proxy\n(Your network administrator is inspecting this connection.)"},
			BadgeText: {text: '\u2013'},
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
	 case secTypes.insecure:
		return {
			Icon: {path: 'images/Twemoji_26a0.svg'},
			Title: {title: "Unsecure connection."},
			BadgeText: {text: '\u2013'},
			BadgeBackgroundColor: {color: 'Grey'}
		}
	 break;
	 default:
		return {
			Icon: {path: 'images/Twemoji_2753.svg'},
			Title: {title: "Could not get security info."},
			BadgeText: {text: '\u274C'},
			BadgeBackgroundColor: {color: 'DarkCyan'}
		};
	}
}

function isItMitM(cert){
	//TODO check with the user about this
	if(cert.fingerprint.sha256 in sha256fp_host || cert.fingerprint.sha256 in sha256fp_host_alt){
		//The cert was in EITHER database
		//therefore it is legitimate,
		//i.e. NOT a MitM:
		return false;
	} else {
		//The cert was in NEITHER database
		//therefore it IS a MitM:
		return true;
	}
}

function updateBrowserAction(tabId,browserActionSpec){
	//TODO: why does[?] Firefox not give us an atomic version of this function??
	let cmdDefaults={};
	if(tabId!=-1) cmdDefaults.tabId=tabId;
	for(let prop in browserActionSpec){
		let cmd=Object.assign(new Object(),
		    cmdDefaults,
		    browserActionSpec[prop]);
		browser.browserAction['set'+prop](cmd);
	}
	return;
}

browser.runtime.onInstalled.addListener(
 function onInstalledListener(details){
	// Only pester the user if this is a fresh installation [1],
	// or at least a minor version bump [2].
	let curVersion=browser.runtime.getManifest().version;
	if( details.reason=="install" ){
		//[1]
		browser.tabs.create({url:`https://github.com/JamesTheAwesomeDude/cerdicator/blob/v${curVersion}/stuff/welcome.rst`});
	} else {
		let curMinorVersion=curVersion.split('.').splice(0,2).join('.');
		let prevMinorVersion=details.previousVersion.split('.').splice(0,2).join('.');
		if( curMinorVersion!=prevMinorVersion ){
			//[2]
			browser.tabs.create({url:`https://github.com/JamesTheAwesomeDude/cerdicator/blob/v${curVersion}/stuff/welcome.rst`});
		}
	}
 }
);
