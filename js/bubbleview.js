var bv = (function() {
  var BUBBLE_RADIUS = 30;
  var BLUR_SIGMA = 30;
  var VIEW_TIME = 10;
  var userTask = null;
  var image = null;
  var canvas = null;
  function CalcNewImageSize(imgWidth, imgHeight, canvasWidth, canvasHeight) {
      var ratio = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);//Math.min(, 1.0);
      if (ratio > 1.0) {
          ratio = 1.0;
      }
      return {
          width: imgWidth * ratio,
          height: imgHeight * ratio
      };
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
      StackBlur.image(image, newSize.width, newSize.height, canvas, 20, true);

      //draw the circle
      ctx.beginPath();
      ctx.arc(x, y, BUBBLE_RADIUS, 0, 6.28, false);
      ctx.clip();
      ctx.drawImage(image, 0, 0, newSize.width, newSize.height);


      ctx.arc(x, y, BUBBLE_RADIUS, 0, 2 * Math.PI, false);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ff0000';
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      userTask.call(e, {
          image: image,
          x: x,
          y: y,
          radius: BUBBLE_RADIUS
      });
  }
  function setup(imgUrl, canvasID, task) {
      userTask = task;
      canvas = document.getElementById(canvasID);
      image = new Image();
      image.onload = function() {
        canvas.removeEventListener('click', OnClickDrawMask);
        canvas.addEventListener('click', OnClickDrawMask);

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var newSize = CalcNewImageSize(this.naturalWidth, this.naturalHeight, canvas.width, canvas.height);
        image.style.width = newSize.width;
        image.style.height = newSize.height;

        StackBlur.image(image, newSize.width, newSize.height, canvas, 20, true);
      }
      image.src = imgUrl;
  }
  return { // public interface
    setup: setup
  };
})();
