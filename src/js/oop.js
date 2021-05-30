class SecurityDetails {
	constructor(requestDetails,securityInfo) {
		this.securityInfo = securityInfo;
		this.requestDetails = requestDetails;

		Object.freeze(this.securityInfo);
		Object.freeze(this.requestDetails);

		//lazily-evaluated:
		this._secType=undefined;
		this._caId=undefined;
	}

	get secType() {
		if( this._secType === undefined ) {
			this._secType = SecurityDetails.identifySecType(this.securityInfo);
		}
		return this._secType;
	}

	get caId() {
		if( this._caId === undefined ) {
			this._caId = SecurityDetails.identifyCaId(this.securityInfo);
		}
		return this._caId;
	}

	static identifySecType(securityInfo){
		//Takes in a browser.webRequest.getSecurityInfo object
		//and returns an integer from secTypes corresponding to the 
		try {
			switch(securityInfo.state) {
			 case 'insecure':
				//genuinely not HTTPS

				return secTypes.insecure;

			 case 'secure':
				// ANY HTTPS-secured connection //

				const certChain=securityInfo.certificates;

				//If it's length-0 -OR- somehow undefined/null/etc
				if(!( certChain.length >= 1 )) {
					//TODO/FIXME: Mozilla doesn't provide
					//any access whatsoever to self-signed
					//or otherwise nominally-invalid certs
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1678492
					return secTypes.unknown;
				} else if( certChain.length == 1 ) {
					
					return secTypes.selfSigned;
				}

				const rootCert = certChain[certChain.length-1];

				//Now, this connection is...
				if(rootCert.isBuiltInRoot){
					//...Mozilla-supported
					return secTypes.Mozilla;
				}

				if(!securityInfo.isUntrusted){//why didn't they use .isTrusted lol
					//...supported by a Non-Mozilla cert,...
					if(isItMitM(rootCert)){ //TODO
						//...a TLS MITM proxy
						return secTypes.MitM;
					} else {
						//...an alternative Root CA
						if(fp_host_alt.has(rootCert.fingerprint[fp_alg])) {
							return secTypes.aRootKnown;
						} else {
							return secTypes.aRootUnknown;
						}
					}
				}
			 default:
				throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
			}
		} catch(e) {
			console.error(e.status||e,{securityInfo:securityInfo});
			return secTypes.unknown;
		}
	}

	static identifyCaId(securityInfo) {
		try {
			const certChain = securityInfo.certificates;
			if( ! certChain.length ) {
				return null;
			} else if( certChain.length == 1 ) {
				return 'self';
			} else {
				const rootCert = certChain[certChain.length-1];
				const fp = rootCert.fingerprint[fp_alg];
				if( fp_host.has(fp) ){
					return fp_host.get(fp);
				} else if( fp_host_alt.has(fp) ){
					return fp_host_alt.get(fp);
				} else {
					console.warn('Unknown CA',certChain);
					return fp;
				}
			}
			throw {status:'thisShouldNeverHappen',securityInfo:securityInfo};
		} catch(e) {
			console.error(e.status||e,{securityInfo:securityInfo});
			return null;
		}
	}
}
