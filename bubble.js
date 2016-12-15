var bv = (function() {
  var BUBBLE_RADIUS = 30;
  var BLUR_SIGMA = 30;
  var VIEW_TIME = 10;
  var userTask = null;
  var image = null;
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
  return { // public interface
    SetupImage: function (imgUrl, blurImgUrl, canvasID, task) {
        userTask = task;

        image = new Image();
        image.onload = function() {
          // draw blurred image first
          //console.log($(curBlurImg).width() + ", " + console.log($(curBlurImg).height()));
          var canvas = document.getElementById(canvasID);
          canvas.off('click');
          canvas.addEventListener('click', {
              width: this.naturalWidth,
              height: this.naturalHeight
          }, OnClickDrawMask);
          var ctx = canvas[0].getContext('2d');
          ctx.clearRect(0, 0, canvas.width(), canvas.height());
          var newSize = CalcNewImageSize(this.naturalWidth, this.naturalHeight, canvas.width(), canvas.height());
          StackBlur.image(curImg, , 20, true);
          ctx.drawImage(curBlurImg, 0, 0, newSize.width, newSize.height);
        }
        image.src = imgUrl;
    },
    OnClickDrawMask: function (e) {
        var canvas = $("#canvas");
        var ctx = canvas[0].getContext('2d');

        ctx.save();

        var rect = canvas[0].getBoundingClientRect();

        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        console.log("x, y = " + x + ", " + y);
        //reset previous cicle
        var newSize = CalcNewImageSize(e.data.width, e.data.height, canvas.width(), canvas.height());
        console.log(newSize);
        ctx.drawImage(curBlurImg, 0, 0, newSize.width, newSize.height);

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
        })
        clickCount++;
        $("#click-count").text(clickCount);
    }
  };
})();
