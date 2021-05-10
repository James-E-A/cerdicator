**[Alpha Release, testers only!]**

What It Does
############

This software enhances the display of TLS connections by displaying at-a-glance the Root Certificate Authority that your browser trusts to certify the connection.

Future releases will include country-of-jurisdiction display, enhanced and user-friendly certificate pinning, Intermediate Certificate Authority display, and **other requested features** (submit your ideas `here <https://github.com/JamesTheAwesomeDude/cerdicator/issues>`_!).

For maximum effectiveness, replace the blank, empty spacer that exists OOTB in Firefox between your URL bar and the navigation buttons with this add-on's badge. (Chrome support pending on `CH\#1187713 <https://bugs.chromium.org/p/chromium/issues/detail?id=1187713>`_.)

Why It Exists
#############

https://archive.is/o/www.wired.com/2010/03/packet-forensics/#selection-2513.25-2513.243

According to tech blogger `Ryan Singel`_, writing for *Wired* magazine in 2010, privacy researcher `Christopher Soghoian`_ found a brochure at a wiretapping conference in which `Packet Forensics, LLC`_ advertised a device that [all emphasis added]:

  [Gives users] the ability to… generate **‘look-alike’ [SSL] keys** designed to give the subject a **false sense of confidence in its authenticity**

When the editors tried to reach out to Packet Forensics about this, their spokesman, Ray Saulino, allegedly (and hilariously):

  initially **denied the product performed as advertised**, or that anyone used it

then added that

  …there is **nothing special or unique about it**… Our target community is the law enforcement community.

This software is written under the assumption that Mr. Saulino is lying through his teeth here (presumably under NDA), that both Mr. Singel and Dr. Soghoian are being truthful in their reports, and that the brochure acquired at the conference was both genuine (published by Packet Forensics) and truthful (not false-advertising).

.. _`Ryan Singel`: http://ryansingel.net/
.. _`Christopher Soghoian`: https://www.dubfire.net/
.. _`Packet Forensics, LLC`: https://www.packetforensics.com/


Quacking Crazy PDFs
###################

Direct Ones
===========

* https://www.linuxglobal.com/static/blog/ssl-mitm.pdf (After reading this, I realized I've set out to create the spiritual successor to CertLock)
* https://www.eff.org/files/defconssliverse.pdf (Search for “Number of trusted certificate signers” - wow!)
