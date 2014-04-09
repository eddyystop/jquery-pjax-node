# [jquery-pjax-node] (https://github.com/eddyystop/jquery-pjax-node)

A micro framework and boilerplate for a Node.js server handling PJAX requests.

Several runnable, increasingly complex mini-apps will guide you through using
[jquery-pjax] (https://github.com/defunkt/jquery-pjax)
and
[jquery-pjax-toolkit] (https://github.com/eddyystop/jquery-pjax-toolkit)
on the client with
[Node.js] (http://nodejs.org/)
and
[Express 3] (http://expressjs.com/)
on the server.

Mini-app walk throughs:
- [A robust PJAX server] (#mini-app-1)

## Why use PJAX?
**Exhibit 1** Github [likes and uses it]
(https://github.com/blog/831-issues-2-0-the-next-generation).

```
PJAX: Next generation partial page loads

Every link in Issues 2.0 works as you'd expect any link on the internet to work
(open in a new tab, copy & pastable URL) — but you'll still get an insanely
responsive interface (reminiscent of old-school AJAX interfaces).
This is thanks to PJAX — something we've been using more and more
throughout the site.
```

**Exhibit 2** [Basecamp] (http://basecamp.com) has helped over 285,000 companies
finish over 2,000,000 projects with a ["damn fast"]
(http://signalvnoise.com/posts/3112-how-basecamp-next-got-to-be-so-damn-fast-without-using-much-client-side-ui)
project management service based on PJAX.

## How to install
```sh
clone or download a zip file from https://github.com/eddyystop/jquery-pjax-node.
```

## Technology stack
The mini-apps use the following technology stack:
- [jquery-pjax] (https://github.com/defunkt/jquery-pjax)
provides the basic PJAX foundation on the client.
- [jquery-pjax-toolkit] (https://github.com/eddyystop/jquery-pjax-toolkit)
provides a mini-framework on the client that makes jquery-pjax easier to
work with.
- [Node.js] (http://nodejs.org/) provides an async JavaScript server.
- [Express 3] (http://expressjs.com/) provides a full featured HTTP server
for Node.
- [hackathon-starter] (https://github.com/sahat/hackathon-starter)
provides a good boilerplate for a Node+Express server.
It provides proven basic features
and comes with oAuth 2.0 Authentication for a wide number of services.
- This repo provides a mini-framework for Node which makes it easy to serve
PJAX requests from jquery-pjax and jquery-pjax-toolkit.
- [ejs] (https://github.com/visionmedia/ejs) is the template engine used.
Changing to another template engine is straight forward.

We have made some changes to hackathon-starter to focus the mini-apps on PJAX:
- We have removed all authentication.
- We have removed csrf checking
so the simplest mini-app is easier to understand.
- We have removed MongoDB as we don't use a DB.
- We have changed the render engine from jade to ejs.
- We use Foundation 5 and Abide rather than Bootstrap,
so we can illustrate simple client side validation in the simplest mini-app.

Please read about the
[prerequisites] (https://github.com/sahat/hackathon-starter/blob/master/README.md#prerequisites).
Note we don't use MongoDB.

## Starting the server
You can start the server with:
```
# switch to the repo directory
cd path/to/jquery-pjax-node

# install dependencies (npm is installed with Node.js)
npm install

# start server
node app.js

# a message on the node console will say its listening to port 3000.
```
You can start the mini-apps by pointing the browser to:
```
localhost:3000/ex1
or
localhost:3000/ex2 (available soon)
```


***


### <a name="mini-app-1"></a>Mini-app #1 (/ex1)

Walk through coming soon.


### jquery-pjax
IMHO opinion MV* and SPA designs are overkill for the majority of web sites,
as well as for the minimum viable product implementation of many startup ideas.

[jquery-pjax] (https://github.com/defunkt/jquery-pjax),
used in portions of github.com, supports a very simple,
viable design with a great performance profile if:
 - Displayed data does not have to change in real time e.g. no push is needed.
 - You do not display **lots** of data
 of which only small amounts change at any time, e.g. calendars.

[This article] (http://signalvnoise.com/posts/3112-how-basecamp-next-got-to-be-so-damn-fast-without-using-much-client-side-ui)
describes how [Basecamp] (http://basecamp.com),
a web application with high load and fast performance requirements,
uses a PJAX design (though not jquery-pjax) to achieve its goals.

jquery-pjax-toolkit's aim is to provide much of the client side tools needed
to achieve similar benefits for our projects.

### License
Copyright (c) 2014 Sahat Yalkabov
Distributed under the MIT license. See LICENSE.md for details.

Copyright (c) 2014 John Szwaronek (<johnsz9999@gmail.com>).
Distributed under the MIT license. See LICENSE.md for details.