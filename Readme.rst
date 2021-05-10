**[Alpha Release, testers only!]**

What It Does
############

This software enhances the display of TLS connections by displaying at-a-glance the Root Certificate Authority that your browser trusts to certify the connection.

Future releases will include country-of-jurisdiction display, enhanced and user-friendly certificate pinning, Intermediate Certificate Authority display, and **other requested features** (submit your ideas `here <https://github.com/JamesTheAwesomeDude/cerdicator/issues>`_!).

For maximum effectiveness, replace the blank, empty spacer that exists OOTB in Firefox between your URL bar and the navigation buttons with this add-on's badge. (Chrome support pending on `CH\#1187713 <https://bugs.chromium.org/p/chromium/issues/detail?id=1187713>`_.)


Why It Exists
#############

Context
=======

https://archive.is/o/www.wired.com/2010/03/packet-forensics/#selection-2513.25-2513.243

https://www.eff.org/observatory#:~:text=650-odd%20organizations%20that%20function%20as%20Certificate%20Authorities%20trusted%20%29directly%20or%20indirectly%28%20by%20Mozilla%20or%20Microsoft.

According to tech blogger `Ryan Singel`_, writing for *Wired* magazine in 2010, privacy researcher `Christopher Soghoian`_ found a brochure at a wiretapping conference in which `Packet Forensics, LLC`_ advertised a device that [emphasis added]:

  “[Gives users] the ability to… generate **‘look-alike’ [SSL] keys** designed to give the subject a **false sense of confidence in its authenticity**”

When the editors tried to reach out to Packet Forensics about this, their spokesman, Ray Saulino, allegedly (and hilariously):

  initially denied the product performed as advertised, or that anyone used it

then added that

  “…there is nothing special or unique about it… Our target community is the law enforcement community.”

Today
=====

I intend to follow in the footsteps of the paper (linked in the appendix below) which Dr. Soghoian wrote alongside Dr. `Sid Stamm`_ analyzing the threat models presented by this device, and in particular intend to write the spiritual successor to their software introduced therein, `CertLock`_.

In particular, this software will be written under the following assumptions:

(1) Mr. Saulino is lying through his teeth here *(presumably under NDA)*

(2) Both Mr. Singel and Dr. Soghoian are being truthful in their reports

(3) The brochure acquired at the conference was both genuine (actually published by Packet Forensics) and truthful (the product it advertises performs as claimed)

I reached out to both Wired and Dr. Soghoian on May 8th, 2021 to see about getting a copy of the brochure, which I could not find online; I will update this document when or if I hear back. (In retrospect, I probably should have CC'd Ryan Singel, too…)

.. _`Ryan Singel`: http://ryansingel.net/
.. _`Christopher Soghoian`: https://www.dubfire.net/
.. _`Packet Forensics, LLC`: https://www.packetforensics.com/
.. _`Sid Stamm`: https://sidstamm.com/
.. _`CertLock`: https://code.google.com/archive/p/certlock/source/default/source

.. image:: https://i.imgflip.com/58y0io.jpg


Quacking Crazy PDFs
###################

First-Order Related to this problem
===================================

* https://www.linuxglobal.com/static/blog/ssl-mitm.pdf
* https://www.eff.org/files/defconssliverse.pdf (Search for “Number of trusted certificate signers” - wow!)
