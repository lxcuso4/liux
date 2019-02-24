
var $window = $(window), gardenCtx, gardenCanvas, $garden, garden;
var clientWidth = $(window).width();
var clientHeight = $(window).height();
var dpi = window.window.devicePixelRatio || 1;
var offsetX,offsetY,side;
$(function () {
    // setup garden
	var $loveHeart = $("#loveHeart");
	side = $loveHeart.width();
    $loveHeart.height(side)
	offsetX = side*dpi/2;
	offsetY = side*dpi/2 - side*0.08*dpi;
    $garden = $("#garden");
    gardenCanvas = $garden[0];
	gardenCanvas.width = side*dpi;
    gardenCanvas.height = side*dpi - side*0.05*dpi;
    gardenCtx = gardenCanvas.getContext("2d");
    gardenCtx.globalCompositeOperation = "lighter";
    garden = new Garden(gardenCtx, gardenCanvas);
    // renderLoop
    setInterval(function () {
        garden.render();
    }, Garden.options.growSpeed);
    setTimeout(function () {
        startHeartAnimation();
    }, 500);
    $("#code").typewriter();
});

$(window).resize(function() {
    var newWidth = $(window).width();
    var newHeight = $(window).height();
    if (newWidth != clientWidth && newHeight != clientHeight) {
        location.reload();
    }
});

function getHeartPoint(angle) {
	var t = angle / Math.PI;
	var x = dpi*(side/39) * (16 * Math.pow(Math.sin(t), 3));
	var y = - dpi*(side/38) * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
	return new Array(offsetX + x, offsetY + y);
}

function startHeartAnimation() {
	var interval = 50;
	var angle = 10;
	var heart = new Array();
	var animationTimer = setInterval(function () {
		var bloom = getHeartPoint(angle);
		var draw = true;
		for (var i = 0; i < heart.length; i++) {
			var p = heart[i];
			var distance = Math.sqrt(Math.pow(p[0] - bloom[0], 2) + Math.pow(p[1] - bloom[1], 2));
			if (distance < Garden.options.bloomRadius.max * 1.3) {
				draw = false;
				break;
			}
		}
		if (draw) {
			heart.push(bloom);
			garden.createRandomBloom(bloom[0], bloom[1]);
		}
		if (angle >= 30) {
			clearInterval(animationTimer);
			showMessages();
		} else {
			angle += 0.2;
		}
	}, interval);
}

(function($) {
	$.fn.typewriter = function() {
		this.css('opacity',1)
		this.each(function() {
			var $ele = $(this), str = $ele.html(), progress = 0;
			$ele.html('');
			var timer = setInterval(function() {
				var current = str.substr(progress, 1);
				if (current == '<') {
					progress = str.indexOf('>', progress) + 1;
				} else {
					progress++;
				}
				$ele.html(str.substring(0, progress) + (progress & 1 ? '_' : ''));
				if (progress >= str.length) {
					clearInterval(timer);
				}
			}, 30);
		});
		return this;
	};
})(jQuery);

function showMessages() {
	$('#messages').fadeIn(5000, function() {
		showLoveU();
	});
}

function showLoveU() {
	setTimeout(function() {
    $('#loveu').css("visibility","visible")
  },2000)
}