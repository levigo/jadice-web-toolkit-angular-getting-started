# JwvGettingStarted

## general structure of this tutorial ##
If you want to just use the latest commit as is, you are very welcome to do so :)

However, if you search for a step-by-step tutorial, we structured this git project 
so that every commit adds some more functionality so hopefully if you look at the 
git commit history, each step is more digestible than the entire project. 

the commits in the next chapter "commit history" are ordered from top to bottom from the most recent 
to the least recent time of the commit. If you want to set up your angular project on your own, 
you can skip e.g. the most bottom 4 commits as they only explain exactly that without making any use of 
the jadice web viewer. Those oldest 4 commits also contribute to the Tutorial 000, while the more recent
commits contribute to the "real beef" in tutorial 001. 

So at the end of tutorial 000, we will only have a dummy website talking to a dummy server.
At the end of tutorial 001, we will have a running jadice web viewer demo that is able to render documents
and that has many features like thumbnails, printing and annotations.



## the current commit: ##
### Step 1 of 2: upgraded versions once again ###
* manually upgrade the previous jadice web viewer version in the pom.xml and package.json files
* run ```npm install``` so that the changes are applied also to the package-lock.json
* weave in the dependabot pull request
* run a ```npm audit fix``` to apply further security fixes
* # JwvGettingStarted

### Step 2 of 2: the real thing ###
Steps in this commit: replace the dummy frontend with a simple viewer version
After checking out this commit, please build both client and server and then run them.
You will now see a viewer when openening ``localhost:4200``, that can now display documents, once you upload a document via the ``open file``file button in the upper left corner.
This is done by the two jadice web viewer components included in the ``app.component.html`` file. The necessary wiring of those and releated code is found in the ``app.component.ts``
Inside the main.ts, we bootstrap the precursor which will serve as a layer between angular and GWT.

### previous commits: ###
please check the README.md of that specific commit


## how to run this commit ##
see the previous commit "install all necessary dependencies for the client" for how to start the client.

You also need to run the backend:
tutorial-001/server/src/main/java/org/jadice/jwv/tutorial/JadiceWebViewerApplication001.java
(ensure that your classpath is set correctly there to the jwv-tutorial-001 server directory)
