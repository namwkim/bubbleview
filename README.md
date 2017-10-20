# BubbleView: replacing eye-tracking to crowdsource image importance

Demo: http://massvis.mit.edu/bubbleview/

## Usage Description  
We briefly describe how to use the bubbleview code based on the demo. 

Add the necessary javascript files to your html file. 
```html
  <script src="js/stackblur.min.js"></script>
  <script src="js/nouislider.min.js"></script>
  <script src="js/diff.min.js"></script>
  <script src="js/bubbleview.js"></script>
```
[`nouislider.min.js`](https://refreshless.com/nouislider/) is used for the time slider and [`diff.min.js`](https://github.com/kpdecker/jsdiff) is used for tracking description changes. You don't need `diff.min.js` if your task does not invole image description. 

The `bubbleview.js` depends on [`stackblur.js`](http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html) a real-time image bluring library. We slightly modified its code as the original code forcibly changs the size of canvas to match the size of an input image. In our experiments, we did not use the stackblur library, instead pre-processed images to generate blurred images using a Gaussian blur filter using Matlab's `imfilter(image, H, 'replicate')` where `H` is `fspecial('gaussian', radius, radius)`.

The `bubbleview.js` exports two functions `setup(...)` and `monitor(...)` whose definitions are:
```javascript
  function setup(imgUrl, canvasID, bubbleR, blurR, task){
    ...
  }
  function monitor(imgUrl, canvasID, bubbleR, blurR, seeBubbles, seeOriginal, clicks, maxTime){
    ...
  }
```
`bubbleR` (bubble radius) and `blurR` (blur radius) are defined in pixels. `task` is an optional user-defined callback and it will be called whenever a user clicks on canvas to generate a bubble; each bubble (center, radius, timestamp etc) will be passed as a parameter to the callback.

`clicks` is an optional list of bubbles generated based on user clicks. `monitor()` expects its format to be the same as the one passed to the user callback; that is, an item in the list should have `cx`, `cy` and `timestamp`. `maxTime` is an optional timestamp limiting the number of bubbles drawn on the canvas (see the time slider in the demo). `monitor()` returns the total number of bubbles drawn given the `maxTime` option.

## Code for Launching Experiments
At this moment, we do not publicly release the code used for running our experiments on Amazon's Mechanical Turk. This code requires more complex development settings including a database, a web server, and scripts for automatically managing MTurk HITs. If you are interested in this code, please contact namwkim85@gmail.com.
