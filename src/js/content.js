var myRootCerts=new Set();

function onHeadersReceived(details,securityInfo){
	if(
	    securityInfo
	 && securityInfo.certificates
	 && securityInfo.certificates.length
	) {
		rootCert=securityInfo.certificates[securityInfo.certificates.length-1];
		console.log("Adding",rootCert);
		myRootCerts.add(rootCert.fingerprint.sha256);
		console.log("Added!",myRootCerts);
	} else {
		console.log("This page has a bad connection...");
		myRootCerts.add(null);
	}
}

function onCompleted(details){
	let browserActionSpec=new Object();

	try {
	 console.log(myRootCerts);
	 if(myRootCerts.size!=1) throw myRootCerts;

	 for(let rootCert of myRootCerts){
//		if(!rootCert.isBuiltInRoot) throw rootCert;

//		fp=rootCert.fingerprint.sha256;
//		if(!fp) throw rootCert.fingerprint.sha256;

		rootHost=sha256fp_host[rootCert];
		if(!rootHost) throw fp;

		browserActionSpec.Icon={path:`images/root_icons/${rootHost}.ico`};
		browserActionSpec.BadgeText={text:""};
		browserActionSpec.Title={text:rootHost};
	 }
	} catch(e) {
		//TODO: more edge cases here (self-signed, etc.)
		if(myRootCerts.size==0) myRootCerts.add(null);
		for(let rootCert of myRootCerts){
			console.warn('Unknown root CA',rootCert);
		}
		browserActionSpec.Icon={path:"images/Twemoji12_26a0.svg"};
		browserActionSpec.BadgeText={text:"!"};
		browserActionSpec.BadgeBackgroundColor={color:"red"};
		browserActionSpec.Title={text:JSON.stringify(e)};
	}

	console.log(browserActionSpec);
	return browserActionSpec;
}

browser.runtime.onMessage.addListener(
 (message) => {
  if('onHeadersReceived' in message) {
	let details=message.onHeadersReceived.details;
	let securityInfo=message.securityInfo;
	return onHeadersReceived(details,securityInfo);
  } if('onCompleted' in message) {
	let details=message.onCompleted.details;
	let browserActionSpec=onCompleted(details);
	console.log("Returning:",browserActionSpec);
	return browserActionSpec;//WHY ISN'T THIS SHOWING UP ON THE OTHER SIDE AAARGH
  } else {
	return false;
  }
 }
);

