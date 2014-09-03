// Page parameters
var gsOriginalQuery = '{$q}'.replace(/\s+/g,'+').replace(/"/g,"%23");
var gsQuery = []; //TODO Translate original query into an array
var giThreshold = '{$threshold}'; if ((giThreshold == '') || (giThreshold[0] == '{')) giThreshold = 5;
var giTweetCount = '{$tweetcount}'; if ((giTweetCount == '') || (giTweetCount[0] == '{')) giTweetCount = 40;
var goFeedResult;
var gsCustomTransform = "{$custom}"; if (gsCustomTransform[0] == '{') gsCustomTransform = '';

// ----------------------------------------------------------------------------------------------------

function processText(s) {
	s = s.toLowerCase();
	s = s.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g,' '); // remove URLs
	s = s.replace(/&amp;apos;/,'\'');
	s = s.replace(/n\'t\b/g,' ');
	s = s.replace(/\'s\b/g,' ');
	s = s.replace(/s\'\b/g,' ');
	s = s.replace(/[.,\/]/g,' '); // replace certain punctuation with spaces
	s = s.replace(/\W\W+/g,' '); // coalesce white space and punctuation
	//s = s.replace(/\b\w\w?\b/g,' '); // remove 1- and 2- letter words
	return(s);
}

function processWord(pTransforms,pWord) {
	if (pWord.length <= 2) return '';
	_.each(pTransforms, function(tr) { pWord = pWord.replace(pFilter.exp,tr.rep); } );
	return pWord;
}

function initializeFromTwitter()
{/*
    $("#query").html(gsQuery);
    $("#content").html("Loading...");
    var url;
    if (gsQuery.match(/[/]/))
    {
     var a = gsQuery.split(/[/]/);
     url = 'http://api.twitter.com/1/'+a[0]+'/lists/'+a[1]+'/statuses.atom?per_page=100';
    }
    else
    {
     var currentDate = new Date();
     url = "http://search.twitter.com/search.atom?q="+gsQuery+"+-rt+-"+currentDate.getTime()+"&rpp=100&result_type=recent"
    }

    var feed = new google.feeds.Feed(url);
    feed.includeHistoricalEntries();
    feed.setNumEntries(100);
    feed.load(processFeed);
*/}

// ----------------------------------------------------------------------------------------------------
// Angular implementation.

var app = angular.module('tweetcloud', ['ui.bootstrap']);

app.controller('cloud', function ($scope) {

	$scope.threshold = giThreshold;
	$scope.basescale = 40;
	$scope.tweetthreshold = 10;
	
	$scope.showTweets = false;
	// Transforms.

	aCustomTransform = _.map(
		eval(gsCustomTransform),  
		function (pTransform) { 
			return pTransform.length == 3 ? [pTransform[1],pTransform[0]+'|'+pTransform[2]] : null; 
		} 
	);

	$scope.transforms = _.map(
		gaDefaultTransform.concat(aCustomTransform), 
		function (pTransform) {
			return { 
				exp : new RegExp('^('+pTransform[0]+')$'), 
				rep : pTransform[1] ? pTransform[1] : '',
				filter : pTransform[2] ? pTransform[2] : pTransform[0]
			}; 
		} 
	);

    $scope.transformCount = function() {
		return _.size($scope.transforms);
	}

	// Content.

	// TODO when content added dynamically: $scope.content = [];	
	$scope.content = loremipsum;
	$scope.contentTextFunction = function(entity) {
		return entity; // For now, content is an array of strings.
	};
	$scope.contentCount = function() {
		return _.size($scope.content);
	}

	$scope.words = [];
	
	// Filter query.
	
	$scope.query = [];
	
	$scope.addQueryTerm = function(term) {
		$scope.query.push(term);
	}
	
	$scope.resetQuery = function() {
		$scope.query = [];
	}
	
	$scope.queryToString = function() {
		return $scope.query.join(' ');
	}

	// Interface functions.
	
	$scope.initialize = function()
	{
		$scope.query = gsQuery.slice(0); // clone default query
		$scope.words = [];
		$scope.buildCloud();
		$scope.filterContent();
	}

	$scope.more = function() {
		$scope.threshold *= 1.5;
		$scope.buildCloud();
	}
	
	$scope.less = function() {
		$scope.threshold /= 1.5;
		$scope.buildCloud();
	}
	
	$scope.bigger = function() {
		$scope.basescale += 20;
		$scope.buildCloud();
	}
	
	$scope.smaller = function() {
		$scope.basescale -= 20;
		$scope.buildCloud();
	}
	
	$scope.buildCloud =  function() {

		$scope.words = [];

		// Filter content according to the query.
		var filteredContent = _.map(
			$scope.content,
			function(e) { return processText($scope.contentTextFunction(e)); }
		);

		_.each($scope.query, function(term) {
			filteredContent = _.filter(filteredContent, function(s) {
				return s.match(new RegExp(term));
			});
		});
		
		// Reduce all content to a single string to process.
		var oWords = _.reduce(
			filteredContent, 
			function(a,entry) { 
				entryarray = entry.split(' ');
				a.push.apply(a,entryarray);
				return a;
			},
			[]
		);
	
		oWords.sort();
		
		var count = function (a,w) { 
			if (w.length <= 2) return a;
			w = _.reduce($scope.transforms, function(memo,filter) { return memo.replace(filter.exp,filter.rep); }, w); 
			if (w!= '') { a[w] = (a[w] || 0) + 1; } 
			return a;
		};

		// Generate word counts.
		var oSums = _.reduce(oWords,count,[]);
		iGrandTotal = 0;
		iMaxFreq = -Infinity;
		for (word in oSums) {
			count = oSums[word];		
			iGrandTotal += count;
			if (iMaxFreq < count) { iMaxFreq = count; }
		}

		// Build the cloud.
		// Size the words based on the frequency distribution.
		for (oSum in oSums) {
			var iFreq = oSums[oSum];
			if ((iFreq*$scope.threshold) > (iMaxFreq || 0)) {
				var wordArray = oSum.split('|')
				var word = wordArray[0];
				var filter = (wordArray.length == 2) ? wordArray[1] : word;

				var scale = $scope.basescale + 4*iFreq;

				$scope.words.push({
					'word' : word,
					'filter' : filter,
					'style' : { "font-size": ""+scale+"%" }
				});
			}
		} // for each sum
	}
	
	$scope.matches = [];
	$scope.resultCount = 0;
	
	$scope.filterContent = function() {
		var filteredContent = $scope.content.slice(0);
		_.each($scope.query, function(term) {
			filteredContent = _.filter(filteredContent, function(s) {
				return s.match(new RegExp(term,'gi'));
			});
		});
		$scope.matches = filteredContent;
		$scope.resultCount = _.size($scope.matches);
		
		$scope.showTweets = ($scope.resultCount <= $scope.tweetthreshold);
	}

	$scope.initialize(); // do this by default

}); // controller 'cloud'

