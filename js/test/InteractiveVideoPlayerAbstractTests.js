//BEGIN helper for html and karma usage
var path = '';
if (typeof window.__karma__ !== 'undefined') {
	path += 'base/' //used for fixtures in karma
}
else
{
	var $j = $; //used for event listeners in karma
}
jasmine.getFixtures().fixturesPath = path + 'spec/javascripts/fixtures';
//END helper for html and karma usage


describe("InteractiveVideoPlayerAbstract Tests", function() {

	describe("Function Tests", function () {
		beforeEach(function () {
			callHelper = {
				play: function () {
					called = true;
				},
				pause: function () {
					called = true;
				},
				setCurrentTime: function () {
					called = true;
				}
			};
			spyOn(callHelper, 'play');
			spyOn(callHelper, 'pause');
			spyOn(callHelper, 'setCurrentTime');

			il.InteractiveVideoPlayerAbstract.config = {
				pauseCallback           : (function (){callHelper.pause();}),
				playCallback            : (function (){callHelper.play();}),
				durationCallback        : (function (){return 90;}),
				currentTimeCallback     : (function (){return 5;}),
				setCurrentTimeCallback  : (function (time){callHelper.setCurrentTime(time);})
			};
		});

		afterEach(function () {
		});

		it("play video should be called", function () {
			expect(callHelper.play).not.toHaveBeenCalled();
			il.InteractiveVideoPlayerAbstract.play();
			expect(callHelper.play).toHaveBeenCalled();
		});

		it("play video should not be called", function () {
			il.InteractiveVideoPlayerAbstract.config.playCallback = null;
			il.InteractiveVideoPlayerAbstract.play();
			expect(callHelper.play).not.toHaveBeenCalled();
		});

		it("pause video should be called", function () {
			expect(callHelper.pause).not.toHaveBeenCalled();
			il.InteractiveVideoPlayerAbstract.pause();
			expect(callHelper.pause).toHaveBeenCalled();
		});

		it("pause video should not be called", function () {
			il.InteractiveVideoPlayerAbstract.config.pauseCallback = null;
			il.InteractiveVideoPlayerAbstract.pause();
			expect(callHelper.pause).not.toHaveBeenCalled();
		});

		it("setCurrentTime should be called", function () {
			expect(callHelper.setCurrentTime).not.toHaveBeenCalled();
			il.InteractiveVideoPlayerAbstract.setCurrentTime(2);
			expect(callHelper.setCurrentTime).toHaveBeenCalled();
		});

		it("setCurrentTime should not be called", function () {
			il.InteractiveVideoPlayerAbstract.config.setCurrentTimeCallback = null;
			il.InteractiveVideoPlayerAbstract.setCurrentTime(2);
			expect(callHelper.setCurrentTime).not.toHaveBeenCalled();
		});

		it("duration should return 90", function () {
			expect(il.InteractiveVideoPlayerAbstract.duration()).toEqual(90);
		});

		it("duration should not return 90", function () {
			il.InteractiveVideoPlayerAbstract.config.durationCallback = null;
			expect(il.InteractiveVideoPlayerAbstract.duration()).toEqual(-1);
		});

		it("currentTime should return 5", function () {
			expect(il.InteractiveVideoPlayerAbstract.currentTime()).toEqual(5);
		});

		it("currentTime should not return 5", function () {
			il.InteractiveVideoPlayerAbstract.config.currentTimeCallback = null;
			expect(il.InteractiveVideoPlayerAbstract.currentTime()).toEqual(-1);
		});

		it("resume video should resume if auto_resume is true", function () {
			il.InteractiveVideo.auto_resume = true;
			expect(callHelper.play).not.toHaveBeenCalled();
			il.InteractiveVideoPlayerAbstract.resumeVideo();
			expect(callHelper.play).toHaveBeenCalled();
		});

		it("resume video should not resume if auto_resume is false", function () {
			il.InteractiveVideo.auto_resume = false;
			il.InteractiveVideoPlayerAbstract.resumeVideo();
			expect(callHelper.play).not.toHaveBeenCalled();
		});

		it("jumpToTimeInVideo should activate player and jump to time", function () {
			il.InteractiveVideo.last_stopPoint = 0;
			expect(callHelper.play).not.toHaveBeenCalled();
			expect(callHelper.pause).not.toHaveBeenCalled();
			il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(2);
			expect(callHelper.play).toHaveBeenCalled();
			expect(callHelper.pause).toHaveBeenCalled();

			expect(il.InteractiveVideo.last_stopPoint).toEqual(2);
			il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(null);
			expect(il.InteractiveVideo.last_stopPoint).toEqual(2);
		});
	});
	
});