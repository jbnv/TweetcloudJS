// Page parameters
var gsOriginalQuery = '{$q}'.replace(/\s+/g,'+').replace(/"/g,"%23");
var gsQuery = []; //TODO Translate original query into an array
var giThreshold = '{$threshold}'; if ((giThreshold == '') || (giThreshold[0] == '{')) giThreshold = 40;
var giTweetCount = '{$tweetcount}'; if ((giTweetCount == '') || (giTweetCount[0] == '{')) giTweetCount = 40;
var goFeedResult;
var gsCustomFilters = "{$custom}"; if (gsCustomFilters[0] == '{') gsCustomFilters = '';

var gaCustomFilters = _.map(eval(gsCustomFilters),  function (pFilter) { return pFilter.length == 3 ? [pFilter[1],pFilter[0]+'|'+pFilter[2]] : null; } );

var gaFilter = _.map(gaDefaultFilter.concat(gaCustomFilters), function (pFilter) { return { exp : new RegExp('^('+pFilter[0]+')$'), rep : pFilter[1] }; } );

// ----------------------------------------------------------------------------------------------------

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


// Put the tweets in the global array.
function processFeed(oFeedResult)
{
    goFeedResult = oFeedResult;

    // Clear content.
    $("#content > *").remove();
    $("#content").html("");

    if (goFeedResult.error)
     $("#content").html("Unable to build feed: "+goFeedResult.error.message);
    else
     if (goFeedResult.feed.entries.length > giTweetCount) buildCloud(); else buildTable();

    $("#count").html(goFeedResult.feed.entries.length);
}

// content: array of stuff to display.
// selector: function that transforms stuff entry into parsable string.
// Twitter parameters: (goFeedResult.feed.entries, function(entry) { return entry.title; })
// Lorem ipsum parameters: (loremipsum, function(entry) { return entry; } )
// Returns: [ { word: 'word', count: count } ]
function buildCloudArray(content,selector)
{

} // buildCloudArray
	

function buildTable()
{/*
  $("#more").hide();
  $("#less").hide();

  _.each(goFeedResult.feed.entries, function(oEntry)
  {
     var eBlock = document.createElement("blockquote");
     eBlock.setAttribute('class', 'twitter-tweet');

     var eP = document.createElement("p");
     eP.innerHTML = oEntry.content;  //.replace(/\<\/?b\>/g,''); // remove boldface
     eBlock.appendChild(eP);

     eBlock.appendChild(document.createTextNode("\u2014 "+oEntry.author.replace(/^(\w+) \((.+)\)$/g,"$2 (\@$1)")+" "));

     var eTimeCellContent = document.createElement('a');
     eTimeCellContent.href = oEntry.link;
     eTimeCellContent.setAttribute('data-datetime', oEntry.publishedDate);
     eTimeCellContent.appendChild(document.createTextNode(formatDateFromTwitter(oEntry.publishedDate)));
     eTimeCellContent.style.textDecoration = "none";
     eBlock.appendChild(eTimeCellContent);

     //$("#content").append(eBlock);
     document.getElementById("content").appendChild(eBlock);
  });

  twttr.widgets.load();
*/}

// ----------------------------------------------------------------------------------------------------
// Angular implementation.

var app = angular.module('tweetcloud', []);

app.controller('cloud', function ($scope) {

    $scope.filterCount = function() {
		return _.size(gaFilter);
	}

	// Content.

	$scope.content = loremipsum; // TODO Change this to [] when content added dynamically.
	$scope.contentTextFunction = function(entity) {
		return entity; // For now, content is an array of strings.
	};
	$scope.contentCount = function() {
		return _.size($scope.content);
	}

	$scope.words = [];
	
	// Filters.
	
	$scope.query = [];
	
	$scope.addQueryTerm = function(filter) {
		$scope.query.push(filter);
	}
	
	$scope.resetQuery = function() {
		$scope.query = [];
	}

	// Interface functions.
	
	$scope.initialize = function()
	{
		$scope.query = gsQuery;
		$scope.words = [];
		$scope.buildCloud();
	}

	$scope.more = function() {
		console.log("TODO giThreshold*=2;processFeed(goFeedResult);");
	}
	
	$scope.less = function() {
		console.log("TODO giThreshold/=2.0;processFeed(goFeedResult);");
	}
	
	$scope.revert = function() {
		console.log("TODO gsQuery=gsOriginalQuery;initialize();");
	}
	
	$scope.buildCloud =  function() {

		$scope.words = [];

		// Filter content according to the query.
		var filteredContent = _.map(
			$scope.content,
			function(e) { return processText($scope.contentTextFunction(e)); }
		);

//console.log('$scope.query',$scope.query);
		for (var term in $scope.query) {
//console.log('applying term',term);
			filteredContent = _.filter(filteredContent, function(s) {
				return s.match(new RegExp(term));
			});
		}
//console.log('filter 2',filteredContent);
		
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
			w = _.reduce(gaFilter, function(memo,filter) { return memo.replace(filter.exp,filter.rep); }, w); 
			if (w!= '') { a[w] = (a[w] || 0) + 1; } 
			return a;
		};

		// Generate word counts.
		var oSums = _.reduce(oWords,count,[]);
		
		var iGrandTotal = _.reduce(oSums, function(sum,o){ return sum+o; }, 0);
		var iMaxFreq = _.max(oSums, function(o){return o;})

		// Build the cloud.
		// Size the words based on the frequency distribution.
		for (oSum in oSums) {
			var iFreq = oSums[oSum];
			if ((iFreq*giThreshold) > (iMaxFreq || 0)) {
				var wordArray = oSum.split('|')
				var word = wordArray[0];
				var eWordQuery = (wordArray.length == 2) ? wordArray[1] : word;

				var scale = 100+4*iFreq;

				$scope.words.push({
					'word' : word+'('+scale+')',
					'filter' : word, //TODO Apply substitute filter.
					'style' : "{ font-size: "+scale+"%; }"
				});
			}
		} // for each sum
	}

	$scope.initialize(); // do this by default

}); // controller 'cloud'

