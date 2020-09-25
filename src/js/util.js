function getAsset(path){
	const assetURL = browser.runtime.getURL(path);
	const xhr = new XMLHttpRequest();
	xhr.open('GET',assetURL,false);
	xhr.send();
	if(intDiv(xhr.status,100) != 2) throw xhr;
	return xhr.response;
}

function removeFragment(url){
	//Removes the fragment from a URL
	let u=new URL(url);
	u.hash='';
	return u.toString();
}

function intDiv(a,b=100){
	//Functions as e.g. Python's integer division
	//Divides then casts directly to integer
	return a/b>>0;
}

function genBrowserActionSpec(secType,certChain){
	let rootHost,iconPath;
	switch(secType) {
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
	if( cert.fingerprint.sha256 in sha256fp_host || cert.fingerprint.sha256 in sha256fp_host_alt ) {
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

function applyBrowserActionSpec(propCmdDefaults={},browserActionSpec,extraCmds={}){
	//TODO: why does[?] Firefox not give us an atomic version of this function??
	for(let prop in browserActionSpec) {
		let cmd = Object.assign(new Object(),
		    propCmdDefaults,
		    browserActionSpec[prop]);
		browser.browserAction['set'+prop](cmd);
	}
	for(let cmd in extraCmds){
		browser.browserAction[cmd](extraCmds[cmd]);
	}
}

browser.runtime.onInstalled.addListener(
 function onInstalledListener(details){
	// Only pester the user if this is a fresh installation [1],
	// or at least a minor version bump [2].
	let openPathInTab = path=>browser.tabs.create({url:browser.runtime.getURL(path)});
	let curVersion = browser.runtime.getManifest().version;
	if( details.reason == "install" ) {
		//[1]
		openPathInTab('db/welcome/install.htm');
	} else {
		let curMinorVersion = curVersion.split('.').splice(0,2).join('.');
		let prevMinorVersion = details.previousVersion.split('.').splice(0,2).join('.');
		if( curMinorVersion != prevMinorVersion ) {
			//[2]
			//openPathInTab('db/welcome/update.htm');//TODO
		}
	}
 }
);

browser.browserAction.disable();//This should be greyed-out by default

