# JwvGettingStarted

Steps in this **final** commit of tutorial-000:

* Set up a structure, where we will have separate tutorials in each subdirectory. Additionally, split up the client and server code
* Create the corresponding pom.xml files  
* set up a very simple server

To see if this is working choose either of the following 2 ways:

a) IDE
* run the ``build``, then the ``start`` script in the client module
* run the ``JadiceWebViewerApplication`` app in the server module

b) manually / on console
* run ```npm run build``` in the ```tutorial-000/client``` directory to build the client
* run ```npm run start``` in the ```tutorial-000/client``` directory to run the client
* run ```mvn clean package ``` in the main directory to build the server
* run ``java -jar jwv-tutorial-000-<jwv-version>.jar``, where ``<jwv-version>`` needs to be substituted by the version defined in the pom.xml

Either way, you should see the message ``Hello world. Redirecting to localhost:8080 in 5 seconds.`` when navigating to the angular frontend on ``http://localhost:4200``

After the 5 seconds mentioned in this message, angular will redirect you to the java backend address ```http://localhost:8080``` where you should 
see the standard spring boot whitelabel Error Page, that should say something like this:

```
Whitelabel Error Page
This application has no explicit mapping for /error, so you are seeing this as a fallback.

Fri Oct 06 11:30:28 CEST 2023
There was an unexpected error (type=Not Found, status=404).
```

So far we have only used standard angular, typescript, java and maven tools. In tutorial 001 we will then proceed to start 
using the jadice web viewer dependencies to display a document.
