var bv = (function() {
  var _bubbleR = 30;
  var _blurR = 30;
  var VIEW_TIME = 10;
  var userTask = null;
  var image = null;
  var canvas = null;

  function CalcNewImageSize(imgWidth, imgHeight, canvasWidth, canvasHeight) {
    var ratio = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight); //Math.min(, 1.0);
    if (ratio > 1.0) {
      ratio = 1.0;
    }
    return {
      width: imgWidth * ratio,
      height: imgHeight * ratio
    };
  }

  function DrawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined") {
      stroke = true;
    }
    if (typeof radius === "undefined") {
      radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) {
      ctx.stroke();
    }
    if (fill) {
      ctx.fill();
    }
  }

  function OnClickDrawMask(e) {
    var ctx = canvas.getContext('2d');

    ctx.save();

    var rect = canvas.getBoundingClientRect();

    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    console.log("x, y = " + x + ", " + y);
    //reset previous cicle
    var newSize = CalcNewImageSize(image.naturalWidth, image.naturalHeight, canvas.width, canvas.height);
    StackBlur.image(image, newSize.width, newSize.height, canvas, _blurR, true);

    //draw the circle
    ctx.beginPath();
    ctx.arc(x, y, _bubbleR, 0, 6.28, false);
    ctx.clip();
    ctx.drawImage(image, 0, 0, newSize.width, newSize.height);


    ctx.arc(x, y, _bubbleR, 0, 2 * Math.PI, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    if (userTask) {
      userTask.call(e, {
        image: image,
        timestamp: (new Date).getTime(),
        cx: x,
        cy: y,
        radius: _bubbleR,
        blur: _blurR
      });
    }

  }

  function setup(imgUrl, canvasID, bubbleR, blurR, task) {
    userTask = task;
    canvas = document.getElementById(canvasID);
    image = new Image();
    var bubbleR = parseInt(bubbleR);
    if (isNaN(bubbleR) || bubbleR <= 0) {
      return;
    }
    _bubbleR = bubbleR;
    var blurR = parseInt(blurR);
    if (isNaN(blurR) || blurR <= 0) {
      return;
    }
    _blurR = blurR;
    image.onload = function() {
      canvas.removeEventListener('click', OnClickDrawMask);
      canvas.addEventListener('click', OnClickDrawMask);

      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var newSize = CalcNewImageSize(this.naturalWidth, this.naturalHeight, canvas.width, canvas.height);
      // image.style.width = newSize.width;
      // image.style.height = newSize.height;

      StackBlur.image(image, newSize.width, newSize.height, canvas, _blurR, true);
    }
    image.src = imgUrl;
  }

  // assume that the task was completed  at least within an hour.
  function monitor(imgUrl, canvasID, bubbleR, blurR, seeBubbles, seeOriginal,
    clicks, maxTime) {
    var canvas = document.getElementById(canvasID); // not using global variable
    var image = new Image();

    var bubbles = [];
    if (clicks && clicks.length>0){
      // filter bubbles by the time span
      clicks = clicks.slice();
      clicks.sort(function(a, b) { //sort time by descending
        return a.timestamp - b.timestamp;
      });
      for (var i = 0; i < clicks.length; i++) {
        var click = clicks[i];
        var time = new Date(parseInt(clicks[i].timestamp));
        if (maxTime && maxTime < time.getTime()) {
          break;
        }
        bubbles.push(click);
      }
    }
    // console.log('bubbles');
    // console.log(bubbles);
    image.onload = function() {

      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw image or blurred image
      var newSize = CalcNewImageSize(this.naturalWidth, this.naturalHeight, canvas.width, canvas.height);
      if (seeOriginal) {
        ctx.drawImage(image, 0, 0, newSize.width, newSize.height);
      } else {
        StackBlur.image(image, newSize.width, newSize.height, canvas, blurR, true);
      }
      if (!seeBubbles || !clicks || clicks.length<=0) {
        return;
      }
      // console.log('draw bubbles');
      // draw bubbles
      ctx.save();
      ctx.globalAlpha = 0.2;
      prev_x = null, prev_y = null;
      for (var i = 0; i < bubbles.length; i++) {
        var bubble = bubbles[i]
        var time = new Date(parseInt(bubble.timestamp)- parseInt(bubbles[0].timestamp));
        ctx.beginPath();
        ctx.arc(bubble.cx, bubble.cy, bubbleR, 0, 6.28, false);
        ctx.fillStyle = "red";
        ctx.fill();

        if (prev_x && prev_y) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(prev_x, prev_y);
          ctx.lineTo(bubble.cx, bubble.cy);
          ctx.strokeStyle = "green";
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "green"
        DrawRoundRect(ctx, parseFloat(bubble.cx), parseFloat(bubble.cy), 25, 12, 5, true, false);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.font = "10px Georgia";
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "white";

        ctx.fillText(time.getMinutes() + ":" + time.getSeconds(), bubble.cx, parseFloat(bubble.cy) + 8);
        ctx.restore();

        prev_x = bubble.cx;
        prev_y = bubble.cy;

      }
      ctx.restore();

    }
    image.src = imgUrl;
    return bubbles.length;

  }
  return { // public interface
    setup: setup,
    monitor: monitor
  };
})();
